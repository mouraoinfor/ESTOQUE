import Link from "next/link";
import { query } from "@/lib/db";
import { brl, STATUS_LABEL, type Produto, type Status } from "@/lib/types";

export const dynamic = "force-dynamic";

const ORDEM: Status[] = ["pronto", "a_revisar", "anunciado", "vendido"];

export default async function Anuncios() {
  const produtos = await query<Produto>("select * from produtos where para_venda order by codigo");

  return (
    <>
      <h1>Anúncios</h1>
      <p className="muted">
        Itens novos vão para o <span className="badge ml">Mercado Livre</span> e usados para a <span className="badge olx">OLX</span>.
        Abra o item para copiar título, descrição e ficha técnica. Depois de publicar, cole o link e mude o status para &quot;Anunciado&quot;.
      </p>
      {ORDEM.map((st) => {
        const lista = produtos.filter((p) => p.status === st);
        if (!lista.length) return null;
        return (
          <div key={st} className="card">
            <h2>{STATUS_LABEL[st]} <span className="muted small">({lista.length})</span></h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Produto</th><th>Canal</th><th className="num">Qtd</th><th className="num">Preço</th><th className="hide-sm">Pendências</th></tr>
                </thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/itens/${p.id}`}><strong>{p.canal === "olx" ? p.titulo_olx || p.nome : p.titulo_ml || p.nome}</strong></Link>
                        {p.link_anuncio && <div className="small"><a href={p.link_anuncio} target="_blank" rel="noreferrer">ver anúncio ↗</a></div>}
                      </td>
                      <td>{p.canal === "olx" ? <span className="badge olx">OLX</span> : p.canal === "ambos" ? <><span className="badge ml">ML</span> <span className="badge olx">OLX</span></> : <span className="badge ml">ML</span>}</td>
                      <td className="num">{p.quantidade}</td>
                      <td className="num">{brl(p.preco_venda ?? p.preco_sugerido)}</td>
                      <td className="hide-sm small" style={{ color: "var(--warn)", maxWidth: 420 }}>{p.pendencias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
