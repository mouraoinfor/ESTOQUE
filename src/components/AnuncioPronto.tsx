"use client";

import { useState } from "react";
import CopyBlock from "./CopyBlock";
import { brl, type Produto } from "@/lib/types";

function ficha(p: Produto) {
  return Object.entries(p.ficha_tecnica ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n");
}

// Descrição completa para colar; inclui ficha técnica se a descrição não tiver
function descricaoCompleta(p: Produto) {
  const partes = [p.descricao ?? ""];
  const f = ficha(p);
  if (f && !(p.descricao ?? "").toLowerCase().includes("especifica")) partes.push("ESPECIFICAÇÕES TÉCNICAS\n" + f);
  return partes.filter(Boolean).join("\n\n");
}

export default function AnuncioPronto({ produto: p }: { produto: Produto }) {
  const inicial = p.condicao === "usado" ? "olx" : "ml";
  const [canal, setCanal] = useState<"ml" | "olx">(inicial);
  const preco = p.preco_venda ?? p.preco_sugerido;
  const dims = [p.altura_cm, p.largura_cm, p.comprimento_cm].every((v) => v !== null)
    ? `${p.altura_cm} x ${p.largura_cm} x ${p.comprimento_cm} cm (A x L x C)`
    : null;

  return (
    <div className="card">
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: ".75rem" }}>
        <h3 style={{ margin: 0 }}>Anúncio pronto para copiar</h3>
        <div className="actions">
          <button type="button" className={`btn small ${canal === "ml" ? "primary" : ""}`} onClick={() => setCanal("ml")}>Mercado Livre</button>
          <button type="button" className={`btn small ${canal === "olx" ? "primary" : ""}`} onClick={() => setCanal("olx")}>OLX</button>
        </div>
      </div>
      {!p.para_venda && <div className="alert warn">Este item está marcado como <strong>só estoque / não vender</strong>.</div>}
      {p.pendencias && <div className="alert warn"><strong>Confira antes de anunciar:</strong> {p.pendencias}</div>}

      {canal === "ml" ? (
        <>
          <CopyBlock label="Título" value={p.titulo_ml} limite={60} />
          <CopyBlock label="Categoria" value={p.categoria_ml} />
          <CopyBlock label="Condição" value={p.condicao === "novo" ? "Novo" : "Usado"} />
          <CopyBlock label="Preço" value={preco ? String(preco).replace(".", ",") : ""} />
          <CopyBlock label="Marca / Modelo" value={[p.marca, p.modelo].filter(Boolean).join(" / ")} />
          {p.gtin && <CopyBlock label="Código universal (EAN)" value={p.gtin} />}
          <CopyBlock label="Ficha técnica" value={ficha(p)} />
          <CopyBlock label="Descrição" value={descricaoCompleta(p)} />
          <CopyBlock label="Garantia" value={p.garantia} />
          <CopyBlock label="Embalagem (frete)" value={[p.peso_kg ? `${p.peso_kg} kg` : null, dims].filter(Boolean).join(" · ")} />
        </>
      ) : (
        <>
          <CopyBlock label="Título" value={p.titulo_olx} limite={70} />
          <CopyBlock label="Categoria" value={p.categoria_olx} />
          <CopyBlock label="Preço" value={preco ? String(Math.round(preco)) : ""} />
          <CopyBlock label="Descrição" value={descricaoCompleta(p)} />
        </>
      )}
      <p className="small muted">
        Preço sugerido: {brl(p.preco_sugerido)}
        {p.preco_min || p.preco_max ? ` · mercado: ${brl(p.preco_min)} a ${brl(p.preco_max)}` : ""}
      </p>
      {p.fontes?.length > 0 && (
        <details className="small">
          <summary className="muted">Fontes da pesquisa ({p.fontes.length})</summary>
          <ul>{p.fontes.map((f) => <li key={f}><a href={f} target="_blank" rel="noreferrer">{f}</a></li>)}</ul>
        </details>
      )}
    </div>
  );
}
