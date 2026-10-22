"use client";

import { useEffect } from "react";
import Icone from "@/components/Icone";

// Janela sobreposta simples (fecha no Esc, no X ou clicando fora)
export default function LancamentoModal({
  titulo,
  onFechar,
  children,
  largo = false,
}: {
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
  largo?: boolean;
}) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onFechar]);

  return (
    <div className="lanc-overlay" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className={`lanc-modal card${largo ? " largo" : ""}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="lanc-modal-topo">
          <h2>{titulo}</h2>
          <button type="button" className="btn small" onClick={onFechar} aria-label="Fechar"><Icone nome="fechar" tamanho={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
