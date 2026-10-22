"use client";

import { useMemo, useState } from "react";
import { formatarDocumento } from "@/lib/formato";

export interface ParteOpcao {
  id: string;
  nome: string;
  documento: string | null;
}

export function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Campo com busca na lista de fornecedores/clientes. Envia parte_id (escolhido) e parte_nome
// (digitado); sem id, o servidor cria o cadastro só com o nome.
export default function LancamentoParteCampo({
  rotulo,
  partes,
  inicialId,
  inicialNome,
}: {
  rotulo: string;
  partes: ParteOpcao[];
  inicialId?: string | null;
  inicialNome?: string | null;
}) {
  const [nome, setNome] = useState(inicialNome ?? "");
  const [id, setId] = useState(inicialId ?? "");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);

  const opcoes = useMemo(() => {
    const q = normalizar(nome);
    const lista = q ? partes.filter((p) => normalizar(`${p.nome} ${p.documento ?? ""}`).includes(q)) : partes;
    return lista.slice(0, 8);
  }, [nome, partes]);

  function escolher(p: ParteOpcao) {
    setNome(p.nome);
    setId(p.id);
    setAberto(false);
  }

  function digitar(v: string) {
    setNome(v);
    const exato = partes.find((p) => normalizar(p.nome) === normalizar(v));
    setId(exato?.id ?? "");
    setAberto(true);
    setAtivo(0);
  }

  const novo = nome.trim() && !id;

  return (
    <label className="field lanc-combo">
      <span>{rotulo}</span>
      <input type="hidden" name="parte_id" value={id} />
      <input
        type="text"
        name="parte_nome"
        value={nome}
        autoComplete="off"
        placeholder="Digite para buscar ou cadastrar"
        onChange={(e) => digitar(e.target.value)}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 120)}
        onKeyDown={(e) => {
          if (!aberto || !opcoes.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setAtivo((a) => Math.min(a + 1, opcoes.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setAtivo((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter") { e.preventDefault(); escolher(opcoes[ativo] ?? opcoes[0]); }
        }}
      />
      {aberto && opcoes.length > 0 && (
        <ul className="lanc-combo-lista" role="listbox">
          {opcoes.map((p, i) => (
            <li
              key={p.id}
              role="option"
              aria-selected={p.id === id}
              className={i === ativo ? "ativo" : ""}
              onMouseDown={(e) => { e.preventDefault(); escolher(p); }}
            >
              {p.nome}
              {p.documento && <span className="muted small"> · {formatarDocumento(p.documento)}</span>}
            </li>
          ))}
        </ul>
      )}
      {novo && <small className="muted">Novo cadastro será criado: <strong>{nome.trim()}</strong></small>}
    </label>
  );
}
