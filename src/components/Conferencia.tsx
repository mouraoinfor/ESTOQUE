"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { aplicarConferencia, registrarConferencia, zerarConferencia } from "@/app/actions";
import { CONDICAO_LABEL, type Produto } from "@/lib/types";

function Linha({ p }: { p: Produto }) {
  const [valor, setValor] = useState(p.quantidade_conferida?.toString() ?? "");
  const [salvo, setSalvo] = useState(p.quantidade_conferida);
  const [pendente, start] = useTransition();

  const diff = salvo === null ? null : salvo - p.quantidade;

  function salvar() {
    if (valor === "") return;
    const n = Math.max(0, Math.trunc(Number(valor)));
    if (n === salvo) return;
    start(async () => {
      const r = await registrarConferencia(p.id, n);
      if (!("erro" in r)) setSalvo(n);
    });
  }

  return (
    <tr>
      <td className="num muted">{p.codigo}</td>
      <td>
        <Link href={`/itens/${p.id}`}>{p.nome}</Link>
        <div className="small muted">
          <span className={`badge ${p.condicao}`}>{CONDICAO_LABEL[p.condicao]}</span>
          {p.localizacao ? ` 📍 ${p.localizacao}` : ""}
        </div>
      </td>
      <td className="num"><strong>{p.quantidade}</strong></td>
      <td className="num">
        <input
          type="number"
          min={0}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={salvar}
          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
          style={{ width: 80, textAlign: "right" }}
          disabled={pendente}
        />
      </td>
      <td className="num">
        {diff === null ? <span className="muted">—</span> : diff === 0 ? <span className="diff-pos">✓ OK</span> : <span className="diff-neg">{diff > 0 ? "+" : ""}{diff}</span>}
      </td>
      <td>
        {diff !== null && diff !== 0 && (
          <button className="btn small" type="button" disabled={pendente} onClick={() => start(async () => { await aplicarConferencia(p.id); })}>
            Ajustar estoque p/ {salvo}
          </button>
        )}
      </td>
    </tr>
  );
}

export default function Conferencia({ produtos }: { produtos: Produto[] }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  const [pendente, start] = useTransition();

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      if (filtro === "faltando" && p.quantidade_conferida !== null) return false;
      if (filtro === "divergente" && (p.quantidade_conferida === null || p.quantidade_conferida === p.quantidade)) return false;
      if (q && !`${p.codigo} ${p.nome} ${p.modelo ?? ""} ${p.localizacao ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [produtos, busca, filtro]);

  const conferidos = produtos.filter((p) => p.quantidade_conferida !== null).length;
  const divergentes = produtos.filter((p) => p.quantidade_conferida !== null && p.quantidade_conferida !== p.quantidade).length;

  return (
    <>
      <h1>Conferência de estoque</h1>
      <p className="muted">Conte cada item fisicamente e digite a quantidade encontrada. O sistema mostra as diferenças, e você decide se ajusta o estoque.</p>
      <div className="stats">
        <div className="stat"><div className="label">Conferidos</div><div className="value">{conferidos} / {produtos.length}</div></div>
        <div className="stat"><div className="label">Com divergência</div><div className="value" style={{ color: divergentes ? "var(--danger)" : undefined }}>{divergentes}</div></div>
      </div>
      <div className="filters">
        <input type="search" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos</option>
          <option value="faltando">Ainda não conferidos</option>
          <option value="divergente">Com divergência</option>
        </select>
        <button className="btn" type="button" disabled={pendente} onClick={() => start(async () => { await zerarConferencia(); location.reload(); })}>
          Iniciar nova conferência
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th className="num">#</th><th>Produto</th><th className="num">Sistema</th><th className="num">Contado</th><th className="num">Diferença</th><th></th></tr>
          </thead>
          <tbody>{lista.map((p) => <Linha key={p.id} p={p} />)}</tbody>
        </table>
      </div>
    </>
  );
}
