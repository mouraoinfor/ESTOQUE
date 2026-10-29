"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Icone from "@/components/Icone";
import { brl, dataBR, hojeISO } from "@/lib/formato";
import { precoPor } from "@/lib/nfe";
import { PRECIFICACAO_PADRAO, type Precificacao } from "@/lib/precificacao";
import {
  darBaixaOrcamento,
  duplicarOrcamento,
  estornarBaixaOrcamento,
  excluirOrcamento,
  gerarContaReceber,
  mudarStatusOrcamento,
  mudarTipoOrcamento,
  salvarOrcamento,
} from "@/app/acoes-orcamentos";
import BuscaProduto from "./BuscaProduto";
import ClienteCampo from "./ClienteCampo";
import ContaReceberCampos, { type ContaForm } from "./ContaReceberCampos";
import Modal from "./Modal";
import PropostaFolha, { type DadosProposta, type EmpresaProposta } from "./PropostaFolha";
import {
  BADGE_ORCAMENTO,
  PADROES_PROPOSTA,
  rotuloStatus,
  TIPO_ORCAMENTO,
  totaisOrcamento,
  type TipoOrcamento,
  type ClienteBusca,
  type ContaReceberPedido,
  type ItemOrcamento,
  type ExibirValores,
  type Orcamento,
  type ProdutoBusca,
  type TipoItem,
} from "./tipos";

export interface ContaLigada {
  id: string;
  descricao: string;
  vencimento: string;
  valor: number;
  status: "aberto" | "pago";
  empresa_nome: string;
}

interface Linha {
  key: string;
  id?: string;
  produto_id: string | null;
  tipo: TipoItem;
  descricao: string;
  quantidade: string;
  valor_unitario: string;
  custo_unitario: string;
  divisao?: boolean; // linha de título de divisão (ex.: "CFTV"); os itens abaixo dela ficam nessa divisão
}

interface Cabecalho {
  titulo: string;
  tipo: TipoOrcamento;
  valor_contrato: string;
  cliente_id: string | null;
  cliente_nome: string;
  empresa_id: string;
  validade: string;
  condicoes: string;
  observacoes: string;
  desconto: string;
  aos_cuidados: string;
  descricao_servico: string;
  prazo_entrega: string;
  garantia_fabricacao: string;
  garantia_instalacao: string;
  exibir_valores: ExibirValores;
}

type Resp<T = unknown> = { erro: string; faltando?: string[] } | { ok: T };
type Janela = null | "baixa" | "aprovar" | "conta" | "estornar" | "excluir";

const FUSO = "America/Sao_Paulo";
let seq = 0;
const novaChave = () => `l${++seq}`;
const numOu0 = (s: string) => {
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const txtNum = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(Math.round(n * 100) / 100));

function paraLinha(i: ItemOrcamento): Linha {
  return {
    key: i.id ?? novaChave(),
    id: i.id,
    produto_id: i.produto_id,
    tipo: i.tipo,
    descricao: i.descricao,
    quantidade: String(i.quantidade),
    valor_unitario: txtNum(i.valor_unitario),
    custo_unitario: txtNum(i.custo_unitario),
  };
}

function novaDivisao(nome = ""): Linha {
  return { key: novaChave(), produto_id: null, tipo: "produto", descricao: nome, quantidade: "", valor_unitario: "", custo_unitario: "", divisao: true };
}

// Itens do banco -> linhas da tela, com uma linha de divisão onde a divisão muda
function linhasDe(itens: ItemOrcamento[]): Linha[] {
  const ls: Linha[] = [];
  let atual = "";
  for (const i of itens) {
    const s = i.secao ?? "";
    if (s !== atual) {
      ls.push(novaDivisao(s));
      atual = s;
    }
    ls.push(paraLinha(i));
  }
  return ls;
}

// Linhas da tela -> itens, cada um com a divisão da linha de título acima dele
function itensDe(linhas: Linha[]): ItemOrcamento[] {
  let secao: string | null = null;
  const r: ItemOrcamento[] = [];
  for (const l of linhas) {
    if (l.divisao) secao = l.descricao.trim() || null;
    else r.push({ ...paraItem(l), secao });
  }
  return r;
}

function paraItem(l: Linha): ItemOrcamento {
  return {
    id: l.id,
    produto_id: l.produto_id,
    tipo: l.tipo,
    descricao: l.descricao.trim(),
    quantidade: numOu0(l.quantidade),
    valor_unitario: numOu0(l.valor_unitario),
    custo_unitario: l.custo_unitario.trim() === "" ? null : numOu0(l.custo_unitario),
  };
}

function cabecalhoDe(o: Orcamento | null, empresaPadrao: string | null, validadePadrao: string): Cabecalho {
  return {
    titulo: o?.titulo ?? "",
    tipo: o?.tipo ?? "projeto",
    valor_contrato: o?.valor_contrato === null || o?.valor_contrato === undefined ? "" : txtNum(o.valor_contrato),
    cliente_id: o?.cliente_id ?? null,
    cliente_nome: o?.cliente_nome ?? "",
    empresa_id: o ? o.empresa_id ?? "" : empresaPadrao ?? "",
    validade: o ? o.validade ?? "" : validadePadrao,
    condicoes: o?.condicoes ?? "",
    observacoes: o?.observacoes ?? "",
    desconto: o && o.desconto ? txtNum(o.desconto) : "",
    aos_cuidados: o?.aos_cuidados ?? "",
    descricao_servico: o?.descricao_servico ?? "",
    prazo_entrega: o ? o.prazo_entrega ?? "" : PADROES_PROPOSTA.prazo_entrega,
    garantia_fabricacao: o ? o.garantia_fabricacao ?? "" : PADROES_PROPOSTA.garantia_fabricacao,
    garantia_instalacao: o ? o.garantia_instalacao ?? "" : PADROES_PROPOSTA.garantia_instalacao,
    exibir_valores: o?.exibir_valores ?? "total",
  };
}

// Desconto digitado como "10%" (sobre o subtotal) ou valor em reais ("150" / "150,50")
function lerDesconto(txt: string, subtotal: number) {
  const t = txt.trim();
  if (t.endsWith("%")) {
    const pct = Math.min(100, Math.max(0, numOu0(t.slice(0, -1).trim())));
    return Math.round(subtotal * pct) / 100;
  }
  return Math.max(0, numOu0(t));
}

