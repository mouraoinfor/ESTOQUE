"use client";

import { useState } from "react";
import Icone from "./Icone";

export default function CopyBlock({ label, value, limite }: { label: string; value: string | null | undefined; limite?: number }) {
  const [copiado, setCopiado] = useState(false);
  const texto = value ?? "";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // navegador sem permissão de clipboard
    }
  }

  return (
    <div className="copy-block">
      <div className="copy-head">
        <span>
          {label}
          {limite ? <span className={`counter ${texto.length > limite ? "over" : ""}`}> · {texto.length}/{limite}</span> : null}
        </span>
        <button type="button" className="btn small" onClick={copiar} disabled={!texto}>
          {copiado ? <><Icone nome="ok" tamanho={14} /> Copiado</> : "Copiar"}
        </button>
      </div>
      {texto || <span className="muted">(vazio)</span>}
    </div>
  );
}
