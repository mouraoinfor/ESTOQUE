"use client";

import { useState } from "react";

// Documentos e observações internas do orçamento em abas
export default function AbasDocumentos({
  documentos,
  observacoes,
  nDocumentos,
  nObservacoes,
}: {
  documentos: React.ReactNode;
  observacoes: React.ReactNode;
  nDocumentos: number;
  nObservacoes: number;
}) {
  const [aba, setAba] = useState<"doc" | "obs">("doc");
  return (
    <>
      <div className="tabs orc-doc-tabs">
        <button type="button" className={aba === "doc" ? "active" : ""} onClick={() => setAba("doc")}>Documentos ({nDocumentos})</button>
        <button type="button" className={aba === "obs" ? "active" : ""} onClick={() => setAba("obs")}>Observações internas ({nObservacoes})</button>
      </div>
      {aba === "doc" ? documentos : observacoes}
    </>
  );
}
