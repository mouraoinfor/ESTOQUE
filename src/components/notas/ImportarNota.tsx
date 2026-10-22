"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import Icone from "@/components/Icone";
import { analisarNotaAcao, importarNotaAcao } from "@/app/acoes-notas";
import { brl, dataBR, formatarDocumento } from "@/lib/formato";
import { CATEGORIAS } from "@/lib/types";
import {
  arredondar90,
  centavos,
  ErroNFe,
  lerNFe,
  margemDe,
  precoPor,
  somarDias,
  type ItemNFe,
  type ModoPreco,
  type NFe,
} from "@/lib/nfe";
import type { AcaoItem, Analise, EntradaImportacao } from "@/lib/nfe-importar";
import BuscaProduto, { normalizar } from "./BuscaProduto";

export interface ProdutoResumo {
  id: string;
  codigo: number;
  nome: string;
  marca: string | null;
  modelo: string | null;
  gtin: string | null;
  condicao: string;
  quantidade: number;
  custo: number | null;
  preco_venda: number | null;
}

interface Props {
  produtos: ProdutoResumo[];
  empresas: { id: string; nome: string; documento: string | null }[];
  empresaAtualId: string;
  bancos: { id: string; empresa_id: string; nome: string }[];
  podePagar: boolean;
}

interface Linha {
  acao: AcaoItem;
  produtoId: string | null;
  motivoSugestao: "codigo" | "gtin" | null;
  sugestaoNome: string | null; // produto com nome parecido (só sugerido)
  nome: string;
  categoria: string;
  qtd: string;
  modo: ModoPreco | ""; // "" = usa o padrão do topo
  perc: string;
  precoManual: string;
  atualizarPreco: boolean;
}

interface Parcela {
  numero: string;
  vencimento: string;
  valor: string;
}

interface Arquivo {
  nome: string;
  estado: "pendente" | "importada" | "erro" | "pulada";
  notaId?: string;
  numero?: string;
  erro?: string;
}

interface Atual {
  xml: string;
  nfe: NFe;
  analise: Analise;
}

const PALAVRAS_IGNORADAS = new Set(["de", "da", "do", "das", "dos", "com", "sem", "para", "em", "e", "a", "o", "un", "pc", "cx"]);

function tokens(s: string) {
  return new Set(normalizar(s).split(/[^a-z0-9]+/).filter((t) => t.length >= 2 && !PALAVRAS_IGNORADAS.has(t)));
}

// Sugestão por nome parecido (coeficiente de Dice nos termos; modelo contido na descrição vale muito)
function nomeParecido(item: ItemNFe, produtos: ProdutoResumo[]) {
  const alvo = tokens(item.descricao);
  const desc = normalizar(item.descricao).replace(/[^a-z0-9]/g, "");
  let melhor: { id: string; nota: number } | null = null;
  for (const p of produtos) {
    const tp = tokens([p.nome, p.modelo].filter(Boolean).join(" "));
    let comum = 0;
    for (const t of tp) if (alvo.has(t)) comum++;
    let nota = tp.size + alvo.size ? (2 * comum) / (tp.size + alvo.size) : 0;
    const modelo = normalizar(p.modelo ?? "").replace(/[^a-z0-9]/g, "");
    if (modelo.length >= 4 && desc.includes(modelo)) nota = Math.max(nota, 0.9);
    if (!melhor || nota > melhor.nota) melhor = { id: p.id, nota };
  }
  return melhor && melhor.nota >= 0.5 ? melhor.id : null;
}

function numero(s: string) {
  const n = Number(String(s).replace(",", ".").trim());
  return s.trim() === "" || !Number.isFinite(n) ? null : n;
}

function pct(v: number | null) {
  return v === null ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function qtdBR(v: number) {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 4 });
}

