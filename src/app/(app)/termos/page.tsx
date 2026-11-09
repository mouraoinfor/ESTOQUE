import Link from "next/link";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { dataBR, formatarDocumento } from "@/lib/formato";
import Icone from "@/components/Icone";
import "./termos.css";

export const dynamic = "force-dynamic";

interface Linha {
  id: string;
  numero: number;
  data: string;
  recebedor_nome: string;
  recebedor_documento: string | null;
  orcamento_numero: number | null;
  orcamento_titulo: string | null;
  itens: number;
  unidades: number;
  resumo: string | null;
}

export default async function TermosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await exigirAcesso("termos");
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const linhas = await query<Linha>(
    `select t.id, t.numero, t.data::text as data, t.recebedor_nome, t.recebedor_documento,
            o.numero as orcamento_numero, o.titulo as orcamento_titulo,
            coalesce(i.itens, 0) as itens, coalesce(i.unidades, 0) as unidades, i.resumo
       from termos_entrega t
       left join orcamentos o on o.id = t.orcamento_id
       left join lateral (
         select count(*)::int as itens, sum(quantidade)::float8 as unidades,
                string_agg(descricao, ', ' order by ordem) as resumo
           from termo_entrega_itens where termo_id = t.id
       ) i on true
      where $1 = '' or t.recebedor_nome ilike '%' || $1 || '%' or i.resumo ilike '%' || $1 || '%'
         or t.numero::text = $1 or o.titulo ilike '%' || $1 || '%'
      order by t.data desc, t.numero desc
      limit 500`,
    [q]
  );

  return (
    <>
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>Termos de entrega</h1>
        <Link className="btn primary" href="/termos/novo"><Icone nome="novo" tamanho={16} /> Novo termo</Link>
      </div>
      <form className="filters" action="/termos">
        <input type="search" name="q" defaultValue={q} placeholder="Buscar recebedor, item, projeto ou nº..." />
        <button className="btn" type="submit">Buscar</button>
        {q && <Link className="btn" href="/termos">Limpar</Link>}
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="num">Nº</th>
              <th>Data</th>
              <th>Recebedor</th>
              <th className="hide-sm">Materiais</th>
              <th className="hide-sm">Projeto</th>
              <th className="num">Itens</th>
              <th className="num"></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((t) => (
              <tr key={t.id}>
                <td className="num"><Link href={`/termos/${t.id}`} data-abrir>{t.numero}</Link></td>
                <td>{dataBR(t.data)}</td>
                <td>
                  <strong>{t.recebedor_nome}</strong>
                  {t.recebedor_documento && <div className="small muted">{formatarDocumento(t.recebedor_documento)}</div>}
                </td>
                <td className="hide-sm small muted"><div className="termo-resumo" title={t.resumo ?? ""}>{t.resumo ?? "—"}</div></td>
                <td className="hide-sm small">{t.orcamento_numero ? `#${t.orcamento_numero} · ${t.orcamento_titulo}` : <span className="muted">—</span>}</td>
                <td className="num">{t.itens}<div className="small muted">{t.unidades.toLocaleString("pt-BR")} un.</div></td>
                <td className="num">
                  <Link className="btn small" href={`/termo-impressao/${t.id}`} target="_blank" title="Imprimir"><Icone nome="imprimir" tamanho={14} /></Link>
                </td>
              </tr>
            ))}
            {!linhas.length && (
              <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: "2rem" }}>
                {q ? "Nenhum termo encontrado." : "Nenhum termo de entrega ainda. Clique em Novo termo."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
