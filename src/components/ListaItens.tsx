"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Icone from "./Icone";
import {
  brl,
  CANAL_LABEL,
  CATEGORIAS,
  CONDICAO_LABEL,
  STATUS_LABEL,
  type Produto,
  type Status,
} from "@/lib/types";

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function ListaItens({ produtos }: { produtos: Produto[] }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [condicao, setCondicao] = useState("");
  const [status, setStatus] = useState("");
  const [venda, setVenda] = useState("");

  const filtrados = useMemo(() => {
    const q = normalizar(busca.trim());
    return produtos.filter((p) => {
      if (categoria && p.categoria !== categoria) return false;
      if (condicao && p.condicao !== condicao) return false;
      if (status && p.status !== status) return false;
      if (venda === "sim" && !p.para_venda) return false;
      if (venda === "nao" && p.para_venda) return false;
      if (venda === "pendente" && !p.pendencias) return false;
      if (q) {
        const alvo = normalizar(
          [p.codigo, p.nome, p.nome_original, p.marca, p.modelo, p.localizacao].filter(Boolean).join(" ")
        );
        if (!alvo.includes(q)) return false;
      }
      return true;
    });
  }, [produtos, busca, categoria, condicao, status, venda]);

  const totais = useMemo(() => {
    const unidades = produtos.reduce((s, p) => s + p.quantidade, 0);
    const venda = produtos.filter((p) => p.para_venda && p.status !== "vendido");
    const valorDe = (lista: Produto[]) => lista.reduce((s, p) => s + (p.preco_venda ?? p.preco_sugerido ?? 0) * p.quantidade, 0);
    const valor = valorDe(venda);
    return {
      valorTotal: valorDe(produtos.filter((p) => p.status !== "vendido")),
      itens: produtos.length,
      unidades,
      paraVenda: venda.length,
      pendentes: produtos.filter((p) => p.pendencias).length,
      anunciados: produtos.filter((p) => p.status === "anunciado").length,
      valor,
    };
  }, [produtos]);

  return (
    <>
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1.1rem" }}>
        <h1 style={{ margin: 0 }}>Itens do estoque</h1>
        <Link className="btn primary" href="/itens/novo"><Icone nome="novo" tamanho={16} /> Novo item</Link>
      </div>
      <div className="stats">
        <div className="stat"><div className="label">Itens cadastrados</div><div className="value">{totais.itens}</div></div>
        <div className="stat"><div className="label">Unidades em estoque</div><div className="value">{totais.unidades}</div></div>
        <div className="stat"><div className="label">Itens para venda</div><div className="value">{totais.paraVenda}</div></div>
        <div className="stat"><div className="label">Anunciados</div><div className="value">{totais.anunciados}</div></div>
        <div className="stat"><div className="label">Com pendências</div><div className="value">{totais.pendentes}</div></div>
        <div className="stat"><div className="label">Valor estimado p/ venda</div><div className="value" style={{ fontSize: "1.1rem" }}>{brl(totais.valor)}</div></div>
        <div className="stat"><div className="label">Valor total do estoque</div><div className="value" style={{ fontSize: "1.1rem" }}>{brl(totais.valorTotal)}</div></div>
      </div>

      <div className="filters">
        <input type="search" placeholder="Buscar por nome, modelo, código, local..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas categorias</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={condicao} onChange={(e) => setCondicao(e.target.value)}>
          <option value="">Novo e usado</option>
          {Object.entries(CONDICAO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={venda} onChange={(e) => setVenda(e.target.value)}>
          <option value="">Venda: todos</option>
          <option value="sim">Para venda</option>
          <option value="nao">Não vender</option>
          <option value="pendente">Com pendências</option>
        </select>
        <a className="btn" href="/api/exportar">Exportar CSV</a>
      </div>

      <p className="muted small">{filtrados.length} de {produtos.length} itens</p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Produto</th>
              <th className="hide-sm">Categoria</th>
              <th>Cond.</th>
              <th className="num">Qtd</th>
              <th>Status</th>
              <th className="hide-sm">Canal</th>
              <th className="num">Preço</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id}>
                <td className="num muted">{p.codigo}</td>
                <td>
                  <Link href={`/itens/${p.id}`}><strong>{p.nome}</strong></Link>
                  <div className="small muted">
                    {[p.marca, p.modelo].filter(Boolean).join(" · ")}
                    {p.localizacao && <> · <Icone nome="local" tamanho={13} /> {p.localizacao}</>}
                  </div>
                  {p.pendencias && <div className="small" style={{ color: "var(--warn)" }}><Icone nome="alerta" tamanho={13} /> {p.pendencias.slice(0, 110)}{p.pendencias.length > 110 ? "…" : ""}</div>}
                </td>
                <td className="hide-sm small">{p.categoria}</td>
                <td><span className={`badge ${p.condicao}`}>{CONDICAO_LABEL[p.condicao]}</span></td>
                <td className="num"><strong>{p.quantidade}</strong></td>
                <td><span className={`badge ${p.status}`}>{STATUS_LABEL[p.status as Status]}</span></td>
                <td className="hide-sm">
                  {p.canal === "mercado_livre" && <span className="badge ml">ML</span>}
                  {p.canal === "olx" && <span className="badge olx">OLX</span>}
                  {p.canal === "ambos" && <><span className="badge ml">ML</span> <span className="badge olx">OLX</span></>}
                  {p.canal === "nenhum" && <span className="muted">{CANAL_LABEL.nenhum}</span>}
                </td>
                <td className="num">{p.para_venda ? brl(p.preco_venda ?? p.preco_sugerido) : <span className="muted" title="Valor de mercado (item não está à venda)">{brl(p.preco_venda ?? p.preco_sugerido)}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
