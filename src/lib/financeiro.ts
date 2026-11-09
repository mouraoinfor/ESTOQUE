import "server-only";
import { db, query } from "./db";

// ---------------------------------------------------------------------
// Regras do financeiro (contrato entre as telas):
// - Saldo de um banco = saldo_inicial + créditos − débitos de movimentos_bancarios.
// - Dar baixa num lançamento com banco cria UM movimento bancário ligado a ele (lancamento_id).
// - Conciliação liga um movimento do extrato sem lançamento a um lançamento em aberto
//   (marca o lançamento como pago, sem criar outro movimento).
// - Estornar uma baixa apaga o movimento criado por ela e reabre o lançamento.
// - Datas trafegam como texto "AAAA-MM-DD" (selecione com ::text).
// ---------------------------------------------------------------------

export type TipoLancamento = "pagar" | "receber";

export interface Banco {
  id: string;
  empresa_id: string;
  nome: string;
  agencia: string | null;
  conta: string | null;
  saldo_inicial: number;
  saldo_inicial_em: string;
  limite: number; // cheque especial / conta garantida
  ativo: boolean;
}

export interface BancoComSaldo extends Banco {
  saldo: number;
}

export interface Lancamento {
  id: string;
  empresa_id: string;
  tipo: TipoLancamento;
  descricao: string;
  fornecedor_id: string | null;
  cliente_id: string | null;
  funcionario_id: string | null; // conta a pagar para funcionário (reembolso, adiantamento)
  parte_nome: string | null; // nome do fornecedor/cliente (join)
  vencimento: string;
  valor: number;
  banco_id: string | null;
  banco_nome: string | null;
  status: "aberto" | "pago";
  pago_em: string | null;
  documento: string | null;
  observacoes: string | null;
  nota_id: string | null;
  recorrencia_id: string | null;
}

export interface Movimento {
  id: string;
  empresa_id: string;
  banco_id: string;
  data: string;
  descricao: string;
  tipo: "credito" | "debito";
  valor: number;
  lancamento_id: string | null;
  transferencia_id: string | null;
  origem: "baixa" | "extrato" | "transferencia";
}

// Compras no cartão de crédito (contas a pagar com forma 'cartao_credito') ficam fora dos totais,
// das listas de contas a pagar, do relatório e da conciliação: aparecem só na aba "Compras no crédito".
// Use dentro do where/on: and ${foraCredito("l")}
export function foraCredito(alias = "") {
  const a = alias ? `${alias}.` : "";
  return `not (${a}tipo = 'pagar' and coalesce(${a}forma_pagamento, '') = 'cartao_credito')`;
}

// SELECT padrão de lançamentos com nome da parte e do banco
export const SELECT_LANCAMENTO = `
  select l.id, l.empresa_id, l.tipo, l.descricao, l.fornecedor_id, l.cliente_id, l.funcionario_id,
         coalesce(f.nome, c.nome, fu.nome) as parte_nome,
         l.vencimento::text as vencimento, l.valor, l.banco_id, b.nome as banco_nome,
         l.status, l.pago_em::text as pago_em, l.documento, l.observacoes, l.nota_id, l.recorrencia_id
    from lancamentos l
    left join fornecedores f on f.id = l.fornecedor_id
    left join clientes c on c.id = l.cliente_id
    left join funcionarios fu on fu.id = l.funcionario_id
    left join bancos b on b.id = l.banco_id`;

export async function bancosComSaldo(empresaId: string) {
  return query<BancoComSaldo>(
    `select b.id, b.empresa_id, b.nome, b.agencia, b.conta, b.saldo_inicial,
            b.saldo_inicial_em::text as saldo_inicial_em, b.limite, b.ativo,
            b.saldo_inicial + coalesce(sum(case when m.tipo = 'credito' then m.valor else -m.valor end), 0) as saldo
       from bancos b
       left join movimentos_bancarios m on m.banco_id = b.id
      where b.empresa_id = $1
      group by b.id
      order by b.ativo desc, b.nome`,
    [empresaId]
  );
}

