"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Icone from "@/components/Icone";
import { brl, dataBR } from "@/lib/formato";
import { BADGE_ORCAMENTO, normalizar, rotuloStatus, STATUS_ORCAMENTO, TIPO_ORCAMENTO, type StatusOrcamento, type TipoOrcamento } from "./tipos";

// Abas por tipo: venda de produtos, propostas de projeto (tentando fechar) e projetos já fechados
const ABAS = [
  { chave: "", rotulo: "Todos" },
  { chave: "venda", rotulo: "Venda de produtos" },
  { chave: "projeto", rotulo: "Propostas de projeto" },
  { chave: "fechado", rotulo: "Projetos fechados" },
] as const;
type Aba = (typeof ABAS)[number]["chave"];

export interface LinhaOrcamento {
  id: string;
  numero: number;
  titulo: string;
  tipo: TipoOrcamento;
  cliente_nome: string | null;
  status: StatusOrcamento;
  data: string;
  validade: string | null;
  total: number;
  itens: number;
}

export default function ListaOrcamentos({
  linhas,
  resumo,
  tipoInicial,
}: {
  linhas: LinhaOrcamento[];
  resumo: { abertos: number; aguardando: number; aprovado_mes: number };
  tipoInicial: Aba;
}) {
  const [aba, setAba] = useState<Aba>(tipoInicial);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");

  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim().replace(/^#/, ""));
    return linhas.filter((l) => {
      if (aba === "venda" && l.tipo !== "venda") return false;
      if (aba === "projeto" && (l.tipo !== "projeto" || l.status !== "rascunho")) return false;
      if (aba === "fechado" && (l.tipo !== "projeto" || (l.status !== "aprovado" && l.status !== "baixado"))) return false;
      if (status && l.status !== status) return false;
      if (q && !normalizar(`${l.numero} ${l.titulo} ${l.cliente_nome ?? ""}`).includes(q)) return false;
      return true;
    });
  }, [linhas, busca, status, aba]);

  return (
    <>
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1.1rem" }}>
        <h1 style={{ margin: 0 }}>Orçamentos</h1>
        <Link className="btn primary" href="/orcamentos/novo"><Icone nome="novo" tamanho={16} /> Novo orçamento</Link>
      </div>

      <div className="stats">
        <div className="stat"><div className="label">Em aberto (rascunho)</div><div className="value">{resumo.abertos}</div></div>
        <div className="stat"><div className="label">Aprovados aguardando baixa</div><div className="value">{resumo.aguardando}</div></div>
        <div className="stat"><div className="label">Total aprovado no mês</div><div className="value" style={{ fontSize: "1.1rem" }}>{brl(resumo.aprovado_mes)}</div></div>
      </div>

      <div className="tabs orc-tipo-tabs">
        {ABAS.map((a) => (
          <button key={a.chave} type="button" className={aba === a.chave ? "active" : ""} onClick={() => setAba(a.chave)}>{a.rotulo}</button>
        ))}
      </div>

      <div className="filters">
        <input type="search" placeholder="Buscar por número, projeto ou cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos status</option>
          {Object.entries(STATUS_ORCAMENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <p className="muted small">{filtradas.length} de {linhas.length} orçamentos</p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Projeto</th>
              <th>Cliente</th>
              <th className="hide-sm">Data</th>
              <th className="num">Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((l) => (
              <tr key={l.id}>
                <td className="num muted">{l.numero}</td>
                <td>
                  <Link href={`/orcamentos/${l.id}`}><strong>{l.titulo}</strong></Link>
                  <div className="small muted">{TIPO_ORCAMENTO[l.tipo]} · {l.itens} {l.itens === 1 ? "item" : "itens"}{l.validade && <> · válido até {dataBR(l.validade)}</>}</div>
                </td>
                <td className="small">{l.cliente_nome ?? <span className="muted">—</span>}</td>
                <td className="hide-sm small">{dataBR(l.data)}</td>
                <td className="num"><strong>{brl(l.total)}</strong></td>
                <td><span className={`badge ${BADGE_ORCAMENTO[l.status]}`}>{rotuloStatus(l.tipo, l.status)}</span></td>
              </tr>
            ))}
            {!filtradas.length && (
              <tr><td colSpan={6} className="muted" style={{ textAlign: "center", padding: "1.5rem" }}>
                {linhas.length ? "Nenhum orçamento com esse filtro." : "Nenhum orçamento ainda. Clique em \"Novo orçamento\"."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