function montarDados(c: Cabecalho, linhas: Linha[]) {
  const itens = itensDe(linhas);
  const subtotal = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);
  return {
    titulo: c.titulo.trim(),
    tipo: c.tipo,
    valor_contrato: c.tipo === "projeto" && c.valor_contrato.trim() !== "" ? numOu0(c.valor_contrato) : null,
    cliente_id: c.cliente_id,
    cliente_nome: c.cliente_nome.trim() || null,
    empresa_id: c.empresa_id || null,
    validade: c.validade || null,
    observacoes: c.observacoes.trim() || null,
    condicoes: c.condicoes.trim() || null,
    desconto: lerDesconto(c.desconto, subtotal),
    aos_cuidados: c.aos_cuidados.trim() || null,
    descricao_servico: c.descricao_servico.trim() || null,
    prazo_entrega: c.prazo_entrega.trim() || null,
    garantia_fabricacao: c.garantia_fabricacao.trim() || null,
    garantia_instalacao: c.garantia_instalacao.trim() || null,
    exibir_valores: c.exibir_valores,
    itens,
  };
}

export default function EditorOrcamento({
  orcamento,
  versao,
  itens,
  produtos,
  clientes: clientesIniciais,
  empresas,
  empresasProposta,
  empresaPadrao,
  validadePadrao,
  verCusto,
  podeReceber,
  contas,
  gastosProjeto = { n: 0, total: 0 },
  precificacao = PRECIFICACAO_PADRAO,
}: {
  orcamento: Orcamento | null;
  versao: string;
  itens: ItemOrcamento[];
  produtos: ProdutoBusca[];
  clientes: ClienteBusca[];
  empresas: { id: string; nome: string }[];
  empresasProposta: EmpresaProposta[];
  empresaPadrao: string | null;
  validadePadrao: string;
  verCusto: boolean;
  podeReceber: boolean;
  contas: ContaLigada[];
  gastosProjeto?: { n: number; total: number }; // gastos lançados na gestão do projeto
  precificacao?: Precificacao; // preço de venda sugerido a partir do custo (tela Configurações)
}) {
  const router = useRouter();
  const id = orcamento?.id ?? null;
  const status = orcamento?.status ?? "rascunho";
  const editavel = status === "rascunho" || status === "aprovado";

  const [cab, setCab] = useState(() => cabecalhoDe(orcamento, empresaPadrao, validadePadrao));
  const [linhas, setLinhas] = useState<Linha[]>(() => linhasDe(itens));
  const [base, setBase] = useState(() => JSON.stringify(montarDados(cabecalhoDe(orcamento, empresaPadrao, validadePadrao), linhasDe(itens))));
  const [clientes, setClientes] = useState(clientesIniciais);
  const [mostrarCusto, setMostrarCusto] = useState(verCusto);
  // Margem sendo digitada em cada linha (chave da linha -> texto) e a margem para todos os itens
  const [margemDigitada, setMargemDigitada] = useState<Record<string, string>>({});
  const [margemTodos, setMargemTodos] = useState("");

  // O servidor gravou (salvar/status): recarrega os dados que vieram da página
  const [versaoVista, setVersaoVista] = useState(versao);
  if (versao !== versaoVista) {
    const c = cabecalhoDe(orcamento, empresaPadrao, validadePadrao);
    const l = linhasDe(itens);
    setVersaoVista(versao);
    setCab(c);
    setLinhas(l);
    setBase(JSON.stringify(montarDados(c, l)));
    setClientes(clientesIniciais);
  }

  const dados = montarDados(cab, linhas);
  const dadosJson = JSON.stringify(dados);
  const alterado = dadosJson !== base;

  useEffect(() => {
    if (!alterado) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [alterado]);

  const porProduto = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);

  // Quantidade pedida por produto (linhas repetidas somam)
  const pedido = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of linhas) if (l.produto_id) m.set(l.produto_id, (m.get(l.produto_id) ?? 0) + numOu0(l.quantidade));
    return m;
  }, [linhas]);
  const verificarSaldo = status !== "baixado" && status !== "cancelado";
  const faltas = useMemo(
    () =>
      [...pedido.entries()]
        .map(([pid, q]) => ({ p: porProduto.get(pid), q }))
        .filter((x) => x.p && x.q > x.p.quantidade) as { p: ProdutoBusca; q: number }[],
    [pedido, porProduto]
  );

  const tot = totaisOrcamento(dados.itens, dados.desconto);

  // Prévia da proposta ao lado do formulário (preferência guardada no navegador)
  const [previa, setPrevia] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem("orc-previa") === "0") setPrevia(false);
    } catch {}
  }, []);
  function alternarPrevia() {
    setPrevia((v) => {
      try {
        localStorage.setItem("orc-previa", v ? "0" : "1");
      } catch {}
      return !v;
    });
  }
  const dadosPrevia: DadosProposta = {
    numero: orcamento?.numero ?? 0,
    validade: dados.validade,
    observacoes: dados.observacoes,
    condicoes: dados.condicoes,
    desconto: dados.desconto,
    aos_cuidados: dados.aos_cuidados,
    descricao_servico: dados.descricao_servico,
    prazo_entrega: dados.prazo_entrega,
    garantia_fabricacao: dados.garantia_fabricacao,
    garantia_instalacao: dados.garantia_instalacao,
    exibir_valores: dados.exibir_valores,
    created_at: orcamento?.created_at ?? `${hojeISO()}T12:00:00-03:00`,
  };
  const itensPrevia = dados.itens.filter((i) => i.descricao);
  const empresaPrevia = empresasProposta.find((e) => e.id === cab.empresa_id) ?? null;
  const subProdutos = dados.itens.filter((i) => i.tipo === "produto").reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);
  const subServicos = tot.subtotal - subProdutos;

  // Itens do estoque cujo custo ou preço mudou no cadastro depois de entrarem no orçamento
  const centavos = (n: number) => Math.round(n * 100);
  const mudancas = useMemo(() => {
    if (!editavel) return [];
    const r: { key: string; p: ProdutoBusca; difCusto: boolean; difPreco: boolean; custoAtual: number | null; precoAtual: number }[] = [];
    for (const l of linhas) {
      const p = !l.divisao && l.produto_id ? porProduto.get(l.produto_id) : undefined;
      if (!p) continue;
      const custoAtual = l.custo_unitario.trim() === "" ? null : numOu0(l.custo_unitario);
      const precoAtual = numOu0(l.valor_unitario);
      const difCusto = p.custo !== null && (custoAtual === null || centavos(p.custo) !== centavos(custoAtual));
      const difPreco = p.preco !== null && centavos(p.preco) !== centavos(precoAtual);
      if (difCusto || difPreco) r.push({ key: l.key, p, difCusto, difPreco, custoAtual, precoAtual });
    }
    return r;
  }, [editavel, linhas, porProduto]);
  const mudouCusto = mudancas.filter((m) => m.difCusto).length;
  const mudouPreco = mudancas.filter((m) => m.difPreco).length;

  // Traz do estoque o custo (e, se pedido, o preço de venda) dos itens que mudaram
  function atualizarDoEstoque(precos: boolean) {
    const por = new Map(mudancas.map((m) => [m.key, m]));
    setLinhas((ls) =>
      ls.map((l) => {
        const m = por.get(l.key);
        if (!m) return l;
        return {
          ...l,
          custo_unitario: m.difCusto ? txtNum(m.p.custo) : l.custo_unitario,
          valor_unitario: precos && m.difPreco ? txtNum(m.p.preco) : l.valor_unitario,
        };
      })
    );
  }

  // ---------------- edição das linhas ----------------
  // Preço de venda sugerido para um custo (markup/margem padrão das Configurações)
  const sugerido = (custo: number) => precoPor(precificacao.modo, custo, precificacao.percentual) ?? custo;
  function mudarLinha(key: string, campo: keyof Linha, valor: string) {
    setLinhas((ls) =>
      ls.map((l) => {
        if (l.key !== key) return l;
        const nova = { ...l, [campo]: valor };
        // Digitou o custo: preenche o valor de venda, a não ser que o valor já tenha sido mudado à mão
        if (campo === "custo_unitario") {
          const antes = l.custo_unitario.trim() === "" ? "" : txtNum(sugerido(numOu0(l.custo_unitario)));
          if (l.valor_unitario.trim() === "" || l.valor_unitario === antes) {
            nova.valor_unitario = valor.trim() === "" ? "" : txtNum(sugerido(numOu0(valor)));
          }
        }
        return nova;
      })
    );
  }
  // Margem sobre o preço de venda: preço = custo / (1 - margem). Devolve null se não dá para calcular
  function precoPelaMargem(l: Linha, margem: string) {
    const m = Number(margem.replace(",", "."));
    if (l.custo_unitario.trim() === "" || margem.trim() === "" || !Number.isFinite(m) || m >= 100) return null;
    return txtNum(numOu0(l.custo_unitario) / (1 - m / 100));
  }
  function mudarMargem(l: Linha, margem: string) {
    setMargemDigitada((d) => ({ ...d, [l.key]: margem }));
    const preco = precoPelaMargem(l, margem);
    if (preco !== null) mudarLinha(l.key, "valor_unitario", preco);
  }
  function aplicarMargemTodos() {
    const m = Number(margemTodos.replace(",", "."));
    if (!Number.isFinite(m) || m >= 100 || margemTodos.trim() === "") {
      setAviso({ tipo: "error", texto: "Margem inválida: use um número menor que 100." });
      return;
    }
    setLinhas((ls) =>
      ls.map((l) => {
        if (l.divisao) return l;
        const preco = precoPelaMargem(l, margemTodos);
        if (preco === null) return l;
        return { ...l, valor_unitario: preco };
      })
    );
    setMargemDigitada({});
    setAviso({ tipo: "ok", texto: `Preços recalculados com margem de ${margemTodos}% (itens sem custo não mudam). Clique em Salvar para gravar.` });
  }

  function adicionarProduto(p: ProdutoBusca) {
    setLinhas((ls) => {
      const existente = ls.find((l) => l.produto_id === p.id);
      if (existente) return ls.map((l) => (l === existente ? { ...l, quantidade: String(numOu0(l.quantidade) + 1) } : l));
      return [
        ...ls,
        {
          key: novaChave(),
          produto_id: p.id,
          tipo: "produto",
          descricao: p.nome,
          quantidade: "1",
          // Sem preço de venda no estoque: usa o custo com o markup/margem padrão
          valor_unitario: txtNum(p.preco ?? (p.custo !== null ? sugerido(p.custo) : 0)),
          custo_unitario: txtNum(p.custo),
        },
      ];
    });
  }
  function adicionarLivre(tipo: TipoItem) {
    setLinhas((ls) => [
      ...ls,
      { key: novaChave(), produto_id: null, tipo, descricao: tipo === "servico" ? "Mão de obra - instalação" : "", quantidade: "1", valor_unitario: "", custo_unitario: "" },
    ]);
  }
  // Avisa o que continua lançado (gastos do projeto e contas a receber) antes de voltar para proposta
  function confirmarReabrir() {
    const avisos: string[] = [];
    if (gastosProjeto.n > 0) avisos.push(`- ${gastosProjeto.n} gasto(s) lançado(s) no projeto (${brl(gastosProjeto.total)}): ficam guardados e voltam quando aprovar de novo`);
    if (contas.length > 0) {
      const pagas = contas.filter((c) => c.status === "pago").length;
      avisos.push(`- ${contas.length} conta(s) a receber ligada(s)${pagas ? `, ${pagas} já recebida(s)` : ""}: NÃO são apagadas; se não valerem mais, apague no financeiro`);
    }
    if (!avisos.length) return true;
    return confirm(`Voltar este orçamento para rascunho?\n\nAtenção, ele já tem:\n${avisos.join("\n")}`);
  }
  function adicionarDivisao() {
    setLinhas((ls) => [...ls, novaDivisao()]);
  }
  function mover(i: number, d: number) {
    setLinhas((ls) => {
      const j = i + d;
      if (j < 0 || j >= ls.length) return ls;
      const n = [...ls];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  }
  // Arrastar e soltar: a linha só fica arrastável enquanto o mouse está na alça (senão atrapalha os campos)
  const [alca, setAlca] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);
  function soltarEm(destino: string) {
    const origem = arrastando;
    setArrastando(null);
    setAlvo(null);
    setAlca(null);
    if (!origem || origem === destino) return;
    setLinhas((ls) => {
      const de = ls.findIndex((l) => l.key === origem);
      const para = ls.findIndex((l) => l.key === destino);
      if (de < 0 || para < 0) return ls;
      const n = [...ls];
      const [x] = n.splice(de, 1);
      n.splice(para, 0, x);
      return n;
    });
  }
  function arrastavel(key: string) {
    if (!editavel) return {};
    return {
      draggable: alca === key,
      onDragStart: (e: React.DragEvent) => { setArrastando(key); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", key); },
      onDragOver: (e: React.DragEvent) => { if (!arrastando) return; e.preventDefault(); if (alvo !== key) setAlvo(key); },
      onDrop: (e: React.DragEvent) => { e.preventDefault(); soltarEm(key); },
      onDragEnd: () => { setArrastando(null); setAlvo(null); setAlca(null); },
    };
  }
  function classeArraste(key: string) {
    if (arrastando === key) return " orc-arrastando";
    if (alvo === key && arrastando) {
      const de = linhas.findIndex((l) => l.key === arrastando), para = linhas.findIndex((l) => l.key === key);
      return de < para ? " orc-alvo-baixo" : " orc-alvo-cima";
    }
    return "";
  }
  function alcaDe(k: string) {
    if (!editavel) return null;
    return (
      <span className="orc-alca" title="Arraste para mudar a ordem" onMouseDown={() => setAlca(k)} onMouseUp={() => setAlca(null)}>
        <Icone nome="arrastar" tamanho={14} />
      </span>
    );
  }
  function remover(key: string) {
    setLinhas((ls) => ls.filter((l) => l.key !== key));
  }

  // ---------------- salvar ----------------
  const [salvo, acaoSalvar, salvando] = useActionState(
    async (prev: unknown, fd: FormData) => salvarOrcamento(id, prev, fd),
    undefined
  );
  const tratado = useRef<unknown>(null);
  useEffect(() => {
    if (!salvo || tratado.current === salvo) return;
    tratado.current = salvo;
    if ("ok" in salvo && !id) router.push(`/orcamentos/${salvo.ok}`);
  }, [salvo, id, router]);

  // ---------------- ações de status ----------------
  const [janela, setJanela] = useState<Janela>(null);
  const [pendente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string; lista?: string[] } | null>(null);
  const [comConta, setComConta] = useState(false);
  const contaPadrao = (): ContaForm => ({
    empresa_id: cab.empresa_id || empresaPadrao || "",
    valor: txtNum(tot.total),
    vencimento: hojeISO(),
    parcelas: "1",
  });
  const [conta, setConta] = useState<ContaForm>(contaPadrao);
  const [apagarContas, setApagarContas] = useState(true);

  function abrir(j: Janela) {
    setAviso(null);
    setComConta(j === "conta");
    setConta(contaPadrao());
    setJanela(j);
  }

  function pedidoConta(): ContaReceberPedido | null {
    if (!comConta) return null;
    return { empresa_id: conta.empresa_id, valor: Number(conta.valor), vencimento: conta.vencimento, parcelas: Number(conta.parcelas) };
  }

  function rodar<T>(fn: () => Promise<Resp<T>>, sucesso: string, depois?: (ok: T) => void) {
    iniciar(async () => {
      const r = await fn();
      if ("erro" in r) {
        setAviso({ tipo: "error", texto: r.erro, lista: r.faltando });
        return;
      }
      setJanela(null);
      setAviso({ tipo: "ok", texto: sucesso });
      depois?.(r.ok);
    });
  }

  const contasAbertas = contas.filter((c) => c.status === "aberto");
  const produtosLinhas = linhas.filter((l) => l.produto_id);
  const temEmpresa = empresas.length > 0;

  const linhasBaixa = useMemo(
    () =>
      [...pedido.entries()].map(([pid, q]) => {
        const p = porProduto.get(pid);
        return { pid, codigo: p?.codigo, nome: p?.nome ?? "(produto removido)", q, estoque: p?.quantidade ?? 0 };
      }),
    [pedido, porProduto]
  );

  const avisoBox = aviso && (
    <div className={`alert ${aviso.tipo}`}>
      {aviso.texto}
      {aviso.lista && aviso.lista.length > 0 && <ul className="orc-lista-falta">{aviso.lista.map((f) => <li key={f}>{f}</li>)}</ul>}
    </div>
  );

  const blocoConta = podeReceber && temEmpresa && (
    <div className="orc-conta-bloco">
      <label className="check">
        <input type="checkbox" checked={comConta} onChange={(e) => setComConta(e.target.checked)} /> Gerar conta a receber
      </label>
      {comConta && <ContaReceberCampos valor={conta} onMudar={setConta} empresas={empresas} />}
      {comConta && contas.length > 0 && <p className="small" style={{ color: "var(--warn)" }}>Este orçamento já tem {contas.length} conta(s) a receber ligada(s).</p>}
    </div>
  );

  const colunas = 5 + (mostrarCusto ? 2 : 0) + (editavel ? 1 : 0);

  return (
    <>
      <p className="small"><Link href="/orcamentos">← Voltar para orçamentos</Link></p>
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ marginBottom: ".25rem" }}>{orcamento ? `Orçamento #${orcamento.numero}` : "Novo orçamento"}</h1>
          {orcamento && (
            <div className="actions small muted">
              <span className="badge">{TIPO_ORCAMENTO[orcamento.tipo]}</span>
              <span className={`badge ${BADGE_ORCAMENTO[status]}`}>{rotuloStatus(orcamento.tipo, status)}</span>
              <span>criado em {new Date(orcamento.created_at).toLocaleDateString("pt-BR", { timeZone: FUSO })}</span>
              {orcamento.baixado_em && <span>· baixa em {new Date(orcamento.baixado_em).toLocaleString("pt-BR", { timeZone: FUSO })}{orcamento.baixado_por && ` por ${orcamento.baixado_por}`}</span>}
            </div>
          )}
        </div>
        <div className="actions">
          {orcamento && orcamento.tipo === "projeto" && (status === "aprovado" || status === "baixado") && (
            <Link className="btn primary" href={`/projetos/${orcamento.id}`}><Icone nome="maleta" tamanho={16} /> Gestão do projeto</Link>
          )}
          <button type="button" className={`btn ${previa ? "active" : ""}`} onClick={alternarPrevia}>
            <Icone nome="nota" tamanho={16} /> {previa ? "Esconder prévia" : "Mostrar prévia"}
          </button>
          {orcamento && (
            <a className="btn" href={`/orcamento-impressao/${orcamento.id}`} target="_blank" rel="noopener" title={alterado ? "Salve antes para imprimir a versão atual" : undefined}>
              <Icone nome="imprimir" tamanho={16} /> Proposta para o cliente
            </a>
          )}
        </div>
      </div>

      <div className={previa ? "orc-com-previa" : ""}>
      <div className="orc-editor-col">

      {avisoBox && !janela && avisoBox}
      {status === "baixado" && <div className="alert ok">Os itens deste orçamento já saíram do estoque. Para editar, estorne a baixa.</div>}
      {status === "cancelado" && <div className="alert warn">Orçamento cancelado. Reabra como rascunho para editar.</div>}

      {/* Cabeçalho */}
      <div className="card">
        <div className="grid2">
          <label className="field">
            <span>Projeto</span>
            <input value={cab.titulo} disabled={!editavel} placeholder="Ex.: CFTV 8 câmeras - Condomínio X" onChange={(e) => setCab({ ...cab, titulo: e.target.value })} />
          </label>
          <ClienteCampo
            clientes={clientes}
            clienteId={cab.cliente_id}
            clienteNome={cab.cliente_nome}
            desabilitado={!editavel}
            onMudar={(cid, nome) => setCab((c) => ({ ...c, cliente_id: cid, cliente_nome: nome }))}
            onNovoCliente={(c) => setClientes((cs) => [...cs, c].sort((a, b) => a.nome.localeCompare(b.nome)))}
          />
        </div>
        <div className="grid4">
          <label className="field">
            <span>Tipo</span>
            <select
              value={cab.tipo}
              disabled={pendente || (!editavel && !orcamento)}
              onChange={(e) => {
                const tipo = e.target.value as TipoOrcamento;
                if (editavel || !orcamento) return setCab({ ...cab, tipo });
                // Depois da baixa só a classificação muda, na hora
                if (!window.confirm(`Mudar este orçamento para "${TIPO_ORCAMENTO[tipo]}"? Estoque e contas não mudam.`)) return;
                const oid = orcamento.id;
                rodar(() => mudarTipoOrcamento(oid, tipo), "Tipo corrigido.", () => setCab((c) => ({ ...c, tipo })));
              }}
            >
              <option value="projeto">{TIPO_ORCAMENTO.projeto}</option>
              <option value="venda">{TIPO_ORCAMENTO.venda}</option>
            </select>
          </label>
          {cab.tipo === "projeto" && (
            <label className="field">
              <span>Valor fechado do contrato</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cab.valor_contrato}
                disabled={!editavel}
                placeholder={`Total: ${brl(tot.total)}`}
                onChange={(e) => setCab({ ...cab, valor_contrato: e.target.value })}
              />
            </label>
          )}
          <label className="field">
            <span>Validade</span>
            <input type="date" value={cab.validade} disabled={!editavel} onChange={(e) => setCab({ ...cab, validade: e.target.value })} />
          </label>
          <label className="field">
            <span>Empresa (financeiro)</span>
            <select value={cab.empresa_id} disabled={!editavel} onChange={(e) => setCab({ ...cab, empresa_id: e.target.value })}>
              <option value="">—</option>
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </label>
        </div>
        {!temEmpresa && <p className="small muted">Nenhuma empresa cadastrada. <Link href="/financeiro/empresas">Cadastre uma</Link> para gerar contas a receber.</p>}
        <div className="grid2">
          <label className="field">
            <span>Condições de pagamento</span>
            <textarea rows={2} value={cab.condicoes} disabled={!editavel} placeholder="Ex.: 50% na aprovação e 50% na entrega; PIX ou boleto" onChange={(e) => setCab({ ...cab, condicoes: e.target.value })} />
          </label>
          <label className="field">
            <span>Observações (aparecem para o cliente)</span>
            <textarea rows={2} value={cab.observacoes} disabled={!editavel} placeholder="Ex.: Na filial do setor bancário o material deverá ser fornecido pelo cliente." onChange={(e) => setCab({ ...cab, observacoes: e.target.value })} />
          </label>
        </div>
      </div>

      {/* Textos da proposta comercial */}
      <div className="card">
        <h3>Proposta comercial</h3>
        <div className="grid2">
          <label className="field">
            <span>Valores na proposta</span>
            <select value={cab.exibir_valores} disabled={!editavel} onChange={(e) => setCab({ ...cab, exibir_valores: e.target.value as ExibirValores })}>
              <option value="total">Só o valor total (material, serviço e total)</option>
              <option value="itens">Valor de cada item</option>
            </select>
          </label>
        </div>
        <div className="grid2">
          <label className="field">
            <span>A/C (aos cuidados de)</span>
            <input value={cab.aos_cuidados} disabled={!editavel} placeholder="Ex.: Sra. Ravana – Gran Cursos" onChange={(e) => setCab({ ...cab, aos_cuidados: e.target.value })} />
          </label>
          <label className="field">
            <span>Prazo de entrega</span>
            <input value={cab.prazo_entrega} disabled={!editavel} onChange={(e) => setCab({ ...cab, prazo_entrega: e.target.value })} />
          </label>
        </div>
        <label className="field">
          <span>Descrição do serviço</span>
          <textarea
            rows={4}
            value={cab.descricao_servico}
            disabled={!editavel}
            placeholder={"1 - Substituição de sistema de alarme instalado na filial do setor bancário Sul.\n2 - Fornecimento e instalação de central de alarme Intelbras para a filial Park Shopping."}
            onChange={(e) => setCab({ ...cab, descricao_servico: e.target.value })}
          />
          <span className="small muted orc-dica">Em branco, a proposta lista os serviços da tabela de itens.</span>
        </label>
        <div className="grid2">
          <label className="field">
            <span>Garantia (fabricação)</span>
            <input value={cab.garantia_fabricacao} disabled={!editavel} onChange={(e) => setCab({ ...cab, garantia_fabricacao: e.target.value })} />
          </label>
          <label className="field">
            <span>Garantia (instalação)</span>
            <input value={cab.garantia_instalacao} disabled={!editavel} onChange={(e) => setCab({ ...cab, garantia_instalacao: e.target.value })} />
          </label>
        </div>
      </div>

      {/* Itens */}
      <div className="card">
        <div className="actions" style={{ justifyContent: "space-between", marginBottom: ".75rem" }}>
          <h3 style={{ margin: 0 }}>Itens</h3>
          {verCusto && (
            <div className="actions">
              {mostrarCusto && editavel && (
                <span className="orc-margem-todos small">
                  Margem em todos
                  <input className="orc-num" type="number" step="0.1" max="99.9" placeholder="%" value={margemTodos} onChange={(e) => setMargemTodos(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); aplicarMargemTodos(); } }} />
                  <button type="button" className="btn small" onClick={aplicarMargemTodos} title="Recalcula o valor de venda de todos os itens que têm custo">Aplicar</button>
                </span>
              )}
              <label className="check small" title={`Ao digitar o custo, o valor de venda é preenchido com ${precificacao.modo} de ${precificacao.percentual}% (Configurações). Mudando a margem de um item, o valor de venda é recalculado.`}><input type="checkbox" checked={mostrarCusto} onChange={(e) => setMostrarCusto(e.target.checked)} /> Mostrar custo e margem</label>
            </div>
          )}
        </div>
        {editavel && (
          <div className="orc-adicionar">
            <BuscaProduto produtos={produtos} onEscolher={adicionarProduto} />
            <button type="button" className="btn" onClick={() => adicionarLivre("servico")}><Icone nome="novo" tamanho={14} /> Serviço / mão de obra</button>
            <button type="button" className="btn" onClick={() => adicionarLivre("produto")}><Icone nome="novo" tamanho={14} /> Item avulso</button>
            <button type="button" className="btn" onClick={adicionarDivisao} title="Separa os itens (ex.: CFTV, ALARME). Os itens abaixo da divisão ficam nela.">
              <Icone nome="divisao" tamanho={14} /> Divisão
            </button>
          </div>
        )}
        {verificarSaldo && faltas.length > 0 && (
          <div className="alert error small">
            <Icone nome="alerta" tamanho={14} /> Quantidade maior que o estoque:{" "}
            {faltas.map((f) => `#${f.p.codigo} ${f.p.nome} (pedido ${f.q}, em estoque ${f.p.quantidade})`).join("; ")}
          </div>
        )}

        {mudancas.length > 0 && (
          <div className="alert warn small orc-mudancas">
            <div>
              <Icone nome="alerta" tamanho={14} /> {mudancas.length} item(ns) mudaram no estoque depois de entrar neste orçamento
              {mudouCusto > 0 && ` · ${mudouCusto} com custo novo`}
              {mudouPreco > 0 && ` · ${mudouPreco} com preço de venda novo`}:
              <ul>
                {mudancas.map((m) => (
                  <li key={m.key}>
                    #{m.p.codigo} {m.p.nome}
                    {m.difCusto && <> · custo {m.custoAtual === null ? "sem custo" : brl(m.custoAtual)} → <strong>{brl(m.p.custo ?? 0)}</strong></>}
                    {m.difPreco && <> · preço {brl(m.precoAtual)} → <strong>{brl(m.p.preco ?? 0)}</strong></>}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: ".35rem" }}>Depois de atualizar, clique em <strong>Salvar</strong> para gravar no orçamento.</div>
            </div>
            <div className="actions">
              {mudouCusto > 0 && (
                <button type="button" className="btn small" onClick={() => atualizarDoEstoque(false)} title="Atualiza só o custo (margem e lucro); o preço passado ao cliente não muda">
                  Atualizar só os custos
                </button>
              )}
              {mudouPreco > 0 && (
                <button type="button" className="btn small primary" onClick={() => atualizarDoEstoque(true)} title="Atualiza o custo e troca o preço de venda pelo preço atual do estoque">
                  Atualizar custos e preços
                </button>
              )}
            </div>
          </div>
        )}

        <div className="table-wrap orc-tabela">
          <table>
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Descrição</th>
                <th className="num">Qtd</th>
                <th className="num">Valor unit.</th>
                <th className="num">Subtotal</th>
                {mostrarCusto && <th className="num">Custo unit.</th>}
                {mostrarCusto && <th className="num">Margem</th>}
                {editavel && <th></th>}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => {
                const acoesLinha = editavel && (
                  <td className="orc-linha-acoes">
                    <button type="button" className="btn small" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir"><Icone nome="cima" tamanho={14} /></button>
                    <button type="button" className="btn small" onClick={() => mover(i, 1)} disabled={i === linhas.length - 1} aria-label="Descer"><Icone nome="baixo" tamanho={14} /></button>
                    <button type="button" className="btn small danger" onClick={() => remover(l.key)} aria-label="Remover"><Icone nome="lixo" tamanho={14} /></button>
                  </td>
                );
                if (l.divisao) {
                  // Soma dos itens até a próxima divisão
                  let somaDiv = 0;
                  for (let j = i + 1; j < linhas.length && !linhas[j].divisao; j++) {
                    const x = paraItem(linhas[j]);
                    somaDiv += x.quantidade * x.valor_unitario;
                  }
                  return (
                    <tr key={l.key} className={`orc-divisao${classeArraste(l.key)}`} {...arrastavel(l.key)}>
                      <td className="num muted orc-c-n">{alcaDe(l.key)}<Icone nome="divisao" tamanho={14} /></td>
                      <td colSpan={3} className="orc-c-div">
                        <input value={l.descricao} disabled={!editavel} placeholder="Nome da divisão (ex.: CFTV, ALARME)" onChange={(e) => mudarLinha(l.key, "descricao", e.target.value)} />
                      </td>
                      <td className="num" data-rotulo="Soma da divisão"><strong>{brl(somaDiv)}</strong></td>
                      {mostrarCusto && <td colSpan={2}></td>}
                      {acoesLinha}
                    </tr>
                  );
                }
                const it = paraItem(l);
                const sub = it.quantidade * it.valor_unitario;
                const p = l.produto_id ? porProduto.get(l.produto_id) : undefined;
                const falta = verificarSaldo && p && (pedido.get(p.id) ?? 0) > p.quantidade;
                const margem = it.custo_unitario !== null && sub > 0 ? ((sub - it.custo_unitario * it.quantidade) / sub) * 100 : null;
                return (
                  <tr key={l.key} className={`${falta ? "orc-falta" : ""}${classeArraste(l.key)}`} {...arrastavel(l.key)}>
                    <td className="num muted orc-c-n">{alcaDe(l.key)}{linhas.slice(0, i + 1).filter((x) => !x.divisao).length}</td>
                    <td className="orc-desc">
                      <input value={l.descricao} disabled={!editavel} placeholder={l.tipo === "servico" ? "Descrição do serviço" : "Descrição do item"} onChange={(e) => mudarLinha(l.key, "descricao", e.target.value)} />
                      <div className="small muted">
                        {l.tipo === "servico" ? (
                          <span className="badge">Serviço</span>
                        ) : p ? (
                          <>
                            <Link href={`/itens/${p.id}`} target="_blank">#{p.codigo}</Link>
                            {" · "}
                            <span className={falta ? "diff-neg" : ""}>em estoque: {p.quantidade}{falta && ` (faltam ${(pedido.get(p.id) ?? 0) - p.quantidade})`}</span>
                          </>
                        ) : l.produto_id ? (
                          <span className="diff-neg">produto removido do estoque</span>
                        ) : (
                          <span className="badge">Avulso (fora do estoque)</span>
                        )}
                      </div>
                    </td>
                    <td className="num" data-rotulo="Qtd">
                      <input className="orc-num" type="number" min={l.produto_id ? 1 : 0.01} step={l.produto_id ? 1 : 0.01} value={l.quantidade} disabled={!editavel} onChange={(e) => mudarLinha(l.key, "quantidade", e.target.value)} />
                    </td>
                    <td className="num" data-rotulo="Valor unit.">
                      <input className="orc-num orc-valor" type="number" min="0" step="0.01" value={l.valor_unitario} disabled={!editavel} onChange={(e) => mudarLinha(l.key, "valor_unitario", e.target.value)} />
                    </td>
                    <td className="num" data-rotulo="Subtotal"><strong>{brl(sub)}</strong></td>
                    {mostrarCusto && (
                      <td className="num" data-rotulo="Custo unit.">
                        {l.produto_id ? (
                          <span title="Custo do produto quando entrou no orçamento">{it.custo_unitario === null ? <span className="muted">sem custo</span> : brl(it.custo_unitario)}</span>
                        ) : (
                          <input className="orc-num orc-valor" type="number" min="0" step="0.01" value={l.custo_unitario} disabled={!editavel} placeholder="—" onChange={(e) => mudarLinha(l.key, "custo_unitario", e.target.value)} />
                        )}
                      </td>
                    )}
                    {mostrarCusto && (
                      <td className={`num small ${margem !== null && margem < 0 ? "diff-neg" : ""}`} data-rotulo="Margem">
                        {editavel && it.custo_unitario !== null ? (
                          <span className="orc-margem" title="Mude a margem e o valor de venda é recalculado">
                            <input
                              className="orc-num"
                              type="number"
                              step="0.1"
                              max="99.9"
                              value={margemDigitada[l.key] ?? (margem === null ? "" : String(Math.round(margem * 10) / 10))}
                              onChange={(e) => mudarMargem(l, e.target.value)}
                              onBlur={() => setMargemDigitada(({ [l.key]: _, ...resto }) => resto)}
                            />%
                          </span>
                        ) : margem === null ? "—" : `${margem.toFixed(1)}%`}
                      </td>
                    )}
                    {acoesLinha}
                  </tr>
                );
              })}
              {!linhas.length && (
                <tr><td colSpan={colunas} className="muted" style={{ textAlign: "center", padding: "1.25rem" }}>Nenhum item. Busque um produto acima ou adicione um serviço.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="orc-totais">
          {mostrarCusto && (
            <div className="orc-lucro">
              <div><span className="muted">Custo total</span> <strong>{brl(tot.custo)}</strong></div>
              <div>
                <span className="muted">Lucro estimado</span>{" "}
                <strong className={tot.lucro >= 0 ? "diff-pos" : "diff-neg"}>{brl(tot.lucro)}</strong>
                {tot.total > 0 && <span className="muted"> ({((tot.lucro / tot.total) * 100).toFixed(1)}%)</span>}
              </div>
              {tot.semCusto > 0 && <div className="small" style={{ color: "var(--warn)" }}>{tot.semCusto} item(ns) do estoque sem custo cadastrado (contam como zero).</div>}
            </div>
          )}
          <div className="orc-soma">
            <div><span className="muted">Produtos</span> <span>{brl(subProdutos)}</span></div>
            <div><span className="muted">Serviços</span> <span>{brl(subServicos)}</span></div>
            <div><span className="muted">Subtotal</span> <span>{brl(tot.subtotal)}</span></div>
            <label>
              <span className="muted">Desconto <span className="small">(R$ ou %)</span></span>
              <input
                className="orc-num orc-valor"
                type="text"
                inputMode="decimal"
                placeholder="0 ou 10%"
                title="Digite o valor em reais (ex.: 150) ou a porcentagem com % (ex.: 10%)"
                value={cab.desconto}
                disabled={!editavel}
                onChange={(e) => setCab({ ...cab, desconto: e.target.value })}
              />
            </label>
            {tot.desconto > 0 && tot.subtotal > 0 && (
              <div className="small muted">
                <span>{cab.desconto.trim().endsWith("%") ? `= ${brl(tot.desconto)}` : `= ${((tot.desconto / tot.subtotal) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% do subtotal`}</span>
              </div>
            )}
            <div className="orc-total"><span>Total</span> <strong>{brl(tot.total)}</strong></div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="card orc-barra">
        {salvo && "erro" in salvo && <div className="alert error">{salvo.erro}</div>}
        {salvo && "ok" in salvo && !alterado && id && <div className="alert ok">Orçamento salvo.</div>}
        <div className="actions">
          {editavel && (
            <form action={acaoSalvar}>
              <input type="hidden" name="dados" value={dadosJson} />
              <button className="btn primary" type="submit" disabled={salvando || (!!id && !alterado)}>
                {salvando ? "Salvando..." : id ? "Salvar alterações" : "Salvar rascunho"}
              </button>
            </form>
          )}
          {id && (
            <>
              {status === "rascunho" && (
                <button className="btn" disabled={alterado || pendente} onClick={() => abrir("aprovar")}><Icone nome="ok" tamanho={16} /> Aprovar</button>
              )}
              {editavel && (
                <button className="btn" disabled={alterado || pendente || !produtosLinhas.length} onClick={() => abrir("baixa")} title={!produtosLinhas.length ? "Sem itens do estoque" : undefined}>
                  <Icone nome="itens" tamanho={16} /> Dar baixa no estoque
                </button>
              )}
              {status === "baixado" && (
                <button className="btn" disabled={pendente} onClick={() => abrir("estornar")}><Icone nome="estorno" tamanho={16} /> Estornar baixa</button>
              )}
              {podeReceber && temEmpresa && (status === "aprovado" || status === "baixado") && (
                <button className="btn" disabled={alterado || pendente} onClick={() => abrir("conta")}><Icone nome="receber" tamanho={16} /> Gerar conta a receber</button>
              )}
              {(status === "aprovado" || status === "cancelado") && (
                <button className="btn" disabled={alterado || pendente} onClick={() => confirmarReabrir() && rodar(() => mudarStatusOrcamento(id, "reabrir"), "Orçamento voltou para rascunho.")}>
                  Voltar para rascunho
                </button>
              )}
              {editavel && (
                <button
                  className="btn"
                  disabled={alterado || pendente}
                  onClick={() => confirm("Cancelar este orçamento?") && rodar(() => mudarStatusOrcamento(id, "cancelar"), "Orçamento cancelado.")}
                >
                  Cancelar orçamento
                </button>
              )}
              <button className="btn" disabled={pendente} onClick={() => rodar(() => duplicarOrcamento(id), "Orçamento duplicado.", (novo) => router.push(`/orcamentos/${novo}`))}>
                <Icone nome="copiar" tamanho={16} /> Duplicar
              </button>
              {status !== "baixado" && (
                <button className="btn danger" disabled={pendente} onClick={() => abrir("excluir")}><Icone nome="lixo" tamanho={16} /> Excluir</button>
              )}
            </>
          )}
        </div>
        {id && alterado && editavel && <p className="small muted" style={{ marginBottom: 0 }}>Há alterações não salvas. Salve antes de aprovar, dar baixa ou imprimir.</p>}
      </div>

      {/* Contas a receber ligadas */}
      {contas.length > 0 && (
        <div className="card">
          <h3>Contas a receber deste orçamento</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Descrição</th><th className="hide-sm">Empresa</th><th>Vencimento</th><th className="num">Valor</th><th>Status</th></tr></thead>
              <tbody>
                {contas.map((c) => (
                  <tr key={c.id}>
                    <td className="small">{c.descricao}</td>
                    <td className="small hide-sm">{c.empresa_nome}</td>
                    <td className="small">{dataBR(c.vencimento)}</td>
                    <td className="num">{brl(c.valor)}</td>
                    <td><span className={`badge ${c.status === "pago" ? "anunciado" : "a_revisar"}`}>{c.status === "pago" ? "Recebido" : "Em aberto"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {podeReceber && <p className="small"><Link href="/financeiro/receber">Abrir contas a receber</Link></p>}
        </div>
      )}

      </div>

      {previa && (
        <aside className="orc-previa" aria-label="Prévia da proposta">
          <div className="small muted orc-previa-titulo">Prévia da proposta{alterado && id ? " (salve para imprimir esta versão)" : ""}</div>
          <PropostaFolha o={dadosPrevia} itens={itensPrevia} empresa={empresaPrevia} />
          {!empresaPrevia && <p className="small muted">Escolha a empresa para o CNPJ, endereço e assinatura aparecerem.</p>}
        </aside>
      )}
      </div>

      {/* Janelas */}
      {janela === "baixa" && id && (
        <Modal titulo={`Dar baixa no estoque - #${orcamento?.numero}`} onFechar={() => setJanela(null)} largo>
          {avisoBox}
          <p className="small muted">Estes itens vão sair do estoque de uma vez (motivo: &quot;Orçamento #{orcamento?.numero} - {cab.titulo}&quot;). Serviços e itens avulsos não mexem no estoque.</p>
          <div className="table-wrap" style={{ marginBottom: "1rem" }}>
            <table>
              <thead><tr><th>Produto</th><th className="num">Sai</th><th className="num">Em estoque</th><th className="num">Fica</th></tr></thead>
              <tbody>
                {linhasBaixa.map((b) => (
                  <tr key={b.pid} className={b.q > b.estoque ? "orc-falta" : ""}>
                    <td className="small">{b.codigo !== undefined && <span className="muted">#{b.codigo} </span>}{b.nome}</td>
                    <td className="num"><strong>{b.q}</strong></td>
                    <td className="num">{b.estoque}</td>
                    <td className={`num ${b.q > b.estoque ? "diff-neg" : ""}`}>{b.estoque - b.q}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {faltas.length > 0 && <div className="alert error">Saldo insuficiente para {faltas.length} produto(s). Ajuste as quantidades ou dê entrada no estoque antes.</div>}
          {blocoConta}
          <div className="actions">
            <button className="btn primary" disabled={pendente || faltas.length > 0} onClick={() => rodar(() => darBaixaOrcamento(id, pedidoConta()), "Baixa feita: os itens saíram do estoque.")}>
              {pendente ? "Baixando..." : "Confirmar baixa"}
            </button>
            <button className="btn" onClick={() => setJanela(null)}>Voltar</button>
          </div>
        </Modal>
      )}

      {janela === "aprovar" && id && (
        <Modal titulo={`Aprovar orçamento #${orcamento?.numero}`} onFechar={() => setJanela(null)}>
          {avisoBox}
          <p>Total: <strong>{brl(tot.total)}</strong>. O estoque não muda na aprovação; a baixa é feita depois.</p>
          {blocoConta}
          <div className="actions">
            <button className="btn primary" disabled={pendente} onClick={() => rodar(() => mudarStatusOrcamento(id, "aprovar", pedidoConta()), "Orçamento aprovado.")}>Aprovar</button>
            <button className="btn" onClick={() => setJanela(null)}>Voltar</button>
          </div>
        </Modal>
      )}

      {janela === "conta" && id && (
        <Modal titulo="Gerar conta a receber" onFechar={() => setJanela(null)}>
          {avisoBox}
          <p className="small muted">Descrição: &quot;Orçamento #{orcamento?.numero} - {cab.titulo}&quot;{cab.cliente_nome && `, cliente ${cab.cliente_nome}`}.</p>
          {contas.length > 0 && <p className="small" style={{ color: "var(--warn)" }}>Este orçamento já tem {contas.length} conta(s) a receber ligada(s).</p>}
          <ContaReceberCampos valor={conta} onMudar={setConta} empresas={empresas} />
          <div className="actions">
            <button className="btn primary" disabled={pendente} onClick={() => rodar(() => gerarContaReceber(id, pedidoConta()!), "Conta a receber criada.")}>Gerar</button>
            <button className="btn" onClick={() => setJanela(null)}>Voltar</button>
          </div>
        </Modal>
      )}

      {janela === "estornar" && id && (
        <Modal titulo={`Estornar baixa - #${orcamento?.numero}`} onFechar={() => setJanela(null)}>
          {avisoBox}
          <p>Todos os itens do estoque deste orçamento voltam para o estoque e o orçamento volta para <strong>aprovado</strong>.</p>
          <ul className="small">
            {linhasBaixa.map((b) => <li key={b.pid}>+{b.q} · {b.codigo !== undefined && `#${b.codigo} `}{b.nome}</li>)}
          </ul>
          <div className="actions">
            <button className="btn primary" disabled={pendente} onClick={() => rodar(() => estornarBaixaOrcamento(id), "Baixa estornada: os itens voltaram ao estoque.")}>Estornar</button>
            <button className="btn" onClick={() => setJanela(null)}>Voltar</button>
          </div>
        </Modal>
      )}

      {janela === "excluir" && id && (
        <Modal titulo={`Excluir orçamento #${orcamento?.numero}`} onFechar={() => setJanela(null)}>
          {avisoBox}
          <p>O orçamento e seus itens serão apagados. O estoque não muda.</p>
          {contasAbertas.length > 0 && (
            podeReceber ? (
              <label className="check">
                <input type="checkbox" checked={apagarContas} onChange={(e) => setApagarContas(e.target.checked)} />
                Apagar também as {contasAbertas.length} conta(s) a receber em aberto ligadas ({brl(contasAbertas.reduce((s, c) => s + c.valor, 0))})
              </label>
            ) : (
              <p className="small" style={{ color: "var(--warn)" }}>As {contasAbertas.length} conta(s) a receber ligadas continuam no financeiro.</p>
            )
          )}
          {contas.some((c) => c.status === "pago") && <p className="small muted">Contas já recebidas continuam no financeiro.</p>}
          <div className="actions">
            <button
              className="btn danger"
              disabled={pendente}
              onClick={() => rodar(() => excluirOrcamento(id, podeReceber && contasAbertas.length > 0 && apagarContas), "Orçamento excluído.", () => router.push("/orcamentos"))}
            >
              Excluir
            </button>
            <button className="btn" onClick={() => setJanela(null)}>Voltar</button>
          </div>
        </Modal>
      )}
    </>
  );
}