// Cria os lançamentos das contas fixas até o mês seguinte ao atual (idempotente:
// o índice único (recorrencia_id, competencia) impede duplicar; meses em recorrencias.pular são ignorados)
export const SQL_GERAR_RECORRENCIAS = `insert into lancamentos (empresa_id, tipo, descricao, fornecedor_id, cliente_id, vencimento, valor, banco_id, recorrencia_id, competencia)
     select r.empresa_id, r.tipo, r.descricao, r.fornecedor_id, r.cliente_id,
            -- dia 31 em mês de 30 dias cai no último dia do mês
            least(mes + (r.dia_vencimento - 1) * interval '1 day', mes + interval '1 month' - interval '1 day')::date,
            r.valor, r.banco_id, r.id, mes::date
       from recorrencias r
      cross join lateral generate_series(
              date_trunc('month', r.inicio),
              least(date_trunc('month', coalesce(r.fim, 'infinity'::date)), date_trunc('month', now() + interval '1 month')),
              interval '1 month') as mes
      where r.empresa_id = $1 and r.ativo
        and not (mes::date = any(r.pular))   -- meses excluídos pelo usuário não voltam
     on conflict (recorrencia_id, competencia) where recorrencia_id is not null do nothing`;

// Baixa: marca pago e lança o movimento no banco (numa transação)
export async function darBaixa(lancamentoId: string, data: string, bancoId: string, usuario: string) {
  const sql = db();
  const [l] = await query<{ empresa_id: string; tipo: TipoLancamento; descricao: string; valor: number; status: string }>(
    "select empresa_id, tipo, descricao, valor, status from lancamentos where id = $1",
    [lancamentoId]
  );
  if (!l) throw new Error("Lançamento não encontrado");
  if (l.status === "pago") throw new Error("Este lançamento já está pago");
  await sql.transaction([
    sql.query("update lancamentos set status = 'pago', pago_em = $2, banco_id = $3 where id = $1", [lancamentoId, data, bancoId]),
    sql.query(
      `insert into movimentos_bancarios (empresa_id, banco_id, data, descricao, tipo, valor, lancamento_id, usuario, origem)
       values ($1, $2, $3, $4, $5, $6, $7, $8, 'baixa')`,
      [l.empresa_id, bancoId, data, l.descricao, l.tipo === "pagar" ? "debito" : "credito", l.valor, lancamentoId, usuario]
    ),
  ]);
}

// Estorno: reabre o lançamento e apaga o movimento que a baixa criou.
// Se a baixa veio da conciliação (movimento do extrato), só desliga o movimento.
export async function estornarBaixa(lancamentoId: string) {
  const sql = db();
  await sql.transaction([
    sql.query("delete from movimentos_bancarios where lancamento_id = $1 and origem = 'baixa'", [lancamentoId]),
    sql.query("update movimentos_bancarios set lancamento_id = null where lancamento_id = $1", [lancamentoId]),
    sql.query("update lancamentos set status = 'aberto', pago_em = null where id = $1", [lancamentoId]),
  ]);
}