function brl4(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export default function ImportarNota({ produtos, empresas, empresaAtualId, bancos, podePagar }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const filaRef = useRef<File[]>([]);
  const [indice, setIndice] = useState(-1);
  const [arrastando, setArrastando] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [atual, setAtual] = useState<Atual | null>(null);

  const [modoPadrao, setModoPadrao] = useState<ModoPreco>("markup");
  const [percPadrao, setPercPadrao] = useState("50");
  const [arred90, setArred90] = useState(false);
  const [empresaId, setEmpresaId] = useState(empresaAtualId);
  const [linhas, setLinhas] = useState<Record<number, Linha>>({});
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [lancar, setLancar] = useState(podePagar);
  const [bancoId, setBancoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [importando, startImport] = useTransition();

  const porId = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);

  // ------------------------------------------------------------------
  // Arquivos
  // ------------------------------------------------------------------
  function adicionar(files: FileList | File[]) {
    const novos = [...files].filter((f) => /\.xml$/i.test(f.name) || f.type.includes("xml"));
    if (!novos.length) {
      setErroArquivo("Escolha arquivos .xml da NF-e.");
      return;
    }
    setErroArquivo(null);
    const inicio = filaRef.current.length;
    filaRef.current = [...filaRef.current, ...novos];
    setArquivos((a) => [...a, ...novos.map((f) => ({ nome: f.name, estado: "pendente" as const }))]);
    if (!atual && !lendo) abrir(inicio);
  }

  function marcar(i: number, dados: Partial<Arquivo>) {
    setArquivos((a) => a.map((x, k) => (k === i ? { ...x, ...dados } : x)));
  }

  async function abrir(i: number) {
    setAtual(null);
    setErro(null);
    setErroArquivo(null);
    setIndice(i);
    const f = filaRef.current[i];
    if (!f) return;
    setLendo(true);
    try {
      const xml = await f.text();
      let nfe: NFe;
      try {
        nfe = lerNFe(xml);
      } catch (e) {
        const m = e instanceof ErroNFe ? e.message : `Não consegui ler o arquivo: ${e instanceof Error ? e.message : e}`;
        marcar(i, { estado: "erro", erro: m });
        setErroArquivo(`${f.name}: ${m}`);
        return;
      }
      const r = await analisarNotaAcao(xml);
      if ("erro" in r) {
        marcar(i, { estado: "erro", erro: r.erro });
        setErroArquivo(`${f.name}: ${r.erro}`);
        return;
      }
      iniciar(nfe, r.ok);
      setAtual({ xml, nfe, analise: r.ok });
      marcar(i, { numero: nfe.numero });
    } finally {
      setLendo(false);
    }
  }

  function proximo() {
    const k = filaRef.current.findIndex((_, j) => j > indice && arquivos[j]?.estado === "pendente");
    if (k >= 0) abrir(k);
    else {
      setAtual(null);
      setIndice(-1);
    }
  }

  function pular() {
    if (indice >= 0) marcar(indice, { estado: "pulada" });
    proximo();
  }

  // Valores iniciais da tela para uma nota
  function iniciar(nfe: NFe, analise: Analise) {
    const ls: Record<number, Linha> = {};
    for (const it of nfe.itens) {
      const sug = analise.sugestoes[it.nItem];
      const valida = sug && porId.has(sug.produtoId) ? sug : null;
      ls[it.nItem] = {
        acao: valida ? "vincular" : "criar",
        produtoId: valida?.produtoId ?? null,
        motivoSugestao: valida?.motivo ?? null,
        sugestaoNome: valida ? null : nomeParecido(it, produtos),
        nome: it.descricao,
        categoria: "",
        qtd: String(Math.max(0, Math.ceil(it.quantidade - 1e-9))),
        modo: "",
        perc: "",
        precoManual: "",
        atualizarPreco: true,
      };
    }
    setLinhas(ls);
    setParcelas(
      nfe.duplicatas.length
        ? nfe.duplicatas.map((d) => ({ numero: d.numero, vencimento: d.vencimento, valor: d.valor.toFixed(2) }))
        : [{ numero: nfe.numero, vencimento: somarDias(nfe.dataEmissao, 30), valor: nfe.totais.vNF.toFixed(2) }]
    );
    setEmpresaId(analise.empresaId ?? empresaAtualId);
    setLancar(podePagar && nfe.entregaFutura !== "remessa");
    setBancoId("");
  }

  function setLinha(n: number, dados: Partial<Linha>) {
    setLinhas((ls) => ({ ...ls, [n]: { ...ls[n], ...dados } }));
  }

  // ------------------------------------------------------------------
  // Cálculos por item
  // ------------------------------------------------------------------
  const padrao = numero(percPadrao);
  function calcular(it: ItemNFe, l: Linha) {
    const qtdEst = Number(l.qtd);
    const qtdOk = l.acao === "ignorar" || (Number.isInteger(qtdEst) && qtdEst >= 0 && l.qtd.trim() !== "");
    const custo = qtdOk && qtdEst > 0 ? it.custoTotal / qtdEst : it.custoUnitario;
    const modo = l.modo || modoPadrao;
    const perc = l.perc.trim() !== "" ? numero(l.perc) : padrao;
    let preco: number | null = null;
    let erroPreco: string | null = null;
    if (l.precoManual.trim() !== "") {
      preco = numero(l.precoManual);
      if (preco === null || preco <= 0) erroPreco = "Preço inválido";
    } else if (perc === null) erroPreco = "Percentual inválido";
    else {
      preco = precoPor(modo, custo, perc);
      if (preco === null) erroPreco = "Margem precisa ser menor que 100%";
      else if (arred90) preco = arredondar90(preco);
    }
    if (preco !== null) preco = centavos(preco);
    if (preco !== null && preco <= 0) {
      erroPreco = "Preço precisa ser maior que zero";
      preco = null;
    }
    return { qtdEst, qtdOk, custo, preco, erroPreco, lucro: preco !== null ? preco - custo : null, margem: preco !== null ? margemDe(custo, preco) : null };
  }

  // ------------------------------------------------------------------
  // Importar
  // ------------------------------------------------------------------
  const nfe = atual?.nfe ?? null;
  const analise = atual?.analise ?? null;
  const somaParcelas = parcelas.reduce((s, p) => s + (numero(p.valor) ?? 0), 0);
  const diferenca = nfe ? centavos(somaParcelas - nfe.totais.vNF) : 0;
  const bancosEmpresa = bancos.filter((b) => b.empresa_id === empresaId);
  const empresaCasou = !!analise?.empresaId;
  const empresaEscolhida = empresas.find((e) => e.id === empresaId);

  function validar(): string | null {
    if (!nfe) return "Nenhuma nota aberta.";
    for (const it of nfe.itens) {
      const l = linhas[it.nItem];
      if (!l) return `Item ${it.nItem} sem escolha.`;
      if (l.acao === "ignorar") continue;
      const c = calcular(it, l);
      if (l.acao === "vincular" && !l.produtoId) return `Item ${it.nItem}: escolha o produto para vincular.`;
      if (l.acao === "criar" && !l.nome.trim()) return `Item ${it.nItem}: informe o nome do produto novo.`;
      if (!c.qtdOk) return `Item ${it.nItem}: a quantidade para o estoque precisa ser um número inteiro.`;
      if (c.erroPreco) return `Item ${it.nItem}: ${c.erroPreco}.`;
    }
    if (lancar) {
      if (!parcelas.length) return "Adicione ao menos uma parcela ou desmarque o lançamento no contas a pagar.";
      for (const [k, p] of parcelas.entries()) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(p.vencimento)) return `Parcela ${k + 1}: informe o vencimento.`;
        const v = numero(p.valor);
        if (v === null || v <= 0) return `Parcela ${k + 1}: valor inválido.`;
      }
    }
    return null;
  }

  function importar() {
    if (!atual || !nfe) return;
    const e = validar();
    if (e) {
      setErro(e);
      return;
    }
    setErro(null);
    const entrada: EntradaImportacao = {
      xml: atual.xml,
      empresaId,
      lancarPagar: lancar,
      bancoId: lancar && bancoId ? bancoId : null,
      parcelas: lancar
        ? parcelas.map((p) => ({ numero: p.numero.trim(), vencimento: p.vencimento, valor: centavos(numero(p.valor) ?? 0) }))
        : [],
      itens: nfe.itens.map((it) => {
        const l = linhas[it.nItem];
        const c = calcular(it, l);
        return {
          nItem: it.nItem,
          acao: l.acao,
          produtoId: l.acao === "vincular" ? l.produtoId : null,
          nome: l.acao === "criar" ? l.nome.trim() : null,
          categoria: l.acao === "criar" && l.categoria ? l.categoria : null,
          quantidadeEstoque: l.acao === "ignorar" ? 0 : c.qtdEst,
          precoVenda: l.acao === "ignorar" ? null : c.preco,
          atualizarPreco: l.atualizarPreco,
        };
      }),
    };
    startImport(async () => {
      const r = await importarNotaAcao(entrada);
      if ("erro" in r) {
        setErro(r.erro);
        return;
      }
      marcar(indice, { estado: "importada", notaId: r.ok.id, numero: nfe.numero });
      const resta = filaRef.current.some((_, j) => j > indice && arquivos[j]?.estado === "pendente");
      if (resta) {
        router.refresh();
        proximo();
      } else router.push(`/notas/${r.ok.id}`);
    });
  }

  const itensFracionados = nfe ? nfe.itens.filter((it) => !Number.isInteger(it.quantidade)) : [];

  // ------------------------------------------------------------------
  // Tela
  // ------------------------------------------------------------------
  return (
    <div className="nfe-importar">
      <div
        className={`nfe-drop${arrastando ? " ativo" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          adicionar(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <Icone nome="upload" tamanho={26} />
        <div>
          <strong>Arraste os arquivos XML aqui</strong> ou clique para escolher
          <div className="small muted">Pode escolher vários; eles são importados um de cada vez.</div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) adicionar(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {arquivos.length > 1 && (
        <div className="nfe-fila small">
          {arquivos.map((a, k) => (
            <span key={k} className={`nfe-fila-item ${a.estado}${k === indice ? " atual" : ""}`}>
              {a.estado === "importada" && a.notaId ? (
                <Link href={`/notas/${a.notaId}`}><Icone nome="ok" tamanho={13} /> {a.nome}</Link>
              ) : (
                <>
                  {a.estado === "erro" && <Icone nome="alerta" tamanho={13} />} {a.nome}
                  {a.estado === "pulada" && " (pulada)"}
                </>
              )}
            </span>
          ))}
        </div>
      )}

      {erroArquivo && (
        <div className="alert error">
          {erroArquivo}
          {filaRef.current.some((_, j) => j > indice && arquivos[j]?.estado === "pendente") && (
            <div style={{ marginTop: ".5rem" }}>
              <button type="button" className="btn small" onClick={proximo}>Próximo arquivo</button>
            </div>
          )}
        </div>
      )}
      {lendo && <p className="muted">Lendo a nota...</p>}

      {nfe && analise && (
        <>
          {/* Cabeçalho */}
          <div className="card nfe-cabecalho">
            <div className="nfe-cab-topo">
              <div>
                <div className="small muted">Fornecedor</div>
                <h2 style={{ margin: ".1rem 0" }}>{analise.fornecedor?.nome ?? nfe.emitente.nome}</h2>
                <div className="small muted">
                  {formatarDocumento(nfe.emitente.documento)}
                  {nfe.emitente.fantasia && <> · {nfe.emitente.fantasia}</>}
                  {nfe.emitente.endereco && <> · {nfe.emitente.endereco}</>}
                </div>
                <div style={{ marginTop: ".35rem" }}>
                  {analise.fornecedor ? (
                    <span className="badge novo">cadastrado</span>
                  ) : (
                    <span className="badge a_revisar">será cadastrado</span>
                  )}
                </div>
              </div>
              <div className="nfe-total">
                <div className="small muted">Valor total</div>
                <div className="nfe-total-valor">{brl(nfe.totais.vNF)}</div>
              </div>
            </div>
            <div className="grid4 nfe-dados">
              <div><span className="small muted">Nº / série</span><div>{nfe.numero} / {nfe.serie}</div></div>
              <div><span className="small muted">Emissão</span><div>{dataBR(nfe.dataEmissao)}</div></div>
              <div><span className="small muted">Natureza</span><div className="small">{nfe.natureza || "—"}</div></div>
              <div><span className="small muted">Pagamento</span><div className="small">{nfe.formaPagamento || "—"}</div></div>
            </div>
            <div className="small muted nfe-chave">Chave: {nfe.chave.replace(/(\d{4})(?=\d)/g, "$1 ")}</div>
            <div className="nfe-totais small">
              <span>Produtos {brl(nfe.totais.vProd)}</span>
              {nfe.totais.vFrete > 0 && <span>Frete {brl(nfe.totais.vFrete)}</span>}
              {nfe.totais.vSeg > 0 && <span>Seguro {brl(nfe.totais.vSeg)}</span>}
              {nfe.totais.vIPI > 0 && <span>IPI {brl(nfe.totais.vIPI)}</span>}
              {nfe.totais.vST + nfe.totais.vFCPST > 0 && <span>ST {brl(nfe.totais.vST + nfe.totais.vFCPST)}</span>}
              {nfe.totais.vOutro > 0 && <span>Outras {brl(nfe.totais.vOutro)}</span>}
              {nfe.totais.vDesc > 0 && <span>Desconto −{brl(nfe.totais.vDesc)}</span>}
            </div>
          </div>

          {analise.duplicada ? (
            <div className="alert error">
              Esta nota já foi importada.{" "}
              <Link href={`/notas/${analise.duplicada.id}`}>Abrir a NF {analise.duplicada.numero}</Link>
              <div style={{ marginTop: ".5rem" }}>
                <button type="button" className="btn small" onClick={pular}>Pular este arquivo</button>
              </div>
            </div>
          ) : (
            <>
              {nfe.avisos.map((a, k) => (
                <div key={k} className="alert warn">
                  <Icone nome="alerta" tamanho={15} /> {a}
                  {nfe.entregaFutura === "faturamento" && a.includes("simples faturamento") && (
                    <div style={{ marginTop: ".45rem" }}>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => setLinhas((ls) => Object.fromEntries(Object.entries(ls).map(([n, l]) => [n, { ...l, acao: "ignorar" as const }])))}
                      >
                        Não dar entrada no estoque em nenhum item
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Empresa */}
              <div className="card">
                <h3>Empresa</h3>
                <div className="actions">
                  <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} style={{ width: "auto" }}>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>{e.nome}{e.documento ? ` (${formatarDocumento(e.documento)})` : ""}</option>
                    ))}
                  </select>
                  {empresaCasou && empresaId === analise.empresaId ? (
                    <span className="small diff-pos"><Icone nome="ok" tamanho={14} /> CNPJ do destinatário confere</span>
                  ) : null}
                </div>
                {!empresaCasou && (
                  <div className="alert warn" style={{ marginTop: ".75rem", marginBottom: 0 }}>
                    O destinatário da nota ({nfe.destinatario.nome || "sem nome"}, {formatarDocumento(nfe.destinatario.documento) || "sem CNPJ"}) não é
                    nenhuma empresa cadastrada. Confira se a nota é mesmo de {empresaEscolhida?.nome ?? "uma das suas empresas"}.
                  </div>
                )}
                {empresaCasou && empresaId !== analise.empresaId && (
                  <div className="alert warn" style={{ marginTop: ".75rem", marginBottom: 0 }}>
                    O CNPJ do destinatário é de outra empresa cadastrada ({empresas.find((e) => e.id === analise.empresaId)?.nome}).
                  </div>
                )}
              </div>

              {/* Preço de venda padrão */}
              <div className="card">
                <h3>Preço de venda</h3>
                <div className="actions nfe-preco-padrao">
                  <div className="tabs" role="tablist">
                    <button type="button" className={modoPadrao === "markup" ? "active" : ""} onClick={() => setModoPadrao("markup")}>Markup</button>
                    <button type="button" className={modoPadrao === "margem" ? "active" : ""} onClick={() => setModoPadrao("margem")}>Margem</button>
                  </div>
                  <label className="nfe-perc">
                    <input type="number" step="0.1" min="0" max={modoPadrao === "margem" ? 99.9 : undefined} value={percPadrao} onChange={(e) => setPercPadrao(e.target.value)} />
                    <span>%</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" checked={arred90} onChange={(e) => setArred90(e.target.checked)} /> Arredondar para ,90
                  </label>
                </div>
                <p className="small muted" style={{ margin: ".5rem 0 0" }}>
                  {modoPadrao === "markup"
                    ? "Markup: preço = custo × (1 + markup/100). Ex.: custo 100 com 50% → 150."
                    : "Margem: preço = custo ÷ (1 − margem/100). Ex.: custo 100 com 50% → 200 (metade do preço é lucro)."}{" "}
                  Vale para todos os itens; em cada item dá para usar outro percentual ou digitar o preço.
                </p>
                {padrao === null && <div className="alert error" style={{ marginTop: ".5rem" }}>Percentual padrão inválido.</div>}
                {modoPadrao === "margem" && padrao !== null && padrao >= 100 && (
                  <div className="alert error" style={{ marginTop: ".5rem" }}>A margem precisa ser menor que 100%.</div>
                )}
              </div>

              {/* Itens */}
              <h3>Itens ({nfe.itens.length})</h3>
              {itensFracionados.length > 0 && (
                <div className="alert warn">
                  {itensFracionados.length === 1 ? "Um item tem" : `${itensFracionados.length} itens têm`} quantidade fracionada
                  ({itensFracionados.map((i) => `${i.nItem}: ${qtdBR(i.quantidade)} ${i.unidade}`).join("; ")}). O estoque só aceita
                  unidades inteiras: arredondei para cima — ajuste a quantidade que entra no estoque se precisar.
                </div>
              )}
              <div className="table-wrap nfe-itens">
                <table>
                  <thead>
                    <tr>
                      <th className="num">#</th>
                      <th>Descrição do fornecedor</th>
                      <th className="num">Qtd</th>
                      <th className="num">V. unit.</th>
                      <th className="num" title="Inclui frete, seguro, outras despesas, IPI e ST, menos desconto">Custo real un.</th>
                      <th>Preço de venda</th>
                      <th className="num">Lucro un. / margem</th>
                    </tr>
                  </thead>
                  {nfe.itens.map((it) => {
                    const l = linhas[it.nItem];
                    if (!l) return null;
                    const c = calcular(it, l);
                    const prod = l.produtoId ? porId.get(l.produtoId) : undefined;
                    const sugNome = l.sugestaoNome ? porId.get(l.sugestaoNome) : undefined;
                    const ign = l.acao === "ignorar";
                    return (
                      <tbody key={it.nItem} className={ign ? "nfe-item ignorado" : "nfe-item"}>
                        <tr>
                          <td className="num muted">{it.nItem}</td>
                          <td>
                            <strong>{it.descricao}</strong>
                            <div className="small muted">
                              Cód. {it.codigo || "—"}
                              {it.gtin && <> · GTIN {it.gtin}</>}
                              {it.ncm && <> · NCM {it.ncm}</>}
                              {it.cfop && <> · CFOP {it.cfop}</>}
                            </div>
                          </td>
                          <td className="num">{qtdBR(it.quantidade)} <span className="muted small">{it.unidade}</span></td>
                          <td className="num">{brl4(it.valorUnitario)}</td>
                          <td className="num">
                            <strong>{brl4(it.custoUnitario)}</strong>
                            {it.rateado && <div className="small muted" title="Recebeu parte de valores que só estavam no total da nota">com rateio</div>}
                            {!ign && c.qtdOk && c.qtdEst > 0 && Math.abs(c.qtdEst - it.quantidade) > 1e-9 && (
                              <div className="small muted">{brl4(c.custo)} / un. de estoque</div>
                            )}
                          </td>
                          <td>
                            {ign ? (
                              <span className="muted small">—</span>
                            ) : (
                              <div className="nfe-preco">
                                <div className="actions">
                                  <select
                                    value={l.modo}
                                    onChange={(e) => setLinha(it.nItem, { modo: e.target.value as ModoPreco | "", precoManual: "" })}
                                    aria-label="Modo do preço"
                                  >
                                    <option value="">Padrão ({modoPadrao === "markup" ? "markup" : "margem"} {percPadrao}%)</option>
                                    <option value="markup">Markup</option>
                                    <option value="margem">Margem</option>
                                  </select>
                                  {l.modo && (
                                    <label className="nfe-perc">
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={l.perc}
                                        placeholder={percPadrao}
                                        onChange={(e) => setLinha(it.nItem, { perc: e.target.value, precoManual: "" })}
                                      />
                                      <span>%</span>
                                    </label>
                                  )}
                                </div>
                                <label className="nfe-perc nfe-preco-valor">
                                  <span>R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={l.precoManual !== "" ? l.precoManual : c.preco !== null ? c.preco.toFixed(2) : ""}
                                    onChange={(e) => setLinha(it.nItem, { precoManual: e.target.value })}
                                    aria-label="Preço de venda"
                                  />
                                  {l.precoManual !== "" && (
                                    <button type="button" className="btn small" onClick={() => setLinha(it.nItem, { precoManual: "" })} title="Voltar a calcular pelo percentual">
                                      calcular
                                    </button>
                                  )}
                                </label>
                                {c.erroPreco && <div className="small" style={{ color: "var(--danger)" }}>{c.erroPreco}</div>}
                              </div>
                            )}
                          </td>
                          <td className="num">
                            {!ign && c.lucro !== null ? (
                              <>
                                <span className={c.lucro >= 0 ? "diff-pos" : "diff-neg"}>{brl(c.lucro)}</span>
                                <div className="small muted">margem {pct(c.margem)}</div>
                              </>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        </tr>
                        <tr className="nfe-item-estoque">
                          <td></td>
                          <td colSpan={6}>
                            <div className="nfe-estoque">
                              <div className="tabs nfe-acao">
                                <button type="button" className={l.acao === "vincular" ? "active" : ""} onClick={() => setLinha(it.nItem, { acao: "vincular" })}>Produto existente</button>
                                <button type="button" className={l.acao === "criar" ? "active" : ""} onClick={() => setLinha(it.nItem, { acao: "criar" })}>Criar produto</button>
                                <button type="button" className={ign ? "active" : ""} onClick={() => setLinha(it.nItem, { acao: "ignorar" })}>Sem estoque</button>
                              </div>

                              {l.acao === "vincular" && (
                                <div className="nfe-vinculo">
                                  {prod ? (
                                    <div className="small">
                                      <strong>#{prod.codigo} · {prod.nome}</strong>
                                      <span className="muted">
                                        {" "}· {[prod.marca, prod.modelo].filter(Boolean).join(" ")} · {prod.condicao} · estoque {prod.quantidade}
                                        {prod.custo !== null && <> · custo atual {brl(prod.custo)}</>}
                                        {prod.preco_venda !== null && <> · preço atual {brl(prod.preco_venda)}</>}
                                      </span>
                                      {l.motivoSugestao && (
                                        <span className="badge pronto" style={{ marginLeft: ".4rem" }}>
                                          {l.motivoSugestao === "codigo" ? "mesmo código em nota anterior" : "mesmo GTIN"}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="small muted">Escolha o produto:</div>
                                  )}
                                  <BuscaProduto
                                    produtos={produtos}
                                    onEscolher={(id) => setLinha(it.nItem, { produtoId: id, motivoSugestao: null })}
                                    placeholder={prod ? "Trocar produto..." : "Buscar por nome, modelo, código ou GTIN..."}
                                  />
                                </div>
                              )}

                              {l.acao === "criar" && (
                                <div className="nfe-criar">
                                  <input value={l.nome} onChange={(e) => setLinha(it.nItem, { nome: e.target.value })} aria-label="Nome do produto novo" placeholder="Nome do produto" />
                                  <select value={l.categoria} onChange={(e) => setLinha(it.nItem, { categoria: e.target.value })} aria-label="Categoria">
                                    <option value="">Categoria...</option>
                                    {CATEGORIAS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                  </select>
                                  <span className="small muted">condição: novo</span>
                                </div>
                              )}

                              {!ign && (
                                <div className="nfe-qtd-estoque">
                                  <label className="nfe-perc">
                                    <span className="small">Entra no estoque</span>
                                    <input type="number" min="0" step="1" value={l.qtd} onChange={(e) => setLinha(it.nItem, { qtd: e.target.value })} aria-label="Quantidade que entra no estoque" />
                                    <span className="small muted">un.</span>
                                  </label>
                                  {!c.qtdOk && <span className="small" style={{ color: "var(--danger)" }}>use número inteiro</span>}
                                  {l.acao === "vincular" && (
                                    <label className="check small">
                                      <input type="checkbox" checked={l.atualizarPreco} onChange={(e) => setLinha(it.nItem, { atualizarPreco: e.target.checked })} />
                                      Atualizar preço de venda do produto
                                    </label>
                                  )}
                                  {l.acao === "criar" && (
                                    <label className="check small">
                                      <input type="checkbox" checked={l.atualizarPreco} onChange={(e) => setLinha(it.nItem, { atualizarPreco: e.target.checked })} />
                                      Gravar o preço de venda no produto
                                    </label>
                                  )}
                                </div>
                              )}
                              {ign && <span className="small muted">Não entra no estoque (ex.: material de uso e consumo). Fica só registrado na nota.</span>}

                              {l.acao !== "vincular" && sugNome && (
                                <div className="small nfe-sugestao">
                                  Nome parecido no estoque: <strong>#{sugNome.codigo} · {sugNome.nome}</strong>{" "}
                                  <button type="button" className="btn small" onClick={() => setLinha(it.nItem, { acao: "vincular", produtoId: sugNome.id, motivoSugestao: null })}>
                                    Usar este
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    );
                  })}
                </table>
              </div>

              {/* Financeiro */}
              <div className="card" style={{ marginTop: "1rem" }}>
                <h3>Financeiro</h3>
                {podePagar ? (
                  <label className="check">
                    <input type="checkbox" checked={lancar} onChange={(e) => setLancar(e.target.checked)} /> Lançar no contas a pagar
                  </label>
                ) : (
                  <p className="small muted">Você não tem acesso ao contas a pagar: a nota será importada sem lançamentos financeiros.</p>
                )}
                {nfe.fatura && (
                  <p className="small muted">
                    Fatura {nfe.fatura.numero}: original {brl(nfe.fatura.valorOriginal)}
                    {nfe.fatura.desconto > 0 && <> · desconto {brl(nfe.fatura.desconto)}</>} · líquido {brl(nfe.fatura.valorLiquido)}
                  </p>
                )}
                {!nfe.duplicatas.length && <p className="small muted">A nota não traz duplicatas: sugeri 1 parcela com vencimento 30 dias após a emissão.</p>}
                {lancar && podePagar && (
                  <>
                    <div className="table-wrap" style={{ boxShadow: "none" }}>
                      <table>
                        <thead>
                          <tr><th>Parcela</th><th>Nº duplicata</th><th>Vencimento</th><th className="num">Valor</th><th></th></tr>
                        </thead>
                        <tbody>
                          {parcelas.map((p, k) => (
                            <tr key={k}>
                              <td className="muted">{k + 1}/{parcelas.length}</td>
                              <td><input value={p.numero} onChange={(e) => setParcelas((ps) => ps.map((x, j) => (j === k ? { ...x, numero: e.target.value } : x)))} aria-label="Número da duplicata" /></td>
                              <td><input type="date" value={p.vencimento} onChange={(e) => setParcelas((ps) => ps.map((x, j) => (j === k ? { ...x, vencimento: e.target.value } : x)))} aria-label="Vencimento" /></td>
                              <td className="num"><input type="number" step="0.01" min="0" value={p.valor} onChange={(e) => setParcelas((ps) => ps.map((x, j) => (j === k ? { ...x, valor: e.target.value } : x)))} aria-label="Valor" style={{ textAlign: "right" }} /></td>
                              <td><button type="button" className="btn small danger" onClick={() => setParcelas((ps) => ps.filter((_, j) => j !== k))} title="Remover parcela"><Icone nome="lixo" tamanho={14} /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="actions" style={{ justifyContent: "space-between", marginTop: ".6rem" }}>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() =>
                          setParcelas((ps) => {
                            const ult = ps[ps.length - 1];
                            const falta = Math.max(0, centavos(nfe.totais.vNF - ps.reduce((s, p) => s + (numero(p.valor) ?? 0), 0)));
                            return [...ps, { numero: "", vencimento: ult?.vencimento ? somarDias(ult.vencimento, 30) : somarDias(nfe.dataEmissao, 30), valor: falta ? falta.toFixed(2) : "" }];
                          })
                        }
                      >
                        <Icone nome="novo" tamanho={14} /> Adicionar parcela
                      </button>
                      <span className="small">
                        Soma das parcelas: <strong>{brl(somaParcelas)}</strong> de {brl(nfe.totais.vNF)}
                      </span>
                    </div>
                    {Math.abs(diferenca) >= 0.01 && (
                      <div className="alert warn" style={{ marginTop: ".6rem" }}>
                        A soma das parcelas {diferenca > 0 ? "passa" : "fica abaixo"} do total da nota em {brl(Math.abs(diferenca))}.
                      </div>
                    )}
                    <label className="field" style={{ maxWidth: 360, marginTop: ".6rem" }}>
                      <span>Banco previsto (opcional)</span>
                      <select value={bancoId} onChange={(e) => setBancoId(e.target.value)}>
                        <option value="">—</option>
                        {bancosEmpresa.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                      </select>
                    </label>
                  </>
                )}
              </div>

              {erro && <div className="alert error">{erro}</div>}
              <div className="actions">
                <button type="button" className="btn primary" onClick={importar} disabled={importando}>
                  <Icone nome="ok" tamanho={16} /> {importando ? "Importando..." : "Importar nota"}
                </button>
                {arquivos.length > 1 && (
                  <button type="button" className="btn" onClick={pular} disabled={importando}>Pular este arquivo</button>
                )}
                <span className="small muted">
                  Estoque: {nfe.itens.filter((it) => linhas[it.nItem]?.acao !== "ignorar").length} de {nfe.itens.length} itens entram
                  {" · "}{nfe.itens.filter((it) => linhas[it.nItem]?.acao === "criar").length} produtos novos
                </span>
              </div>
            </>
          )}
        </>
      )}

      {!nfe && !lendo && arquivos.length > 0 && arquivos.every((a) => a.estado !== "pendente") && (
        <div className="alert ok">
          Fila concluída. {arquivos.filter((a) => a.estado === "importada").length} nota(s) importada(s).{" "}
          <Link href="/notas">Ver notas fiscais</Link>
        </div>
      )}
    </div>
  );
}
