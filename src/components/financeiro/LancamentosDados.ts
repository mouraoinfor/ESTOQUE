import "server-only";
import { db, query } from "@/lib/db";
import { SELECT_LANCAMENTO, SQL_GERAR_RECORRENCIAS, type Lancamento, type TipoLancamento } from "@/lib/financeiro";

export interface LancamentoLinha extends Lancamento {
  nota_numero: string | null;
  competencia: string | null;
}

export interface Parte {
  id: string;
  nome: string;
  documento: string | null;
}

export interface BancoOpcao {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface RecorrenciaLinha {
  id: string;
  descricao: string;
  parte_id: string | null;
  parte_nome: string | null;
  dia_vencimento: number;
  valor: number;
  banco_id: string | null;
  banco_nome: string | null;
  inicio: string;
  fim: string | null;
  ativo: boolean;
  abertos_futuros: number;
}

// Gera os lançamentos das contas fixas e remove de novo os meses que o usuário excluiu
// (recorrencias.pular), já que a geração recria qualquer mês que estiver faltando.
// As duas vão numa transação: uma ida só ao banco, executadas em ordem.
export async function prepararRecorrencias(empresaId: string) {
  const sql = db();
  await sql.transaction([
    sql.query(SQL_GERAR_RECORRENCIAS, [empresaId]),
    sql.query(
      `delete from lancamentos l
         using recorrencias r
        where l.recorrencia_id = r.id and r.empresa_id = $1 and l.empresa_id = $1
          and l.status = 'aberto' and l.competencia = any(r.pular)
          and not exists (select 1 from movimentos_bancarios m where m.lancamento_id = l.id)`,
      [empresaId]
    ),
  ]);
}

export function tabelaParte(tipo: TipoLancamento) {
  return tipo === "pagar" ? "fornecedores" : "clientes";
}

export async function listarLancamentos(empresaId: string, tipo: TipoLancamento) {
  return query<LancamentoLinha>(
    `select x.*, n.numero as nota_numero, l2.competencia::text as competencia
       from (${SELECT_LANCAMENTO} where l.empresa_id = $1 and l.tipo = $2) x
       join lancamentos l2 on l2.id = x.id
       left join notas_fiscais n on n.id = x.nota_id
      order by x.vencimento, x.descricao`,
    [empresaId, tipo]
  );
}

export async function listarBancos(empresaId: string) {
  return query<BancoOpcao>("select id, nome, ativo from bancos where empresa_id = $1 order by ativo desc, nome", [empresaId]);
}

// No contas a pagar entram também os funcionários (id "func:<id>"), para reembolsos e adiantamentos
export const PREFIXO_FUNCIONARIO = "func:";
export async function listarPartes(tipo: TipoLancamento, comFuncionarios = false) {
  if (tipo !== "pagar" || !comFuncionarios) return query<Parte>(`select id, nome, documento from ${tabelaParte(tipo)} order by nome`);
  return query<Parte>(
    `select id::text as id, nome, documento from fornecedores
     union all
     select '${PREFIXO_FUNCIONARIO}' || id, nome || ' · funcionário', null from funcionarios where ativo
     order by nome`
  );
}

export async function listarRecorrencias(empresaId: string, tipo: TipoLancamento, hoje: string) {
  return query<RecorrenciaLinha>(
    `select r.id, r.descricao, coalesce(r.fornecedor_id, r.cliente_id) as parte_id, coalesce(f.nome, c.nome) as parte_nome,
            r.dia_vencimento, r.valor, r.banco_id, b.nome as banco_nome,
            r.inicio::text as inicio, r.fim::text as fim, r.ativo,
            (select count(*)::int from lancamentos l
              where l.recorrencia_id = r.id and l.status = 'aberto' and l.vencimento >= $3::date) as abertos_futuros
       from recorrencias r
       left join fornecedores f on f.id = r.fornecedor_id
       left join clientes c on c.id = r.cliente_id
       left join bancos b on b.id = r.banco_id
      where r.empresa_id = $1 and r.tipo = $2
      order by r.ativo desc, r.dia_vencimento, r.descricao`,
    [empresaId, tipo, hoje]
  );
}
