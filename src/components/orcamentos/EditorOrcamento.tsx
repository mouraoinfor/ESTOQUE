"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Icone from "@/components/Icone";
import { brl, dataBR, hojeISO } from "@/lib/formato";
import {
  darBaixaOrcamento,
  duplicarOrcamento,
  estornarBaixaOrcamento,
  excluirOrcamento,
  gerarContaReceber,
  mudarStatusOrcamento,
  salvarOrcamento,
} from "@/app/acoes-orcamentos";
import BuscaProduto from "./BuscaProduto";
import ClienteCampo from "./ClienteCampo";
import ContaReceberCampos, { type ContaForm } from "./ContaReceberCampos";
import Modal from "./Modal";
import {
  BADGE_ORCAMENTO,
  STATUS_ORCAMENTO,
  totaisOrcamento,
  type ClienteBusca,
  type ContaReceberPedido,
  type ItemOrcamento,
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
}

interface Cabecalho {
  titulo: string;
  cliente_id: string | null;
  cliente_nome: string;
  empresa_id: string;
  validade: string;
  condicoes: string;
  observacoes: string;
  desconto: string;
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
    cliente_id: o?.cliente_id ?? null,
    cliente_nome: o?.cliente_nome ?? "",
    empresa_id: o ? o.empresa_id ?? "" : empresaPadrao ?? "",
    validade: o ? o.validade ?? "" : validadePadrao,
    condicoes: o?.condicoes ?? "",
    observacoes: o?.observacoes ?? "",
    desconto: o && o.desconto ? txtNum(o.desconto) : "",
  };
}

function montarDados(c: Cabecalho, linhas: Linha[]) {
  return {
    titulo: c.titulo.trim(),
    cliente_id: c.cliente_id,
    cliente_nome: c.cliente_nome.trim() || null,
    empresa_id: c.empresa_id || null,
    validade: c.validade || null,
    observacoes: c.observacoes.trim() || null,
    condicoes: c.condicoes.trim() || null,
    desconto: numOu0(c.desconto),
    itens: linhas.map(paraItem),
  };
}

