import Link from "next/link";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl } from "@/lib/formato";
import Icone from "@/components/Icone";
import { ColunasAgrupadas, type Serie } from "@/components/Graficos";
import { gastoTotal } from "@/components/projetos/tipos";
import { resumoProjetos } from "./dados";
import "../financeiro/lancamentos.css";
import "./projetos.css";

export const dynamic = "force-dynamic";

const reais = (v: number) => brl(Math.round(v)).replace(",00", "");
const SERIES: Serie[] = [
  { nome: "Contrato", cor: "var(--primary)" },
  { nome: "Gasto", cor: "var(--danger)" },
  { nome: "Recebido", cor: "var(--ok)" },
];

// Projetos fechados: quanto fechou, quanto gastou, quanto recebeu e quanto falta
export default async function ProjetosPage() {
  await exigirAcesso("projetos");
  const [projetos, [funil]] = await Promise.all([
    resumoProjetos(),
    query<{ propostas: number; valor_propostas: number; fechados: number; perdidos: number }>(
      `select count(*) filter (where o.status = 'rascunho')::int as propostas,
              coalesce(sum(coalesce(o.valor_contrato, greatest(coalesce(t.subtotal, 0) - o.desconto, 0))) filter (where o.status = 'rascunho'), 0) as valor_propostas,
              count(*) filter (where o.status in ('aprovado', 'baixado'))::int as fechados,
              count(*) filter (where o.status = 'cancelado')::int as perdidos
         from orcamentos o
         left join lateral (select sum(quantidade * valor_unitario) as subtotal from orcamento_itens where orcamento_id = o.id) t on true
        where o.tipo = 'projeto'`
    ),
  ]);

  const soma = (f: (p: (typeof projetos)[number]) => number) => projetos.reduce((s, p) => s + f(p), 0);
  const contrato = soma((p) => p.contrato);
  const gasto = soma(gastoTotal);
  const recebido = soma((p) => p.recebido);
  const aReceber = contrato - recebido;
  const decididos = funil.fechados + funil.perdidos;

  return (
    <>
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1.1rem" }}>
        <h1 style={{ margin: 0 }}>Projetos</h1>
        <div className="actions">
          <Link className="btn" href="/orcamentos?tipo=projeto"><Icone nome="orcamento" tamanho={16} /> Propostas de projeto</Link>
          <Link className="btn primary" href="/orcamentos/novo"><Icone nome="novo" tamanho={16} /> Nova proposta</Link>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><div className="label">Contratos fechados</div><div className="value" style={{ fontSize: "1.1rem" }}>{brl(contrato)}</div><div className="small muted">{projetos.length} projeto(s)</div></div>
        <div className="stat"><div className="label">Gasto até agora</div><div className="value diff-neg" style={{ fontSize: "1.1rem" }}>{brl(gasto)}</div></div>
        <div className="stat"><div className="label">Saldo do contrato (contrato - gasto)</div><div className={`value ${contrato - gasto < 0 ? "diff-neg" : "diff-pos"}`} style={{ fontSize: "1.1rem" }}>{brl(contrato - gasto)}</div></div>
        <div className="stat"><div className="label">Recebido</div><div className="value diff-pos" style={{ fontSize: "1.1rem" }}>{brl(recebido)}</div></div>
        <div className="stat"><div className="label">Falta receber</div><div className="value" style={{ fontSize: "1.1rem" }}>{brl(aReceber)}</div></div>
        <div className="stat">
          <div className="label">Propostas em negociação</div>
          <div className="value" style={{ fontSize: "1.1rem" }}>{funil.propostas}</div>
          <div className="small muted">{brl(funil.valor_propostas)}{decididos > 0 && <> · fecha {Math.round((funil.fechados / decididos) * 100)}%</>}</div>
        </div>
      </div>

      {projetos.length > 0 && (
        <div className="card">
          <h3>Contrato × gasto × recebido por projeto</h3>
          <ColunasAgrupadas
            series={SERIES}
            formatar={reais}
            dados={projetos.slice(0, 12).reverse().map((p) => ({ rotulo: `#${p.numero}`, valores: [p.contrato, gastoTotal(p), p.recebido] }))}
          />
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Projeto</th>
              <th className="num">Contrato</th>
              <th className="num">Gasto</th>
              <th className="num">Saldo</th>
              <th className="hide-sm">Consumo do contrato</th>
              <th className="num">Recebido</th>
              <th className="num">Falta receber</th>
            </tr>
          </thead>
          <tbody>
            {projetos.map((p) => {
              const g = gastoTotal(p);
              const pct = p.contrato > 0 ? (g / p.contrato) * 100 : 0;
              return (
                <tr key={p.id} className="linha-link">
                  <td className="num muted"><Link className="cobre" href={`/projetos/${p.id}`}>{p.numero}</Link></td>
                  <td>
                    <strong>{p.titulo}</strong>
                    <div className="small muted">{p.cliente_nome ?? "Sem cliente"}{p.status === "baixado" && " · material baixado"}</div>
                  </td>
                  <td className="num">{brl(p.contrato)}</td>
                  <td className="num diff-neg">{brl(g)}</td>
                  <td className={`num ${p.contrato - g < 0 ? "diff-neg" : "diff-pos"}`}><strong>{brl(p.contrato - g)}</strong></td>
                  <td className="hide-sm">
                    <div className="proj-consumo" title={`${pct.toFixed(0)}% do contrato já gasto`}>
                      <div className={pct > 100 ? "estourou" : ""} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="small muted">{pct.toFixed(0)}%</span>
                  </td>
                  <td className="num diff-pos">{brl(p.recebido)}</td>
                  <td className="num">{brl(p.contrato - p.recebido)}</td>
                </tr>
              );
            })}
            {!projetos.length && (
              <tr><td colSpan={8} className="muted" style={{ textAlign: "center", padding: "1.5rem" }}>
                Nenhum projeto fechado ainda. Crie um orçamento do tipo &quot;Projeto&quot; e aprove quando o cliente fechar o contrato.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
