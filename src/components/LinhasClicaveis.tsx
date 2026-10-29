"use client";

import { useEffect } from "react";
import "./linhas-clicaveis.css";

// Em qualquer tabela do site, clicar em qualquer ponto da linha abre o mesmo que o link da linha.
// Usa o elemento com [data-abrir] (link ou botão) ou, se não houver, o primeiro link da linha.
// Linhas com campos de digitação (tabelas de edição) e cliques em links/botões/campos ficam como estão.
const INTERATIVO = "a, button, input, select, textarea, label, summary, [role=button], [contenteditable]";
const CAMPOS = "input:not([type=checkbox]):not([type=radio]), select, textarea";

function alvoDaLinha(tr: HTMLTableRowElement) {
  if (tr.closest("thead, tfoot") || tr.querySelector(CAMPOS)) return null;
  return tr.querySelector<HTMLElement>("[data-abrir]") ?? tr.querySelector<HTMLElement>("a[href]");
}

export default function LinhasClicaveis() {
  useEffect(() => {
    function clique(e: MouseEvent) {
      if (e.button !== 0 || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      if (!el || el.closest(INTERATIVO)) return;
      if (window.getSelection()?.toString()) return; // estava selecionando texto
      const tr = el.closest("tr");
      if (!tr || !tr.closest("table")) return;
      const alvo = alvoDaLinha(tr);
      if (!alvo) return;
      alvo.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey }));
    }
    // Marca as linhas clicáveis (cursor e destaque); refaz quando a página muda
    function marcar() {
      document.querySelectorAll<HTMLTableRowElement>("main table tbody tr").forEach((tr) => {
        tr.classList.toggle("linha-clicavel", !!alvoDaLinha(tr));
      });
    }
    let agendado = 0;
    const agendar = () => { if (!agendado) agendado = requestAnimationFrame(() => { agendado = 0; marcar(); }); };
    marcar();
    const obs = new MutationObserver(agendar);
    obs.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", clique);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(agendado);
      document.removeEventListener("click", clique);
    };
  }, []);
  return null;
}
