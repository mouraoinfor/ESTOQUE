"use client";

import { useState, useTransition } from "react";
import { movimentar } from "@/app/actions";

export default function MovimentarBox({ produtoId }: { produtoId: string }) {
  const [tipo, setTipo] = useState("entrada");
  const [qtd, setQtd] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pendente, start] = useTransition();

  function enviar() {
    setMsg(null);
    start(async () => {
      const q = tipo === "ajuste" ? qtd : Math.abs(qtd);
      const res = await movimentar(produtoId, tipo, q, motivo || null);
      if ("erro" in res && res.erro) setMsg("Erro: " + res.erro);
      else {
        setMsg(`Feito. Saldo atual: ${res.saldo}`);
        setMotivo("");
      }
    });
  }

  return (
    <div className="card">
      <h3>Movimentar estoque</h3>
      <div className="actions">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ width: "auto" }}>
          <option value="entrada">Entrada (+)</option>
          <option value="saida">Saída (−)</option>
          <option value="venda">Venda (−)</option>
          <option value="ajuste">Ajuste (±)</option>
        </select>
        <input type="number" value={qtd} onChange={(e) => setQtd(Number(e.target.value))} style={{ width: 90 }} />
        <input type="text" placeholder="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
        <button className="btn primary" type="button" onClick={enviar} disabled={pendente || !qtd}>
          {pendente ? "..." : "Registrar"}
        </button>
      </div>
      {msg && <p className="small muted" style={{ marginBottom: 0 }}>{msg}</p>}
    </div>
  );
}
