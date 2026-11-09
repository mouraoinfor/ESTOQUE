"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icone from "@/components/Icone";
import { formatarDocumento } from "@/lib/formato";
import { excluirTermo, itensDoOrcamentoParaTermo, salvarTermo } from "@/app/acoes-termos";
import BuscaProduto from "@/components/orcamentos/BuscaProduto";
import { normalizar, type ClienteBusca, type ProdutoBusca } from "@/components/orcamentos/tipos";
import type { DadosTermo, ItemTermo, OrcamentoOpcao, Termo } from "./tipos";

type Linha = ItemTermo & { chave: string };
let seq = 0;
const chave = () => `l${++seq}`;

// Termo de entrega: cabeçalho (quem entrega / quem recebe) e materiais, do estoque ou avulsos
export default function TermoEditor({
  termo,
  itens,
  empresas,
  empresaPadrao,
  clientes,
  produtos,
  orcamentos,
  hoje,
}: {
  termo: Termo | null;
  itens: ItemTermo[];
  empresas: { id: string; nome: string }[];
  empresaPadrao: string | null;
  clientes: ClienteBusca[];
  produtos: ProdutoBusca[];
  orcamentos: OrcamentoOpcao[];
  hoje: string;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [d, setD] = useState<Omit<DadosTermo, "itens">>(() => ({
    empresa_id: termo?.empresa_id ?? empresaPadrao,
    cliente_id: termo?.cliente_id ?? null,
    recebedor_nome: termo?.recebedor_nome ?? "",
    recebedor_documento: termo?.recebedor_documento ? formatarDocumento(termo.recebedor_documento) : "",
    recebedor_endereco: termo?.recebedor_endereco ?? "",
    recebido_por: termo?.recebido_por ?? "",
    data: termo?.data ?? hoje,
    orcamento_id: termo?.orcamento_id ?? null,
    observacoes: termo?.observacoes ?? "",
  }));
  const [linhas, setLinhas] = useState<Linha[]>(() => itens.map((i) => ({ ...i, quantidade: String(i.quantidade), chave: chave() })));
  const [alterado, setAlterado] = useState(false);

  const porNome = useMemo(() => new Map(clientes.map((c) => [normalizar(c.nome.trim()), c])), [clientes]);

  function mudar(campo: keyof typeof d, valor: string | null) {
    setD((x) => ({ ...x, [campo]: valor }));
    setAlterado(true);
    setOk("");
  }

  // Nome igual a um cliente do cadastro: liga ao cadastro e preenche o CNPJ/CPF
  function mudarRecebedor(nome: string) {
    const c = porNome.get(normalizar(nome.trim()));
    setD((x) => ({
      ...x,
      recebedor_nome: nome,
      cliente_id: c?.id ?? null,
      recebedor_documento: c ? (c.documento ? formatarDocumento(c.documento) : x.recebedor_documento) : x.recebedor_documento,
    }));
    setAlterado(true);
    setOk("");
  }

  function mudarLinha(k: string, campo: "descricao" | "quantidade", valor: string) {
    setLinhas((ls) => ls.map((l) => (l.chave === k ? { ...l, [campo]: valor } : l)));
    setAlterado(true);
    setOk("");
  }

  function addProduto(p: ProdutoBusca) {
    setLinhas((ls) => {
      const ja = ls.find((l) => l.produto_id === p.id);
      if (ja) return ls.map((l) => (l === ja ? { ...l, quantidade: String((Number(String(l.quantidade).replace(",", ".")) || 0) + 1) } : l));
      return [...ls, { chave: chave(), produto_id: p.id, produto_codigo: p.codigo, descricao: p.nome, quantidade: "1" }];
    });
    setAlterado(true);
  }

  function addAvulso() {
    setLinhas((ls) => [...ls, { chave: chave(), produto_id: null, produto_codigo: null, descricao: "", quantidade: "1" }]);
    setAlterado(true);
  }

  function mover(k: string, delta: number) {
    setLinhas((ls) => {
      const i = ls.findIndex((l) => l.chave === k);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= ls.length) return ls;
      const n = [...ls];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
    setAlterado(true);
  }

  function puxarOrcamento() {
    if (!d.orcamento_id) return;
    setErro("");
    iniciar(async () => {
      const r = await itensDoOrcamentoParaTermo(d.orcamento_id!);
      if ("erro" in r) return setErro(r.erro);
      if (!r.ok.itens.length) return setErro("Esse orçamento não tem itens de material.");
      setLinhas((ls) => [...ls, ...r.ok.itens.map((i) => ({ ...i, quantidade: String(i.quantidade), chave: chave() }))]);
      const c = r.ok.cliente;
      if (!d.recebedor_nome.trim() && c.nome) {
        setD((x) => ({ ...x, recebedor_nome: c.nome!, cliente_id: c.id, recebedor_documento: c.documento ? formatarDocumento(c.documento) : x.recebedor_documento }));
      }
      setAlterado(true);
    });
  }

  function salvar(imprimir = false) {
    setErro("");
    setOk("");
    iniciar(async () => {
      const r = await salvarTermo(termo?.id ?? null, { ...d, itens: linhas.map(({ chave: _, ...i }) => i) });
      if ("erro" in r) return setErro(r.erro);
      setAlterado(false);
      // Abre a impressão na mesma aba (janela nova depois do salvar seria bloqueada pelo navegador)
      if (imprimir) router.push(`/termo-impressao/${r.ok}`);
      else if (!termo) router.replace(`/termos/${r.ok}`);
      else {
        setOk("Termo salvo.");
        router.refresh();
      }
    });
  }

  function excluir() {
    if (!termo || !window.confirm(`Excluir o termo de entrega nº ${termo.numero}?`)) return;
    iniciar(async () => {
      const r = await excluirTermo(termo.id);
      if ("erro" in r) return setErro(r.erro);
      router.replace("/termos");
    });
  }

  const totalUnidades = linhas.reduce((s, l) => s + (Number(String(l.quantidade).replace(",", ".")) || 0), 0);

  return (
    <div className="termo-editor">
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>{termo ? `Termo de entrega nº ${termo.numero}` : "Novo termo de entrega"}</h1>
        <div className="actions">
          <Link className="btn" href="/termos"><Icone nome="entrega" tamanho={16} /> Todos os termos</Link>
          {termo && (
            alterado
              ? <button type="button" className="btn" disabled={pendente} onClick={() => salvar(true)}><Icone nome="imprimir" tamanho={16} /> Salvar e imprimir</button>
              : <Link className="btn" href={`/termo-impressao/${termo.id}`} target="_blank"><Icone nome="imprimir" tamanho={16} /> Imprimir</Link>
          )}
        </div>
      </div>

      {erro && <div className="alert error">{erro}</div>}
      {ok && <div className="alert ok">{ok}</div>}

      <section className="card">
        <h3>Dados do termo</h3>
        <div className="grid4">
          <label className="field">
            <span>Empresa que entrega</span>
            <select value={d.empresa_id ?? ""} onChange={(e) => mudar("empresa_id", e.target.value || null)}>
              <option value="">—</option>
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Data</span>
            <input type="date" value={d.data} onChange={(e) => mudar("data", e.target.value)} required />
          </label>
          <label className="field termo-span2">
            <span>Projeto / orçamento (opcional)</span>
            <div className="termo-linha">
              <select value={d.orcamento_id ?? ""} onChange={(e) => mudar("orcamento_id", e.target.value || null)}>
                <option value="">—</option>
                {orcamentos.map((o) => <option key={o.id} value={o.id}>#{o.numero} · {o.titulo}{o.cliente_nome ? ` (${o.cliente_nome})` : ""}</option>)}
              </select>
              <button type="button" className="btn" disabled={!d.orcamento_id || pendente} onClick={puxarOrcamento} title="Adiciona os itens de material do orçamento">
                Puxar itens
              </button>
            </div>
          </label>
        </div>
        <div className="grid2">
          <label className="field">
            <span>Recebedor (empresa ou pessoa)</span>
            <input type="text" list="termo-clientes" value={d.recebedor_nome} maxLength={200} placeholder="Busque no cadastro de clientes ou digite" onChange={(e) => mudarRecebedor(e.target.value)} required />
            <datalist id="termo-clientes">{clientes.map((c) => <option key={c.id} value={c.nome}>{c.documento ? formatarDocumento(c.documento) : ""}</option>)}</datalist>
            {d.cliente_id && <small className="muted">Cliente do cadastro</small>}
          </label>
          <label className="field">
            <span>CNPJ / CPF do recebedor</span>
            <input type="text" value={d.recebedor_documento} maxLength={20} onChange={(e) => mudar("recebedor_documento", e.target.value)} />
          </label>
        </div>
        <div className="grid2">
          <label className="field">
            <span>Endereço de entrega (opcional)</span>
            <input type="text" value={d.recebedor_endereco} maxLength={300} onChange={(e) => mudar("recebedor_endereco", e.target.value)} />
          </label>
          <label className="field">
            <span>Recebido por (opcional — vazio sai a linha para preencher à mão)</span>
            <input type="text" value={d.recebido_por} maxLength={200} onChange={(e) => mudar("recebido_por", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="card">
        <h3>Materiais entregues</h3>
        <div className="orc-adicionar">
          <BuscaProduto produtos={produtos} onEscolher={addProduto} placeholder="Adicionar item do estoque: nome, modelo ou código (#12)..." />
          <button type="button" className="btn" onClick={addAvulso}><Icone nome="novo" tamanho={16} /> Item avulso</button>
        </div>
        <div className="table-wrap">
          <table className="termo-itens">
            <thead>
              <tr>
                <th className="num">Qtd</th>
                <th>Descrição do material</th>
                <th className="hide-sm">Origem</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, k) => (
                <tr key={l.chave}>
                  <td className="num">
                    <input type="number" min="0" step="any" className="termo-qtd" value={l.quantidade} onChange={(e) => mudarLinha(l.chave, "quantidade", e.target.value)} aria-label="Quantidade" />
                  </td>
                  <td>
                    <input type="text" className="termo-desc" value={l.descricao} maxLength={300} placeholder="Descrição do item" autoFocus={!l.produto_id && !l.descricao}
                      onChange={(e) => mudarLinha(l.chave, "descricao", e.target.value)} aria-label="Descrição" />
                  </td>
                  <td className="hide-sm small">
                    {l.produto_id ? <span className="badge pronto">estoque #{l.produto_codigo}</span> : <span className="badge a_revisar">avulso</span>}
                  </td>
                  <td className="num">
                    <div className="lanc-acoes termo-acoes">
                      <button type="button" className="btn small" disabled={k === 0} onClick={() => mover(l.chave, -1)} aria-label="Subir"><Icone nome="cima" tamanho={14} /></button>
                      <button type="button" className="btn small" disabled={k === linhas.length - 1} onClick={() => mover(l.chave, 1)} aria-label="Descer"><Icone nome="baixo" tamanho={14} /></button>
                      <button type="button" className="btn small danger" onClick={() => { setLinhas((ls) => ls.filter((x) => x.chave !== l.chave)); setAlterado(true); }} aria-label="Remover"><Icone nome="lixo" tamanho={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!linhas.length && (
                <tr><td colSpan={4} className="muted" style={{ textAlign: "center", padding: "1.2rem" }}>Busque um item do estoque, adicione um item avulso ou puxe os itens de um orçamento.</td></tr>
              )}
            </tbody>
            {linhas.length > 0 && (
              <tfoot>
                <tr><td className="num"><strong>{totalUnidades.toLocaleString("pt-BR")}</strong></td><td colSpan={3}>{linhas.length} item(ns)</td></tr>
              </tfoot>
            )}
          </table>
        </div>
        <p className="small muted">O termo é só o documento de entrega: não tira nada do estoque.</p>
      </section>

      <section className="card">
        <label className="field">
          <span>Observações (saem no termo)</span>
          <textarea rows={2} value={d.observacoes} maxLength={3000} onChange={(e) => mudar("observacoes", e.target.value)} />
        </label>
      </section>

      <div className="actions" style={{ justifyContent: "space-between" }}>
        <div>{termo && <button type="button" className="btn danger" disabled={pendente} onClick={excluir}><Icone nome="lixo" tamanho={16} /> Excluir termo</button>}</div>
        <div className="actions">
          {!termo && <button type="button" className="btn" disabled={pendente} onClick={() => salvar(true)}><Icone nome="imprimir" tamanho={16} /> Salvar e imprimir</button>}
          <button type="button" className="btn primary" disabled={pendente} onClick={() => salvar()}>{pendente ? "Salvando..." : termo ? "Salvar alterações" : "Salvar termo"}</button>
        </div>
      </div>
    </div>
  );
}
