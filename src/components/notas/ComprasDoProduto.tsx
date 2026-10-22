import Link from "next/link";
import { sessaoAtual } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl, dataBR } from "@/lib/formato";
import { podeAcessar } from "@/lib/modulos";

interface Compra {
  nota_id: string;
  numero: string | null;
  emissao: string | null;
  fornecedor: string | null;
  quantidade: number;
  unidade: string | null;
  quantidade_estoque: number;
  custo_unitario: number | null;
}

// Server component: notas fiscais em que o produto entrou (para a tela do produto)
export default async function ComprasDoProduto({ produtoId }: { produtoId: string }) {
  const s = await sessaoAtual();
  if (!s) return null;
  const compras = await query<Compra>(
    `select n.id as nota_id, n.numero, (n.emissao at time zone 'America/Sao_Paulo')::date::text as emissao,
            f.nome as fornecedor, i.quantidade, i.unidade, i.quantidade_estoque, i.custo_unitario
       from nota_itens i
       join notas_fiscais n on n.id = i.nota_id
       left join fornecedores f on f.id = n.fornecedor_id
      where i.produto_id = $1
      order by n.emissao desc nulls last, n.created_at desc
      limit 30`,
    [produtoId]
  );
  const linkNota = podeAcessar(s, "notas");

  return (
    <div className="card">
      <h3>Compras (notas fiscais)</h3>
      {!compras.length && <p className="muted small">Este produto ainda não entrou por nenhuma nota fiscal importada.</p>}
      {compras.map((c, k) => (
        <div key={`${c.nota_id}-${k}`} className="small" style={{ padding: ".35rem 0", borderBottom: "1px solid var(--border)" }}>
          <strong>{dataBR(c.emissao)}</strong> ·{" "}
          {linkNota ? <Link href={`/notas/${c.nota_id}`}>NF {c.numero}</Link> : <>NF {c.numero}</>} · {c.fornecedor ?? "—"}
          <span className="muted">
            {" "}· {c.quantidade_estoque > 0 ? `+${c.quantidade_estoque} un.` : `${c.quantidade.toLocaleString("pt-BR")} ${c.unidade ?? ""} (sem estoque)`}
            {" "}· custo {brl(c.custo_unitario)}
          </span>
        </div>
      ))}
    </div>
  );
}
