"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icone from "@/components/Icone";
import { adicionarObservacao, excluirObservacao } from "@/app/acoes-observacoes";

export interface Nota {
  id: string;
  texto: string;
  usuario: string | null;
  created_at: string;
}

const FUSO = "America/Sao_Paulo";

// Observações internas: só a equipe vê, não saem na proposta
export default function NotasOrcamento({ orcamentoId, notas, podeEditar }: { orcamentoId: string; notas: Nota[]; podeEditar: boolean }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, iniciar] = useTransition();

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    iniciar(async () => {
      const r = await adicionarObservacao(orcamentoId, texto);
      if ("erro" in r) return setErro(r.erro);
      setTexto("");
      router.refresh();
    });
  }

  function excluir(n: Nota) {
    if (!window.confirm("Excluir esta observação?")) return;
    iniciar(async () => {
      const r = await excluirObservacao(n.id);
      if ("erro" in r) setErro(r.erro);
      router.refresh();
    });
  }

  return (
    <div className="card">
      <h3><Icone nome="editar" tamanho={16} /> Observações internas</h3>
      <p className="small muted">Só a equipe vê. Não aparecem na proposta do cliente.</p>
      {erro && <div className="alert error">{erro}</div>}
      {podeEditar && (
        <form onSubmit={adicionar} className="orc-nota-form">
          <textarea
            rows={3}
            value={texto}
            maxLength={5000}
            placeholder="Ex.: cliente pediu para instalar só depois do dia 10; negociar desconto no cabo"
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) adicionar(e); }}
          />
          <button className="btn primary small" disabled={pendente || !texto.trim()}><Icone nome="novo" tamanho={14} /> Adicionar observação</button>
        </form>
      )}
      {!notas.length ? (
        <p className="muted small">Nenhuma observação.</p>
      ) : (
        <ul className="orc-notas">
          {notas.map((n) => (
            <li key={n.id}>
              <div className="orc-nota-texto">{n.texto}</div>
              <div className="small muted orc-nota-rodape">
                <span>{n.usuario ?? "—"} · {new Date(n.created_at).toLocaleString("pt-BR", { timeZone: FUSO, dateStyle: "short", timeStyle: "short" })}</span>
                {podeEditar && (
                  <button type="button" className="btn small danger" disabled={pendente} onClick={() => excluir(n)} aria-label="Excluir"><Icone nome="lixo" tamanho={14} /></button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
