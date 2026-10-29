import "server-only";
import { query } from "@/lib/db";

// Consultas de leitura da conciliação e do extrato (usadas pelas páginas e pelas ações).
// Quem chama já validou o acesso e a empresa atual.

export interface MovimentoExtrato {
  id: string;
  banco_id: string;
  data: string;
  descricao: string;
  tipo: "credito" | "debito";
  valor: number;
  origem: "baixa" | "extrato" | "transferencia";
  lancamento_id: string | null;
  transferencia_id: string | null;
  fitid: string | null;
  lanc_tipo: "pagar" | "receber" | null;
  lanc_descricao: string | null;
  lanc_parte: string | null;
  lanc_vencimento: string | null;
  contra_banco: string | null; // outro lado da transferência
  contra_empresa: string | null;
  contra_mesma_empresa: boolean | null;
}

export interface Sugestao {
  movimento_id: string;
  id: string;
  descricao: string;
  parte_nome: string | null;
  vencimento: string;
  valor: number;
  documento: string | null;
  dias: number; // distância entre vencimento e data do movimento
}

const SELECT_MOVIMENTO = `
  select m.id, m.banco_id, m.data::text as data, m.descricao, m.tipo, m.valor, m.origem,
         m.lancamento_id, m.transferencia_id, m.fitid,
         l.tipo as lanc_tipo, l.descricao as lanc_descricao, coalesce(f.nome, cl.nome, fu.nome) as lanc_parte,
         l.vencimento::text as lanc_vencimento,
         cb.nome as contra_banco, ce.nome as contra_empresa, (cb.empresa_id = m.empresa_id) as contra_mesma_empresa
    from movimentos_bancarios m
    left join lancamentos l on l.id = m.lancamento_id
    left join fornecedores f on f.id = l.fornecedor_id
    left join clientes cl on cl.id = l.cliente_id
    left join funcionarios fu on fu.id = l.funcionario_id
    left join movimentos_bancarios c on c.transferencia_id = m.transferencia_id and c.id <> m.id
    left join bancos cb on cb.id = c.banco_id
    left join empresas ce on ce.id = cb.empresa_id`;

// Movimentos de um banco no período (mais antigos primeiro, para o saldo acumulado)
export function movimentosDoPeriodo(bancoId: string, de: string, ate: string) {
  return query<MovimentoExtrato>(
    `${SELECT_MOVIMENTO}
      where m.banco_id = $1 and m.data between $2 and $3
      order by m.data, m.created_at, m.id`,
    [bancoId, de, ate]
  );
}

// Saldo inicial + movimentos ANTES da data (exclusive)
export async function saldoAntesDe(bancoId: string, data: string) {
  const [r] = await query<{ saldo: number }>(
    `select b.saldo_inicial + coalesce((select sum(case when m.tipo = 'credito' then m.valor else -m.valor end)
                                          from movimentos_bancarios m where m.banco_id = b.id and m.data < $2), 0) as saldo
       from bancos b where b.id = $1`,
    [bancoId, data]
  );
  return r?.saldo ?? 0;
}

// Saldo inicial + movimentos ATÉ a data (inclusive)
export async function saldoAte(bancoId: string, data: string) {
  const [r] = await query<{ saldo: number }>(
    `select b.saldo_inicial + coalesce((select sum(case when m.tipo = 'credito' then m.valor else -m.valor end)
                                          from movimentos_bancarios m where m.banco_id = b.id and m.data <= $2), 0) as saldo
       from bancos b where b.id = $1`,
    [bancoId, data]
  );
  return r?.saldo ?? 0;
}

// Movimentos do extrato sem lançamento ligado
export function pendentesDoPeriodo(bancoId: string, de: string, ate: string) {
  return query<MovimentoExtrato>(
    `${SELECT_MOVIMENTO}
      where m.banco_id = $1 and m.data between $2 and $3 and m.origem = 'extrato' and m.lancamento_id is null
      order by m.data, m.created_at, m.id`,
    [bancoId, de, ate]
  );
}

// Movimentos do extrato já ligados a um lançamento
export function conciliadosDoPeriodo(bancoId: string, de: string, ate: string) {
  return query<MovimentoExtrato>(
    `${SELECT_MOVIMENTO}
      where m.banco_id = $1 and m.data between $2 and $3 and m.origem = 'extrato' and m.lancamento_id is not null
      order by m.data, m.created_at, m.id`,
    [bancoId, de, ate]
  );
}

// Para cada pendente do período: lançamentos em aberto da mesma empresa, mesmo tipo
// (débito = pagar, crédito = receber), mesmo valor (±0,01) e vencimento a até 10 dias.
export function sugestoesDoPeriodo(empresaId: string, bancoId: string, de: string, ate: string) {
  return query<Sugestao>(
    `select m.id as movimento_id, l.id, l.descricao, coalesce(f.nome, c.nome, fu.nome) as parte_nome,
            l.vencimento::text as vencimento, l.valor, l.documento, abs(l.vencimento - m.data)::int as dias
       from movimentos_bancarios m
       join lancamentos l on l.empresa_id = m.empresa_id and l.status = 'aberto'
                          and l.tipo = case m.tipo when 'debito' then 'pagar' else 'receber' end
                          and abs(l.valor - m.valor) <= 0.0100001
                          and abs(l.vencimento - m.data) <= 10
       left join fornecedores f on f.id = l.fornecedor_id
       left join clientes c on c.id = l.cliente_id
       left join funcionarios fu on fu.id = l.funcionario_id
      where m.empresa_id = $1 and m.banco_id = $2 and m.data between $3 and $4
        and m.origem = 'extrato' and m.lancamento_id is null
      order by m.id, abs(l.vencimento - m.data), abs(l.valor - m.valor), l.vencimento`,
    [empresaId, bancoId, de, ate]
  );
}
