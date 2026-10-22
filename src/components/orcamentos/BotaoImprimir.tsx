"use client";

import Icone from "@/components/Icone";

export default function BotaoImprimir() {
  return (
    <button type="button" className="btn primary" onClick={() => window.print()}>
      <Icone nome="imprimir" tamanho={16} /> Imprimir / salvar PDF
    </button>
  );
}
