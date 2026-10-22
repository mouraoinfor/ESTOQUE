import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import ListaNotas, { type NotaLista } from "@/components/notas/ListaNotas";
import "./notas.css";

export const dynamic = "force-dynamic";

export default async function NotasPage() {
  await exigirAcesso("notas");
  const notas = await query<NotaLista>(
    `select n.id, n.numero, n.serie, n.chave, (n.emissao at time zone 'America/Sao_Paulo')::date::text as emissao,
            n.valor_total, n.empresa_id, e.nome as empresa, f.nome as fornecedor, f.documento as fornecedor_doc,
            (select count(*)::int from nota_itens i where i.nota_id = n.id) as itens,
            (select count(*)::int from lancamentos l where l.nota_id = n.id) as parcelas,
            (select count(*)::int from lancamentos l where l.nota_id = n.id and l.status = 'pago') as pagas
       from notas_fiscais n
       left join empresas e on e.id = n.empresa_id
       left join fornecedores f on f.id = n.fornecedor_id
      order by n.emissao desc nulls last, n.created_at desc`
  );
  return <ListaNotas notas={notas} />;
}
