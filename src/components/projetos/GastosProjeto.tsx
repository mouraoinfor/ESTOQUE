"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icone from "@/components/Icone";
import { brl, dataBR } from "@/lib/formato";
import { adicionarGasto, excluirGasto, ligarGastoAoItem, type NovoGasto } from "@/app/acoes-projetos";
import BuscaProduto from "@/components/orcamentos/BuscaProduto";
import type { ProdutoBusca } from "@/components/orcamentos/tipos";
import { CATEGORIAS_GASTO, type CategoriaGasto, type GastoProjeto, type ItemProjeto } from "./tipos";

function vazio(hoje: string): NovoGasto {
  return { data: hoje, categoria: "material", descricao: "", produto_id: null, quantidade: "1", valor_unitario: "", baixar_estoque: true, sem_nf: false, gerar_conta: false, vencimento: hoje, pago: false, orcamento_item_id: null };
}

// estoque = item cadastrado no estoque; avulso = material comprado sem NF (fora do estoque); outro = mão de obra, deslocamento...
type Modo = "estoque" | "avulso" | "outro";

// Lançamento e lista dos gastos do projeto (cada gasto abate do valor fechado)
export default function GastosProjeto({
  orcamentoId,
  gastos,
  produtos,
  podePagar,
  hoje,
  materialBaixado,
  itens,
}: {
  orcamentoId: string;
  gastos: GastoProjeto[];
  produtos: ProdutoBusca[];
  podePagar: boolean;
  hoje: string;
  materialBaixado: number;
  itens: ItemProjeto[];
}) {
  const router = useRouter();
  const [g, setG] = useState(() => vazio(hoje));
  const [produto, setProduto] = useState<ProdutoBusca | null>(null);
  const [modo, setModo] = useState<Modo>("estoque");
  const [erro, setErro] = useState("");
  const [pendente, iniciar] = useTransition();

  const total = (Number(String(g.quantidade).replace(",", ".")) || 0) * (Number(String(g.valor_unitario).replace(",", ".")) || 0);
  const somaGastos = gastos.reduce((s, x) => s + x.quantidade * x.valor_unitario, 0);

  function escolherProduto(p: ProdutoBusca) {
    setProduto(p);
    setG((x) => ({ ...x, categoria: "material", descricao: p.nome, produto_id: p.id, valor_unitario: p.custo === null ? x.valor_unitario : String(p.custo) }));
  }

  function trocarModo(m: Modo) {
    setModo(m);
    setProduto(null);
    setG((x) => ({ ...x, produto_id: null, sem_nf: m === "avulso", categoria: m === "outro" ? (x.categoria === "material" ? "mao_de_obra" : x.categoria) : "material" }));
  }

  function lancar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (modo === "estoque" && !produto) return setErro("Escolha o item do estoque na busca (ou use \"Item avulso sem NF\").");
    iniciar(async () => {
      const r = await adicionarGasto(orcamentoId, { ...g, sem_nf: modo === "avulso" });
      if ("erro" in r) return setErro(r.erro);
      setG({ ...vazio(hoje), sem_nf: modo === "avulso", categoria: modo === "outro" ? g.categoria : "material" });
      setProduto(null);
      router.refresh();
    });
  }

  // Opções "Referente a": as linhas do orçamento (serviços também, ex.: mão de obra terceirizada)
  const opcoesItem = itens.map((i) => (
    <option key={i.id} value={i.id}>
      {i.secao ? `${i.secao} · ` : ""}{i.descricao} ({brl(i.vendido)})
    </option>
  ));

  function religar(x: GastoProjeto, itemId: string) {
    setErro("");
    iniciar(async () => {
      const r = await ligarGastoAoItem(x.id, itemId || null);
      if ("erro" in r) return setErro(r.erro);
      router.refresh();
    });
  }

  function excluir(x: GastoProjeto) {
    const extra = [x.baixou_estoque && "devolve o item ao estoque", x.lancamento_id && "apaga a conta a pagar em aberto"].filter(Boolean).join(" e ");
    if (!window.confirm(`Excluir o gasto "${x.descricao}"?${extra ? ` Isso ${extra}.` : ""}`)) return;
    setErro("");
    iniciar(async () => {
      const r = await excluirGasto(x.id);
      if ("erro" in r) return setErro(r.erro);
      router.refresh();
    });
  }

  return (
    <div className="card">
      <h3>Lançar gasto</h3>
      {erro && <div className="alert error">{erro}</div>}
      <form onSubmit={lancar}>
        <div className="tabs proj-modo">
          <button type="button" className={modo === "estoque" ? "active" : ""} onClick={() => trocarModo("estoque")}>Item do estoque</button>
          <button type="button" className={modo === "avulso" ? "active" : ""} onClick={() => trocarModo("avulso")}>Item avulso (sem NF)</button>
          <button type="button" className={modo === "outro" ? "active" : ""} onClick={() => trocarModo("outro")}>Outro gasto</button>
        </div>
        {modo === "estoque" && (
          <div className="orc-adicionar">
            <BuscaProduto produtos={produtos} onEscolher={escolherProduto} />
            {produto && (
              <button type="button" className="btn" onClick={() => { setProduto(null); setG((x) => ({ ...x, produto_id: null })); }}>
                <Icone nome="fechar" tamanho={14} /> Trocar item
              </button>
            )}
          </div>
        )}
        {modo === "avulso" && (
          <p className="small muted">Material comprado sem nota fiscal, que não está no estoque: entra só como gasto do projeto (não mexe no estoque).</p>
        )}
        {produto && (
          <p className="small muted">
            Item do estoque: #{produto.codigo} {produto.nome} · em estoque {produto.quantidade}
          </p>
        )}
        <div className="grid4">
          <label className="field">
            <span>Data</span>
            <input type="date" value={g.data} onChange={(e) => setG({ ...g, data: e.target.value })} required />
          </label>
          <label className="field">
            <span>Categoria</span>
            <select value={g.categoria} disabled={modo !== "outro"} onChange={(e) => setG({ ...g, categoria: e.target.value as CategoriaGasto })}>
              {Object.entries(CATEGORIAS_GASTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Quantidade</span>
            <input type="number" min="0" step="any" value={g.quantidade} onChange={(e) => setG({ ...g, quantidade: e.target.value })} required />
          </label>
          <label className="field">
            <span>Valor unitário</span>
            <input type="number" min="0" step="0.01" value={g.valor_unitario} onChange={(e) => setG({ ...g, valor_unitario: e.target.value })} required />
          </label>
        </div>
        <div className="grid2">
          <label className="field">
            <span>Descrição</span>
            <input
              value={g.descricao}
              placeholder={modo === "avulso" ? "Ex.: eletroduto 3/4 (loja de material), parafusos..." : modo === "outro" ? "Ex.: diária do instalador, combustível..." : "Escolha o item na busca acima"}
              onChange={(e) => setG({ ...g, descricao: e.target.value })}
              required
            />
          </label>
          {itens.length > 0 && (
            <label className="field">
              <span>Referente a (item do orçamento)</span>
              <select value={g.orcamento_item_id ?? ""} onChange={(e) => setG({ ...g, orcamento_item_id: e.target.value || null })}>
                <option value="">Gasto geral do projeto</option>
                {opcoesItem}
              </select>
            </label>
          )}
        </div>
        <div className="actions" style={{ margin: ".6rem 0" }}>
          {produto && (
            <label className="check">
              <input type="checkbox" checked={g.baixar_estoque} onChange={(e) => setG({ ...g, baixar_estoque: e.target.checked })} />
              Tirar do estoque
            </label>
          )}
          {podePagar && (
            <label className="check">
              <input type="checkbox" checked={g.gerar_conta} onChange={(e) => setG({ ...g, gerar_conta: e.target.checked })} />
              Lançar também em contas a pagar
            </label>
          )}
        </div>
        {g.gerar_conta && (
          <div className="grid4">
            <label className="field">
              <span>Vencimento</span>
              <input type="date" value={g.vencimento} onChange={(e) => setG({ ...g, vencimento: e.target.value })} />
            </label>
            <label className="check" style={{ alignSelf: "end" }}>
              <input type="checkbox" checked={g.pago} onChange={(e) => setG({ ...g, pago: e.target.checked })} />
              Já está pago
            </label>
          </div>
        )}
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <strong>Total: {brl(total)}</strong>
          <button className="btn primary" disabled={pendente}><Icone nome="novo" tamanho={16} /> {pendente ? "Lançando..." : "Lançar gasto"}</button>
        </div>
      </form>

      <h3 style={{ marginTop: "1.5rem" }}>Gastos lançados</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th className="hide-sm">Categoria</th>
              <th className="num">Qtd</th>
              <th className="num">Unitário</th>
              <th className="num">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {materialBaixado > 0 && (
              <tr>
                <td className="small muted">—</td>
                <td>Material do orçamento baixado do estoque <div className="small muted">custo dos itens de estoque do orçamento</div></td>
                <td className="hide-sm small">Material</td>
                <td className="num">—</td>
                <td className="num">—</td>
                <td className="num"><strong>{brl(materialBaixado)}</strong></td>
                <td></td>
              </tr>
            )}
            {gastos.map((x) => (
              <tr key={x.id}>
                <td className="small">{dataBR(x.data)}</td>
                <td>
                  {x.descricao}
                  <div className="small muted">
                    {x.produto_codigo !== null && <>#{x.produto_codigo}{x.baixou_estoque ? " · tirado do estoque" : ""} · </>}
                    {x.sem_nf && <><span className="badge a_revisar">avulso sem NF</span> · </>}
                    {x.lancamento_id && <>conta a pagar {x.conta_status === "pago" ? "paga" : "em aberto"} · </>}
                    {x.usuario}
                  </div>
                  {itens.length > 0 && (
                    <select
                      className="proj-gasto-item small"
                      value={x.orcamento_item_id ?? ""}
                      disabled={pendente}
                      title="Item do orçamento a que este gasto pertence"
                      onChange={(e) => religar(x, e.target.value)}
                    >
                      <option value="">Gasto geral do projeto</option>
                      {opcoesItem}
                    </select>
                  )}
                </td>
                <td className="hide-sm small">{CATEGORIAS_GASTO[x.categoria]}</td>
                <td className="num">{x.quantidade.toLocaleString("pt-BR")}</td>
                <td className="num">{brl(x.valor_unitario)}</td>
                <td className="num"><strong>{brl(x.quantidade * x.valor_unitario)}</strong></td>
                <td className="orc-linha-acoes">
                  <button type="button" className="btn small danger" disabled={pendente} onClick={() => excluir(x)} aria-label="Excluir"><Icone nome="lixo" tamanho={14} /></button>
                </td>
              </tr>
            ))}
            {!gastos.length && !materialBaixado && (
              <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: "1.2rem" }}>Nenhum gasto lançado ainda.</td></tr>
            )}
          </tbody>
          {(gastos.length > 0 || materialBaixado > 0) && (
            <tfoot>
              <tr>
                <td colSpan={5}><strong>Total gasto</strong></td>
                <td className="num"><strong>{brl(somaGastos + materialBaixado)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
