import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { CONDICAO_LABEL, STATUS_LABEL, type Movimentacao, type Produto } from "@/lib/types";
import ProdutoForm from "@/components/ProdutoForm";
import MovimentarBox from "@/components/MovimentarBox";
import Fotos from "@/components/Fotos";
import AnuncioPronto from "@/components/AnuncioPronto";
import ExcluirBotao from "@/components/ExcluirBotao";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [[p], movs, fotos] = await Promise.all([
    query<Produto>("select * from produtos where id = $1", [id]),
    query<Movimentacao>("select * from movimentacoes where produto_id = $1 order by created_at desc limit 50", [id]),
    query<{ id: string }>("select id from fotos where produto_id = $1 order by ordem, created_at", [id]),
  ]);
  if (!p) notFound();

  return (
    <>
      <p className="small"><Link href="/itens">← Voltar para itens</Link></p>
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ marginBottom: ".25rem" }}>#{p.codigo} · {p.nome}</h1>
          <div className="actions">
            <span className={`badge ${p.condicao}`}>{CONDICAO_LABEL[p.condicao]}</span>
            <span className={`badge ${p.status}`}>{STATUS_LABEL[p.status]}</span>
            {p.confianca && <span className={`badge ${p.confianca}`}>pesquisa: confiança {p.confianca}</span>}
            <span className="muted">Em estoque: <strong style={{ color: "var(--text)" }}>{p.quantidade}</strong></span>
          </div>
        </div>
        <ExcluirBotao id={p.id} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))", gap: "1rem", alignItems: "start" }}>
        <div>
          <ProdutoForm produto={p} />
          <MovimentarBox produtoId={p.id} />
          <div className="card">
            <h3>Histórico</h3>
            {!movs.length && <p className="muted small">Sem movimentações.</p>}
            {movs.map((m) => (
              <div key={m.id} className="small" style={{ padding: ".35rem 0", borderBottom: "1px solid var(--border)" }}>
                <strong className={m.quantidade >= 0 ? "diff-pos" : "diff-neg"}>{m.quantidade > 0 ? "+" : ""}{m.quantidade}</strong>{" "}
                {m.tipo} · saldo {m.saldo_apos} · {new Date(m.created_at).toLocaleString("pt-BR")}
                {m.motivo && <> · {m.motivo}</>}
                {m.usuario && <span className="muted"> · {m.usuario}</span>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <AnuncioPronto produto={p} />
          <Fotos produtoId={p.id} fotos={fotos.map((f) => f.id)} />
        </div>
      </div>
    </>
  );
}
