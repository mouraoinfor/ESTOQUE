"use client";

import { useState } from "react";
import { excluirProduto } from "@/app/actions";

export default function ExcluirBotao({ id }: { id: string }) {
  const [confirmar, setConfirmar] = useState(false);
  if (!confirmar) {
    return <button type="button" className="btn small danger" onClick={() => setConfirmar(true)}>Excluir item</button>;
  }
  return (
    <div className="actions">
      <span className="small">Excluir de vez?</span>
      <button type="button" className="btn small danger" onClick={() => excluirProduto(id)}>Sim, excluir</button>
      <button type="button" className="btn small" onClick={() => setConfirmar(false)}>Cancelar</button>
    </div>
  );
}
