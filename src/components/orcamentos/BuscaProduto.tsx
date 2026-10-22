"use client";

import { useMemo, useState } from "react";
import { brl } from "@/lib/formato";
import { normalizar, type ProdutoBusca } from "./tipos";

// Busca rápida de produtos do estoque (nome, marca, modelo ou código "#12")
export default function BuscaProduto({ produtos, onEscolher }: { produtos: ProdutoBusca[]; onEscolher: (p: ProdutoBusca) => void }) {
  const [texto, setTexto] = useState("");
  const [ativo, setAtivo] = useState(0);
  const [aberto, setAberto] = useState(false);

  const resultados = useMemo(() => {
    const t = texto.trim();
    if (!t) return [];
    const cod = t.match(/^#?(\d+)$/);
    const q = normalizar(t.replace(/^#/, ""));
    const termos = q.split(/\s+/).filter(Boolean);
    const lista = produtos.filter((p) => {
      if (cod && String(p.codigo) === cod[1]) return true;
      const alvo = normalizar([p.codigo, p.nome, p.marca, p.modelo].filter(Boolean).join(" "));
      return termos.every((x) => alvo.includes(x));
    });
    // Código exato primeiro, depois quem tem estoque
    return lista
      .sort((a, b) => Number(cod && String(b.codigo) === cod[1]) - Number(cod && String(a.codigo) === cod[1]) || Number(b.quantidade > 0) - Number(a.quantidade > 0))
      .slice(0, 12);
  }, [produtos, texto]);

  function escolher(p: ProdutoBusca) {
    onEscolher(p);
    setTexto("");
    setAtivo(0);
  }

  return (
    <div className="orc-autocompletar orc-busca-produto">
      <input
        type="search"
        value={texto}
        placeholder="Adicionar item do estoque: nome, modelo ou código (#12)..."
        onChange={(e) => { setTexto(e.target.value); setAtivo(0); setAberto(true); }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setAtivo((a) => Math.min(a + 1, resultados.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setAtivo((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); if (resultados[ativo]) escolher(resultados[ativo]); }
          else if (e.key === "Escape") setTexto("");
        }}
      />
      {aberto && texto.trim() && (
        <ul className="orc-sugestoes">
          {!resultados.length && <li className="muted small orc-vazio">Nenhum produto encontrado.</li>}
          {resultados.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className={i === ativo ? "ativo" : ""}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setAtivo(i)}
                onClick={() => escolher(p)}
              >
                <span className="orc-sug-nome">
                  <span className="muted">#{p.codigo}</span> <strong>{p.nome}</strong>
                  {(p.marca || p.modelo) && <span className="small muted"> · {[p.marca, p.modelo].filter(Boolean).join(" ")}</span>}
                </span>
                <span className="orc-sug-info small">
                  <span className={p.quantidade > 0 ? "" : "diff-neg"}>estoque {p.quantidade}</span>
                  <span>{brl(p.preco)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
