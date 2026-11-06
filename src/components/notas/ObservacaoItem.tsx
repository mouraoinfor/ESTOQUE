"use client";

import { useState, useTransition } from "react";
import Icone from "@/components/Icone";
import { salvarObservacaoItemAcao } from "@/app/acoes-notas";

// Observação de um item da nota (ex.: para qual projeto/cliente vai), editável na página da nota
export default function ObservacaoItem({ itemId, observacao }: { itemId: string; observacao: string | null }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(observacao ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, startTransition] = useTransition();

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await salvarObservacaoItemAcao(itemId, texto);
      if ("erro" in r) setErro(r.erro);
      else setEditando(false);
    });
  }

  if (!editando) {
    return observacao ? (
      <div className="nfe-obs-view small">
        <span className="badge pronto">Obs.</span>
        <span className="texto">{observacao}</span>
        <button type="button" className="btn small" onClick={() => setEditando(true)} title="Editar observação" aria-label="Editar observação">
          <Icone nome="editar" tamanho={12} />
        </button>
      </div>
    ) : (
      <div className="nfe-obs-view small">
        <button type="button" className="btn small" onClick={() => setEditando(true)}>
          <Icone nome="novo" tamanho={12} /> Observação
        </button>
      </div>
    );
  }

  return (
    <div className="nfe-obs-edit small">
      <input
        autoFocus
        value={texto}
        maxLength={1000}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); salvar(); }
          if (e.key === "Escape") { setTexto(observacao ?? ""); setEditando(false); }
        }}
        placeholder="Para qual projeto ou cliente vai este item"
        aria-label="Observação do item"
      />
      <button type="button" className="btn small primary" disabled={salvando} onClick={salvar}>{salvando ? "Salvando..." : "Salvar"}</button>
      <button type="button" className="btn small" disabled={salvando} onClick={() => { setTexto(observacao ?? ""); setEditando(false); }}>Cancelar</button>
      {erro && <span style={{ color: "var(--danger)" }}>{erro}</span>}
    </div>
  );
}
