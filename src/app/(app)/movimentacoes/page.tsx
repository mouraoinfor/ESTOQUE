import Link from "next/link";
import { query } from "@/lib/db";
import type { Movimentacao } from "@/lib/types";

export const dynamic = "force-dynamic";

const TIPO: Record<string, string> = { entrada: "Entrada", saida: "Saída", venda: "Venda", ajuste: "Ajuste" };

export default async function Movimentacoes() {
  const movs = await query<Movimentacao & { produto_codigo: number; produto_nome: string }>(
    `select m.*, p.codigo as produto_codigo, p.nome as produto_nome
       from movimentacoes m join produtos p on p.id = m.produto_id
      order by m.created_at desc
      limit 300`
  );

  return (
    <>
      <h1>Movimentações</h1>
      <p className="muted small">Últimas 300. Para registrar uma entrada ou saída, abra o item.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Data</th><th>Produto</th><th>Tipo</th><th className="num">Qtd</th><th className="num">Saldo</th><th className="hide-sm">Motivo</th><th className="hide-sm">Usuário</th></tr>
          </thead>
          <tbody>
            {movs.map((m) => (
              <tr key={m.id}>
                <td className="small">{new Date(m.created_at).toLocaleString("pt-BR")}</td>
                <td><Link href={`/itens/${m.produto_id}`}>#{m.produto_codigo} {m.produto_nome}</Link></td>
                <td>{TIPO[m.tipo] ?? m.tipo}</td>
                <td className={`num ${m.quantidade >= 0 ? "diff-pos" : "diff-neg"}`}>{m.quantidade > 0 ? "+" : ""}{m.quantidade}</td>
                <td className="num">{m.saldo_apos}</td>
                <td className="hide-sm small">{m.motivo}</td>
                <td className="hide-sm small muted">{m.usuario}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
