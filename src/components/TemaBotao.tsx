"use client";

import { useEffect, useState } from "react";
import Icone from "./Icone";

type Tema = "claro" | "escuro";

function temaAtual(): Tema {
  const t = document.documentElement.dataset.theme;
  if (t === "dark") return "escuro";
  if (t === "light") return "claro";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

export default function TemaBotao() {
  const [tema, setTema] = useState<Tema | null>(null);
  useEffect(() => setTema(temaAtual()), []);

  function alternar() {
    const novo: Tema = temaAtual() === "escuro" ? "claro" : "escuro";
    const valor = novo === "escuro" ? "dark" : "light";
    document.documentElement.dataset.theme = valor;
    try { localStorage.setItem("tema", valor); } catch {}
    setTema(novo);
  }

  const rotulo = tema === "escuro" ? "Modo claro" : "Modo escuro";
  return (
    <button type="button" className="tema-botao" onClick={alternar} aria-label="Alternar modo claro/escuro" title={rotulo}>
      <Icone nome={tema === "escuro" ? "sol" : "lua"} />
      <span className="rotulo">{rotulo}</span>
    </button>
  );
}
