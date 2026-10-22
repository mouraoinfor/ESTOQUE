"use client";

import { useMemo, useState } from "react";

export function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

interface ProdutoBusca {
  id: string;
  codigo: number;
  nome: string;
  marca: string | null;
  modelo: string | null;
  gtin: string | null;
  condicao: string;
  quantidade: number;
}

// Campo de busca de produto (nome, modelo, marca, código interno ou GTIN) com lista de resultados
export default function BuscaProduto({
  produtos,
  onEscolher,
  placeholder,
}: {
  produtos: ProdutoBusca[];
  onEscolher: (id: string) => void;
  placeholder?: string;
}) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);

  const resultados = useMemo(() => {
    const termos = normalizar(busca.trim()).split(/\s+/).filter(Boolean);
    if (!termos.length) return [];
    return produtos
      .filter((p) => {
        const alvo = normalizar([p.codigo, p.nome, p.marca, p.modelo, p.gtin].filter(Boolean).join(" "));
        return termos.every((t) => alvo.includes(t));
      })
      .slice(0, 10);
  }, [busca, produtos]);

  return (
    <div className="nfe-busca">
      <input
        type="search"
        value={busca}
        placeholder={placeholder ?? "Buscar produto..."}
        onChange={(e) => {
          setBusca(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        aria-label="Buscar produto"
      />
      {aberto && busca.trim() && (
        <div className="nfe-busca-lista" role="listbox">
          {!resultados.length && <div className="nfe-busca-vazio small muted">Nenhum produto encontrado.</div>}
          {resultados.map((p) => (
            <button
              type="button"
              key={p.id}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onEscolher(p.id);
                setBusca("");
                setAberto(false);
              }}
            >
              <strong>#{p.codigo} · {p.nome}</strong>
              <span className="small muted">
                {[p.marca, p.modelo].filter(Boolean).join(" ")} · {p.condicao} · estoque {p.quantidade}
                {p.gtin && <> · GTIN {p.gtin}</>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
