"use client";

import { useEffect, useState } from "react";
import Icone, { type NomeIcone } from "./Icone";

type Tema = "claro" | "escuro" | "rosa";

const VALOR: Record<Tema, string> = { claro: "light", escuro: "dark", rosa: "pink" };
const ROTULO: Record<Tema, string> = { claro: "Modo claro", escuro: "Modo escuro", rosa: "Modo rosa" };
const ICONE: Record<Tema, NomeIcone> = { claro: "sol", escuro: "lua", rosa: "coracao" };

function temaAtual(): Tema {
  const t = document.documentElement.dataset.theme;
  if (t === "dark") return "escuro";
  if (t === "light") return "claro";
  if (t === "pink") return "rosa";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

function aplicar(tema: Tema) {
  document.documentElement.dataset.theme = VALOR[tema];
  try { localStorage.setItem("tema", VALOR[tema]); } catch {}
}

// Claro -> escuro -> rosa (só quem o admin liberou) -> claro
export default function TemaBotao({ rosa = false }: { rosa?: boolean }) {
  const [tema, setTema] = useState<Tema | null>(null);
  useEffect(() => {
    let t = temaAtual();
    // Acesso ao modo rosa retirado (ou outro usuário no mesmo computador): volta para o claro
    if (t === "rosa" && !rosa) {
      t = "claro";
      aplicar(t);
    }
    setTema(t);
  }, [rosa]);

  const ordem: Tema[] = rosa ? ["claro", "escuro", "rosa"] : ["claro", "escuro"];
  const proximo = ordem[(ordem.indexOf(tema ?? "claro") + 1) % ordem.length];

  function alternar() {
    aplicar(proximo);
    setTema(proximo);
  }

  return (
    <button type="button" className="tema-botao" onClick={alternar} aria-label={`Mudar para ${ROTULO[proximo].toLowerCase()}`} title={ROTULO[proximo]}>
      <Icone nome={ICONE[proximo]} />
      <span className="rotulo">{ROTULO[proximo]}</span>
    </button>
  );
}
