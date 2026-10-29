import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import ListaOrcamentos, { type LinhaOrcamento } from "@/components/orcamentos/ListaOrcamentos";
import "./orcamentos.css";

export const dynamic = "force-dynamic";

export default async function OrcamentosPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await exigirAcesso("orcamentos");
  const { tipo } = await searchParams;
  const [linhas, [resumo]] = await Promise.all([
    query<LinhaOrcamento>(
      `select o.id, o.numero, o.titulo, o.tipo, coalesce(c.nome, o.cliente_nome) as cliente_nome, o.status,
              o.created_at::date::text as data, o.validade::text as validade,
              greatest(coalesce(t.subtotal, 0) - o.desconto, 0) as total, coalesce(t.itens, 0) as itens
         from orcamentos o
         left join clientes c on c.id = o.cliente_id
         left join lateral (select sum(quantidade * valor_unitario) as subtotal, count(*)::int as itens
                              from orcamento_itens where orcamento_id = o.id) t on true
        order by o.numero desc`
    ),
    query<{ abertos: number; aguardando: number; aprovado_mes: number }>(
      `select count(*) filter (where o.status = 'rascunho')::int as abertos,
              count(*) filter (where o.status = 'aprovado')::int as aguardando,
              coalesce(sum(greatest(coalesce(t.subtotal, 0) - o.desconto, 0)) filter (
                where o.status in ('aprovado', 'baixado')
                  and date_trunc('month', o.aprovado_em at time zone 'America/Sao_Paulo') = date_trunc('month', now() at time zone 'America/Sao_Paulo')
              ), 0) as aprovado_mes
         from orcamentos o
         left join lateral (select sum(quantidade * valor_unitario) as subtotal from orcamento_itens where orcamento_id = o.id) t on true`
    ),
  ]);
  return <ListaOrcamentos linhas={linhas} resumo={resumo} tipoInicial={tipo === "venda" || tipo === "projeto" || tipo === "fechado" ? tipo : ""} />;
}