// ---------------------------------------------------------------------
// Antecipação de boletos (contas a receber)
// - Antecipar: o banco credita o valor no dia (movimento 'baixa' ligado ao lançamento), mas o
//   lançamento continua em aberto até o cliente pagar. A taxa (se houver) vira uma conta a pagar
//   já paga no mesmo banco/dia. Todos do lote recebem o mesmo antecipacao_id.
// - Baixar um antecipado: só marca como pago; o dinheiro já entrou.
// - Desfazer: apaga o crédito da antecipação; a taxa sai junto quando o lote fica vazio.
// Quem chama já validou empresa, tipo 'receber', status e banco.
// ---------------------------------------------------------------------
export async function anteciparLancamentos(
  empresaId: string,
  lancamentos: { id: string; descricao: string; valor: number }[],
  data: string,
  bancoId: string,
  taxa: number,
  usuario: string
) {
  const sql = db();
  const lote = crypto.randomUUID();
  const taxaId = crypto.randomUUID();
  const cmds = lancamentos.flatMap((l) => [
    sql.query(
      `update lancamentos set antecipado_em = $2, antecipacao_id = $3, banco_id = $4
        where id = $1 and status = 'aberto' and antecipado_em is null`,
      [l.id, data, lote, bancoId]
    ),
    // Só credita se o update acima marcou este boleto neste lote (outro clique pode ter antecipado antes)
    sql.query(
      `insert into movimentos_bancarios (empresa_id, banco_id, data, descricao, tipo, valor, lancamento_id, usuario, origem)
       select $1, $2, $3, $4, 'credito', $5, $6, $7, 'baixa'
        where exists (select 1 from lancamentos where id = $6 and antecipacao_id = $8)`,
      [empresaId, bancoId, data, `Antecipação: ${l.descricao}`.slice(0, 500), l.valor, l.id, usuario, lote]
    ),
  ]);
  if (taxa > 0) {
    cmds.push(
      sql.query(
        `insert into lancamentos (id, empresa_id, tipo, descricao, vencimento, valor, banco_id, status, pago_em, antecipacao_id, observacoes)
         values ($1, $2, 'pagar', $3, $4, $5, $6, 'pago', $4, $7, $8)`,
        [
          taxaId, empresaId, `Taxa de antecipação de boletos (${lancamentos.length})`, data, taxa, bancoId, lote,
          lancamentos.map((l) => l.descricao).join("; ").slice(0, 2000),
        ]
      ),
      sql.query(
        `insert into movimentos_bancarios (empresa_id, banco_id, data, descricao, tipo, valor, lancamento_id, usuario, origem)
         values ($1, $2, $3, 'Taxa de antecipação de boletos', 'debito', $4, $5, $6, 'baixa')`,
        [empresaId, bancoId, data, taxa, taxaId, usuario]
      )
    );
  }
  await sql.transaction(cmds);
}

// Cliente pagou o boleto antecipado: só registra a baixa (sem movimento novo)
export async function baixarAntecipado(lancamentoId: string, data: string) {
  await query(
    "update lancamentos set status = 'pago', pago_em = $2 where id = $1 and status = 'aberto' and antecipado_em is not null",
    [lancamentoId, data]
  );
}

// Estorno da baixa de um antecipado: volta a aberto e mantém o crédito da antecipação
export async function estornarBaixaAntecipado(lancamentoId: string) {
  await query("update lancamentos set status = 'aberto', pago_em = null where id = $1 and antecipado_em is not null", [lancamentoId]);
}

// Desfaz a antecipação de um boleto em aberto (o crédito sai do banco)
export async function desfazerAntecipacao(lancamentoId: string) {
  const sql = db();
  // Taxa do lote: sai quando este era o último boleto antecipado do lote
  const loteVazio = `exists (select 1 from lancamentos a where a.id = $1 and a.antecipacao_id is not null)
    and not exists (select 1 from lancamentos o where o.antecipacao_id = (select antecipacao_id from lancamentos where id = $1)
                     and o.tipo = 'receber' and o.id <> $1)`;
  const taxas = `select t.id from lancamentos t where t.tipo = 'pagar'
                    and t.antecipacao_id = (select antecipacao_id from lancamentos where id = $1)`;
  await sql.transaction([
    sql.query(`delete from movimentos_bancarios where origem = 'baixa' and lancamento_id in (${taxas}) and ${loteVazio}`, [lancamentoId]),
    sql.query(`delete from lancamentos where id in (${taxas}) and ${loteVazio}`, [lancamentoId]),
    sql.query("delete from movimentos_bancarios where lancamento_id = $1 and origem = 'baixa'", [lancamentoId]),
    sql.query(
      "update lancamentos set antecipado_em = null, antecipacao_id = null where id = $1 and status = 'aberto'",
      [lancamentoId]
    ),
  ]);
}
