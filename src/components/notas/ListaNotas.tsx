"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Icone from "@/components/Icone";
import { brl, dataBR, formatarDocumento } from "@/lib/formato";
import { normalizar } from "./BuscaProduto";

export interface NotaLista {
  id: string;
  numero: string | null;
  serie: string | null;
  chave: string | null;
  emissao: string | null;
  valor_total: number;
  empresa_id: string | null;
  empresa: string | null;
  fornecedor: string | null;
  fornecedor_doc: string | null;
  itens: number;
  parcelas: number;
  pagas: number;
}

export default function ListaNotas({ notas }: { notas: NotaLista[] }) {
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [empresa, setEmpresa] = useState("");

  const empresas = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of notas) if (n.empresa_id) m.set(n.empresa_id, n.empresa ?? "");
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [notas]);

  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim());
    const qd = busca.replace(/\D/g, "");
    return notas.filter((n) => {
      if (de && (!n.emissao || n.emissao < de)) return false;
      if (ate && (!n.emissao || n.emissao > ate)) return false;
      if (empresa && n.empresa_id !== empresa) return false;
      if (q) {
        const alvo = normalizar([n.numero, n.fornecedor, n.empresa].filter(Boolean).join(" "));
        const porDigitos = qd.length >= 4 && ((n.chave ?? "").includes(qd) || (n.fornecedor_doc ?? "").includes(qd));
        if (!alvo.includes(q) && !porDigitos) return false;
      }
      return true;
    });
  }, [notas, busca, de, ate, empresa]);

  const total = filtradas.reduce((s, n) => s + n.valor_total, 0);

  return (
    <>
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1.1rem" }}>
        <h1 style={{ margin: 0 }}>Notas fiscais de compra</h1>
        <Link className="btn primary" href="/notas/importar"><Icone nome="upload" tamanho={16} /> Importar XML</Link>
      </div>

      <div className="stats">
        <div className="stat"><div className="label">Notas</div><div className="value">{filtradas.length}</div></div>
        <div className="stat"><div className="label">Valor total</div><div className="value" style={{ fontSize: "1.1rem" }}>{brl(total)}</div></div>
      </div>

      <div className="filters">
        <input type="search" placeholder="Buscar por número, fornecedor, CNPJ ou chave..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <label className="nfe-periodo small">De <input type="date" value={de} onChange={(e) => setDe(e.target.value)} /></label>
        <label className="nfe-periodo small">até <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} /></label>
        {empresas.length > 1 && (
          <select value={empresa} onChange={(e) => setEmpresa(e.target.value)}>
            <option value="">Todas as empresas</option>
            {empresas.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
          </select>
        )}
        {(busca || de || ate || empresa) && (
          <button type="button" className="btn" onClick={() => { setBusca(""); setDe(""); setAte(""); setEmpresa(""); }}>Limpar</button>
        )}
      </div>

      {!notas.length ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            Nenhuma nota importada ainda. Use <Link href="/notas/importar">Importar XML</Link> para dar entrada numa NF-e de compra.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Emissão</th>
                <th>Fornecedor</th>
                <th className="hide-sm">Empresa</th>
                <th className="num">Valor</th>
                <th className="num hide-sm">Itens</th>
                <th>Financeiro</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((n) => (
                <tr key={n.id}>
                  <td>
                    <Link href={`/notas/${n.id}`}><strong>{n.numero ?? "—"}</strong></Link>
                    {n.serie && <span className="small muted"> / {n.serie}</span>}
                  </td>
                  <td>{dataBR(n.emissao)}</td>
                  <td>
                    {n.fornecedor ?? "—"}
                    {n.fornecedor_doc && <div className="small muted">{formatarDocumento(n.fornecedor_doc)}</div>}
                  </td>
                  <td className="hide-sm small">{n.empresa ?? "—"}</td>
                  <td className="num">{brl(n.valor_total)}</td>
                  <td className="num hide-sm">{n.itens}</td>
                  <td>
                    {n.parcelas === 0 ? (
                      <span className="muted small">sem lançamentos</span>
                    ) : n.pagas === n.parcelas ? (
                      <span className="badge anunciado">pago ({n.pagas}/{n.parcelas})</span>
                    ) : (
                      <span className={`badge ${n.pagas ? "media" : "a_revisar"}`}>{n.pagas}/{n.parcelas} pagas</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filtradas.length && (
                <tr><td colSpan={7} className="muted">Nenhuma nota com esses filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
