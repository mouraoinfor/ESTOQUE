import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl, dataBR, hojeISO } from "@/lib/formato";
import { podeAcessar } from "@/lib/modulos";
import Icone from "@/components/Icone";
import { Barras } from "@/components/Graficos";
import GastosProjeto from "@/components/projetos/GastosProjeto";
import AnexosOrcamento from "@/components/anexos/AnexosOrcamento";
import AbasDocumentos from "@/components/anexos/AbasDocumentos";
import NotasOrcamento, { type Nota } from "@/components/anexos/NotasOrcamento";
import type { Anexo } from "@/components/anexos/tipos";
import { CATEGORIAS_GASTO, gastoTotal } from "@/components/projetos/tipos";
import { porSecao } from "@/components/orcamentos/tipos";
import { produtosParaBusca } from "../../orcamentos/dados";
import { gastosDoProjeto, resumoProjetos } from "../dados";
import "../../financeiro/lancamentos.css";
import "../../orcamentos/orcamentos.css";
import "../projetos.css";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Gestão de um projeto fechado: contrato, gastos lançados (abatem do contrato) e recebimentos
export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigirAcesso("projetos");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const verCusto = podeAcessar(s, "itens");
  const [[p], gastos, produtos, contas, itens, anexos, notas] = await Promise.all([
    resumoProjetos(id),
    gastosDoProjeto(id),
    produtosParaBusca(verCusto),
    query<{ id: string; descricao: string; vencimento: string; valor: number; status: string }>(
      `select id, descricao, vencimento::text as vencimento, valor, status
         from lancamentos where orcamento_id = $1 and tipo = 'receber' order by vencimento`,
      [id]
    ),
    query<{ secao: string | null; quantidade: number; valor_unitario: number; custo_unitario: number | null }>(
      "select secao, quantidade, valor_unitario, custo_unitario from orcamento_itens where orcamento_id = $1 order by ordem",
      [id]
    ),
    query<Anexo>(
      "select id, nome, mime, tamanho::float8 as tamanho, partes, usuario, created_at from orcamento_anexos where orcamento_id = $1 and completo order by created_at",
      [id]
    ),
    query<Nota>(
      "select id, texto, usuario, created_at from orcamento_notas where orcamento_id = $1 order by created_at desc",
      [id]
    ),
  ]);
  if (!p) {
    const [o] = await query<{ tipo: string }>("select tipo from orcamentos where id = $1", [id]);
    if (!o) notFound();
    return (
      <>
        <h1>Projeto</h1>
        <div className="alert warn">
          Este orçamento ainda não é um projeto fechado. Marque o tipo como &quot;Projeto&quot; e aprove quando o cliente fechar.{" "}
          <Link href={`/orcamentos/${id}`}>Abrir orçamento</Link>
        </div>
      </>
    );
  }

  const gasto = gastoTotal(p);
  const saldo = p.contrato - gasto;
  const pct = p.contrato > 0 ? (gasto / p.contrato) * 100 : 0;
  const lancado = p.recebido + p.a_receber;

  const porCategoria = new Map<string, number>();
  if (p.material_baixado > 0) porCategoria.set("Material do orçamento (baixado do estoque)", p.material_baixado);
  for (const g of gastos) {
    const r = CATEGORIAS_GASTO[g.categoria];
    porCategoria.set(r, (porCategoria.get(r) ?? 0) + g.quantidade * g.valor_unitario);
  }
  const divisoes = porSecao(itens).filter((d) => d.secao);

  return (
    <>
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ marginBottom: ".25rem" }}>Projeto #{p.numero} · {p.titulo}</h1>
          <div className="small muted">
            {p.cliente_nome ?? "Sem cliente"}
            {p.aprovado_em && <> · fechado em {dataBR(p.aprovado_em)}</>}
          </div>
        </div>
        <div className="actions">
          <Link className="btn" href="/projetos"><Icone nome="maleta" tamanho={16} /> Todos os projetos</Link>
          <Link className="btn" href={`/orcamentos/${p.id}`}><Icone nome="orcamento" tamanho={16} /> Orçamento / proposta</Link>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><div className="label">Valor fechado</div><div className="value" style={{ fontSize: "1.1rem" }}>{brl(p.contrato)}</div></div>
        <div className="stat"><div className="label">Gasto até agora</div><div className="value diff-neg" style={{ fontSize: "1.1rem" }}>{brl(gasto)}</div><div className="small muted">previsto no orçamento: {brl(p.custo_previsto)}</div></div>
        <div className="stat"><div className="label">Saldo do contrato</div><div className={`value ${saldo < 0 ? "diff-neg" : "diff-pos"}`} style={{ fontSize: "1.1rem" }}>{brl(saldo)}</div><div className="small muted">{p.contrato > 0 ? `${((saldo / p.contrato) * 100).toFixed(1)}% de margem` : ""}</div></div>
        <div className="stat"><div className="label">Recebido</div><div className="value diff-pos" style={{ fontSize: "1.1rem" }}>{brl(p.recebido)}</div></div>
        <div className="stat"><div className="label">Falta receber</div><div className="value" style={{ fontSize: "1.1rem" }}>{brl(p.contrato - p.recebido)}</div><div className="small muted">{brl(p.a_receber)} já lançado em contas a receber</div></div>
      </div>

      <div className="card">
        <h3>Consumo do contrato</h3>
        <div className="proj-consumo grande" title={`${pct.toFixed(0)}% do contrato já gasto`}>
          <div className={pct > 100 ? "estourou" : ""} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <p className="small muted">
          {pct.toFixed(1)}% do valor fechado já foi gasto.
          {pct > 100 && <strong className="diff-neg"> O projeto passou do valor fechado em {brl(-saldo)}.</strong>}
        </p>
        <div className="grid2">
          <div>
            <h4>Gasto por categoria</h4>
            <Barras dados={[...porCategoria].map(([rotulo, valor]) => ({ rotulo, valor }))} formatar={brl} />
          </div>
          <div>
            <h4>Recebimentos</h4>
            {!contas.length && <p className="small muted">Nenhuma conta a receber gerada. Gere as parcelas na tela do orçamento.</p>}
            {contas.map((c) => (
              <div key={c.id} className="proj-conta small">
                <span>{dataBR(c.vencimento)} · {c.descricao}</span>
                <span className={c.status === "pago" ? "diff-pos" : ""}>{brl(c.valor)} {c.status === "pago" ? "recebido" : "em aberto"}</span>
              </div>
            ))}
            {lancado + 0.009 < p.contrato && contas.length > 0 && (
              <p className="small muted">Ainda falta lançar {brl(p.contrato - lancado)} em contas a receber.</p>
            )}
            {divisoes.length > 0 && (
              <>
                <h4>Divisões do orçamento</h4>
                <Barras dados={divisoes.map((d) => ({ rotulo: d.secao, valor: d.itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0) }))} formatar={brl} />
              </>
            )}
          </div>
        </div>
      </div>

      <GastosProjeto
        orcamentoId={p.id}
        gastos={gastos}
        produtos={produtos}
        podePagar={podeAcessar(s, "pagar")}
        hoje={hojeISO()}
        materialBaixado={p.material_baixado}
      />

      <AbasDocumentos
        nDocumentos={anexos.length}
        nObservacoes={notas.length}
        documentos={<AnexosOrcamento orcamentoId={p.id} anexos={anexos} podeEditar={podeAcessar(s, "orcamentos")} />}
        observacoes={<NotasOrcamento orcamentoId={p.id} notas={notas} podeEditar={podeAcessar(s, "orcamentos")} />}
      />
    </>
  );
}
