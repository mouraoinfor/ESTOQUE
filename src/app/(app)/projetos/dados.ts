import { query } from "@/lib/db";
import type { GastoProjeto, ResumoProjeto } from "@/components/projetos/tipos";

// Projetos fechados (orçamento tipo projeto aprovado ou baixado) com contrato, gastos e recebimentos
export async function resumoProjetos(id?: string) {
  return query<ResumoProjeto>(
    `select o.id, o.numero, o.titulo, coalesce(c.nome, o.cliente_nome) as cliente_nome, o.status,
            (o.aprovado_em at time zone 'America/Sao_Paulo')::date::text as aprovado_em,
            coalesce(o.valor_contrato, greatest(coalesce(t.subtotal, 0) - o.desconto, 0)) as contrato,
            coalesce(t.custo, 0) as custo_previsto,
            case when o.status = 'baixado' then coalesce(t.custo_estoque, 0) else 0 end as material_baixado,
            coalesce(g.total, 0) as gastos,
            coalesce(r.recebido, 0) as recebido,
            coalesce(r.a_receber, 0) as a_receber
       from orcamentos o
       left join clientes c on c.id = o.cliente_id
       left join lateral (
         select sum(quantidade * valor_unitario) as subtotal,
                sum(quantidade * coalesce(custo_unitario, 0)) as custo,
                sum(quantidade * coalesce(custo_unitario, 0)) filter (where produto_id is not null) as custo_estoque
           from orcamento_itens where orcamento_id = o.id) t on true
       left join lateral (select sum(quantidade * valor_unitario) as total from projeto_gastos where orcamento_id = o.id) g on true
       left join lateral (
         select sum(valor) filter (where status = 'pago') as recebido,
                sum(valor) filter (where status = 'aberto') as a_receber
           from lancamentos where orcamento_id = o.id and tipo = 'receber') r on true
      where o.tipo = 'projeto' and o.status in ('aprovado', 'baixado') ${id ? "and o.id = $1" : ""}
      order by o.aprovado_em desc nulls last, o.numero desc`,
    id ? [id] : []
  );
}

export async function gastosDoProjeto(id: string) {
  return query<GastoProjeto>(
    `select g.id, g.data::text as data, g.categoria, g.descricao, g.produto_id, p.codigo as produto_codigo,
            g.quantidade, g.valor_unitario, g.baixou_estoque, g.lancamento_id, l.status as conta_status, g.usuario
       from projeto_gastos g
       left join produtos p on p.id = g.produto_id
       left join lancamentos l on l.id = g.lancamento_id
      where g.orcamento_id = $1
      order by g.data desc, g.created_at desc`,
    [id]
  );
}
