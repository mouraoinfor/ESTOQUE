"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import Icone from "@/components/Icone";
import { adicionarParcelaAcao, editarParcelaAcao, excluirParcelaAcao } from "@/app/acoes-notas";
import { brl, dataBR, hojeISO } from "@/lib/formato";

export interface ParcelaNota {
  id: string;
  descricao: string;
  documento: string | null;
  vencimento: string;
  valor: number;
  status: "aberto" | "pago";
  pago_em: string | null;
  banco: string | null;
}

interface Edicao {
  documento: string;
  vencimento: string;
  valor: string;
}

// Parcelas (contas a pagar) da nota: edição de vencimento/valor e exclusão das que estão em aberto
export default function ParcelasNota({
  notaId,
  parcelas,
  podePagar,
  totalNota,
}: {
  notaId: string;
  parcelas: ParcelaNota[];
  podePagar: boolean;
  totalNota: number;
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const [ed, setEd] = useState<Edicao>({ documento: "", vencimento: "", valor: "" });
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [nova, setNova] = useState<Edicao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, start] = useTransition();

  const soma = parcelas.reduce((s, p) => s + p.valor, 0);
  const dif = Math.round((soma - totalNota) * 100) / 100;

  function rodar(f: () => Promise<{ erro?: string } | { ok: unknown }>, depois: () => void) {
    setErro(null);
    start(async () => {
      const r = await f();
      if ("erro" in r && r.erro) setErro(r.erro);
      else depois();
    });
  }

  const valorNum = (s: string) => Number(s.replace(",", "."));

  return (
    <div className="card" style={{ marginTop: "1rem" }}>
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Parcelas no contas a pagar</h3>
        {podePagar && <Link className="small" href="/financeiro/pagar">Abrir contas a pagar →</Link>}
      </div>
      {!parcelas.length && <p className="small muted">Esta nota não tem lançamentos no contas a pagar.</p>}
      {erro && <div className="alert error" style={{ marginTop: ".6rem" }}>{erro}</div>}
      {parcelas.length > 0 && (
        <div className="table-wrap" style={{ boxShadow: "none", marginTop: ".6rem" }}>
          <table>
            <thead>
              <tr><th>Descrição</th><th>Duplicata</th><th>Vencimento</th><th className="num">Valor</th><th>Situação</th>{podePagar && <th></th>}</tr>
            </thead>
            <tbody>
              {parcelas.map((p) =>
                editando === p.id ? (
                  <tr key={p.id}>
                    <td className="small">{p.descricao}</td>
                    <td><input value={ed.documento} onChange={(e) => setEd({ ...ed, documento: e.target.value })} aria-label="Duplicata" /></td>
                    <td><input type="date" value={ed.vencimento} onChange={(e) => setEd({ ...ed, vencimento: e.target.value })} aria-label="Vencimento" /></td>
                    <td className="num"><input type="number" step="0.01" min="0" value={ed.valor} onChange={(e) => setEd({ ...ed, valor: e.target.value })} aria-label="Valor" style={{ textAlign: "right" }} /></td>
                    <td><span className="badge a_revisar">aberto</span></td>
                    <td>
                      <div className="actions">
                        <button type="button" className="btn small primary" disabled={pendente}
                          onClick={() => rodar(() => editarParcelaAcao(p.id, ed.vencimento, valorNum(ed.valor), ed.documento), () => setEditando(null))}>
                          Salvar
                        </button>
                        <button type="button" className="btn small" onClick={() => setEditando(null)} disabled={pendente}>Cancelar</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id}>
                    <td className="small">{p.descricao}</td>
                    <td className="small">{p.documento ?? "—"}</td>
                    <td>{dataBR(p.vencimento)}</td>
                    <td className="num">{brl(p.valor)}</td>
                    <td>
                      {p.status === "pago" ? (
                        <span className="badge anunciado">pago em {dataBR(p.pago_em)}</span>
                      ) : (
                        <span className={`badge ${p.vencimento < hojeISO() ? "baixa" : "a_revisar"}`}>{p.vencimento < hojeISO() ? "vencido" : "aberto"}</span>
                      )}
                      {p.banco && <div className="small muted">{p.banco}</div>}
                    </td>
                    {podePagar && (
                      <td>
                        {p.status === "aberto" ? (
                          excluindo === p.id ? (
                            <div className="actions">
                              <span className="small">Excluir parcela?</span>
                              <button type="button" className="btn small danger" disabled={pendente}
                                onClick={() => rodar(() => excluirParcelaAcao(p.id), () => setExcluindo(null))}>Sim</button>
                              <button type="button" className="btn small" onClick={() => setExcluindo(null)}>Não</button>
                            </div>
                          ) : (
                            <div className="actions">
                              <button type="button" className="btn small" title="Editar"
                                onClick={() => { setEditando(p.id); setEd({ documento: p.documento ?? "", vencimento: p.vencimento, valor: p.valor.toFixed(2) }); }}>
                                <Icone nome="editar" tamanho={14} />
                              </button>
                              <button type="button" className="btn small danger" title="Excluir parcela" onClick={() => setExcluindo(p.id)}>
                                <Icone nome="lixo" tamanho={14} />
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="small muted" title="Estorne a baixa no contas a pagar para alterar">paga</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
      {parcelas.length > 0 && (
        <p className="small" style={{ marginBottom: 0 }}>
          Soma: <strong>{brl(soma)}</strong> de {brl(totalNota)}
          {Math.abs(dif) >= 0.01 && <span style={{ color: "var(--warn)" }}> · diferença de {brl(Math.abs(dif))} em relação ao total da nota</span>}
        </p>
      )}

      {podePagar && (
        nova ? (
          <div className="actions nfe-nova-parcela">
            <input placeholder="Duplicata" value={nova.documento} onChange={(e) => setNova({ ...nova, documento: e.target.value })} aria-label="Duplicata" />
            <input type="date" value={nova.vencimento} onChange={(e) => setNova({ ...nova, vencimento: e.target.value })} aria-label="Vencimento" />
            <input type="number" step="0.01" min="0" placeholder="Valor" value={nova.valor} onChange={(e) => setNova({ ...nova, valor: e.target.value })} aria-label="Valor" />
            <button type="button" className="btn small primary" disabled={pendente}
              onClick={() => rodar(() => adicionarParcelaAcao(notaId, nova.vencimento, valorNum(nova.valor), nova.documento), () => setNova(null))}>
              Adicionar
            </button>
            <button type="button" className="btn small" onClick={() => setNova(null)}>Cancelar</button>
          </div>
        ) : (
          <button type="button" className="btn small" style={{ marginTop: ".6rem" }}
            onClick={() => setNova({ documento: "", vencimento: hojeISO(), valor: dif < 0 ? Math.abs(dif).toFixed(2) : "" })}>
            <Icone nome="novo" tamanho={14} /> Adicionar parcela
          </button>
        )
      )}
    </div>
  );
}