export default function EditorOrcamento({
  orcamento,
  versao,
  itens,
  produtos,
  clientes: clientesIniciais,
  empresas,
  empresaPadrao,
  validadePadrao,
  verCusto,
  podeReceber,
  contas,
}: {
  orcamento: Orcamento | null;
  versao: string;
  itens: ItemOrcamento[];
  produtos: ProdutoBusca[];
  clientes: ClienteBusca[];
  empresas: { id: string; nome: string }[];
  empresaPadrao: string | null;
  validadePadrao: string;
  verCusto: boolean;
  podeReceber: boolean;
  contas: ContaLigada[];
}) {
  const router = useRouter();
  const id = orcamento?.id ?? null;
  const status = orcamento?.status ?? "rascunho";
  const editavel = status === "rascunho" || status === "aprovado";

  const [cab, setCab] = useState(() => cabecalhoDe(orcamento, empresaPadrao, validadePadrao));
  const [linhas, setLinhas] = useState<Linha[]>(() => itens.map(paraLinha));
  const [base, setBase] = useState(() => JSON.stringify(montarDados(cabecalhoDe(orcamento, empresaPadrao, validadePadrao), itens.map(paraLinha))));
  const [clientes, setClientes] = useState(clientesIniciais);
  const [mostrarCusto, setMostrarCusto] = useState(verCusto);

  // O servidor gravou (salvar/status): recarrega os dados que vieram da página
  const [versaoVista, setVersaoVista] = useState(versao);
  if (versao !== versaoVista) {
    const c = cabecalhoDe(orcamento, empresaPadrao, validadePadrao);
    const l = itens.map(paraLinha);
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
  const subProdutos = dados.itens.filter((i) => i.tipo === "produto").reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);
  const subServicos = tot.subtotal - subProdutos;

  // ---------------- edição das linhas ----------------
  function mudarLinha(key: string, campo: keyof Linha, valor: string) {
    setLinhas((ls) => ls.map((l) => (l.key === key ? { ...l, [campo]: valor } : l)));
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
          valor_unitario: txtNum(p.preco ?? 0),
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
  function mover(i: number, d: number) {
    setLinhas((ls) => {
      const j = i + d;
      if (j < 0 || j >= ls.length) return ls;
      const n = [...ls];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
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
              <span className={`badge ${BADGE_ORCAMENTO[status]}`}>{STATUS_ORCAMENTO[status]}</span>
              <span>criado em {new Date(orcamento.created_at).toLocaleDateString("pt-BR", { timeZone: FUSO })}</span>
              {orcamento.baixado_em && <span>· baixa em {new Date(orcamento.baixado_em).toLocaleString("pt-BR", { timeZone: FUSO })}{orcamento.baixado_por && ` por ${orcamento.baixado_por}`}</span>}
            </div>
          )}
        </div>
        {orcamento && (
          <div className="actions">
            <a className="btn" href={`/orcamento-impressao/${orcamento.id}`} target="_blank" rel="noopener" title={alterado ? "Salve antes para imprimir a versão atual" : undefined}>
              <Icone nome="imprimir" tamanho={16} /> Versão para o cliente
            </a>
          </div>
        )}
      </div>

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
            <textarea rows={2} value={cab.observacoes} disabled={!editavel} onChange={(e) => setCab({ ...cab, observacoes: e.target.value })} />
          </label>
        </div>
      </div>

      {/* Itens */}
      <div className="card">
        <div className="actions" style={{ justifyContent: "space-between", marginBottom: ".75rem" }}>
          <h3 style={{ margin: 0 }}>Itens</h3>
          {verCusto && (
            <label className="check small"><input type="checkbox" checked={mostrarCusto} onChange={(e) => setMostrarCusto(e.target.checked)} /> Mostrar custo e margem</label>
          )}
        </div>
        {editavel && (
          <div className="orc-adicionar">
            <BuscaProduto produtos={produtos} onEscolher={adicionarProduto} />
            <button type="button" className="btn" onClick={() => adicionarLivre("servico")}><Icone nome="novo" tamanho={14} /> Serviço / mão de obra</button>
            <button type="button" className="btn" onClick={() => adicionarLivre("produto")}><Icone nome="novo" tamanho={14} /> Item avulso</button>
          </div>
        )}
        {verificarSaldo && faltas.length > 0 && (
          <div className="alert error small">
            <Icone nome="alerta" tamanho={14} /> Quantidade maior que o estoque:{" "}
            {faltas.map((f) => `#${f.p.codigo} ${f.p.nome} (pedido ${f.q}, em estoque ${f.p.quantidade})`).join("; ")}
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
                const it = paraItem(l);
                const sub = it.quantidade * it.valor_unitario;
                const p = l.produto_id ? porProduto.get(l.produto_id) : undefined;
                const falta = verificarSaldo && p && (pedido.get(p.id) ?? 0) > p.quantidade;
                const margem = it.custo_unitario !== null && sub > 0 ? ((sub - it.custo_unitario * it.quantidade) / sub) * 100 : null;
                return (
                  <tr key={l.key} className={falta ? "orc-falta" : ""}>
                    <td className="num muted">{i + 1}</td>
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
                    <td className="num">
                      <input className="orc-num" type="number" min={l.produto_id ? 1 : 0.01} step={l.produto_id ? 1 : 0.01} value={l.quantidade} disabled={!editavel} onChange={(e) => mudarLinha(l.key, "quantidade", e.target.value)} />
                    </td>
                    <td className="num">
                      <input className="orc-num orc-valor" type="number" min="0" step="0.01" value={l.valor_unitario} disabled={!editavel} onChange={(e) => mudarLinha(l.key, "valor_unitario", e.target.value)} />
                    </td>
                    <td className="num"><strong>{brl(sub)}</strong></td>
                    {mostrarCusto && (
                      <td className="num">
                        {l.produto_id ? (
                          <span title="Custo do produto quando entrou no orçamento">{it.custo_unitario === null ? <span className="muted">sem custo</span> : brl(it.custo_unitario)}</span>
                        ) : (
                          <input className="orc-num orc-valor" type="number" min="0" step="0.01" value={l.custo_unitario} disabled={!editavel} placeholder="—" onChange={(e) => mudarLinha(l.key, "custo_unitario", e.target.value)} />
                        )}
                      </td>
                    )}
                    {mostrarCusto && (
                      <td className={`num small ${margem !== null && margem < 0 ? "diff-neg" : ""}`}>{margem === null ? "—" : `${margem.toFixed(1)}%`}</td>
                    )}
                    {editavel && (
                      <td className="orc-linha-acoes">
                        <button type="button" className="btn small" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir"><Icone nome="cima" tamanho={14} /></button>
                        <button type="button" className="btn small" onClick={() => mover(i, 1)} disabled={i === linhas.length - 1} aria-label="Descer"><Icone nome="baixo" tamanho={14} /></button>
                        <button type="button" className="btn small danger" onClick={() => remover(l.key)} aria-label="Remover"><Icone nome="lixo" tamanho={14} /></button>
                      </td>
                    )}
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
              <span className="muted">Desconto (R$)</span>
              <input className="orc-num orc-valor" type="number" min="0" step="0.01" value={cab.desconto} disabled={!editavel} onChange={(e) => setCab({ ...cab, desconto: e.target.value })} />
            </label>
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
                <button className="btn" disabled={alterado || pendente} onClick={() => rodar(() => mudarStatusOrcamento(id, "reabrir"), "Orçamento voltou para rascunho.")}>
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
