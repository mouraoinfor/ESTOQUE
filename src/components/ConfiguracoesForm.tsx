"use client";

import { useActionState, useState } from "react";
import { salvarPrecificacao } from "@/app/acoes-configuracoes";
import { brl } from "@/lib/formato";
import { precoPor } from "@/lib/nfe";
import type { Precificacao } from "@/lib/precificacao";

export default function ConfiguracoesForm({ atual }: { atual: Precificacao }) {
  const [estado, acao, salvando] = useActionState(salvarPrecificacao, undefined);
  const [modo, setModo] = useState(atual.modo);
  const [perc, setPerc] = useState(String(atual.percentual));
  const exemplo = precoPor(modo, 100, Number(perc.replace(",", ".")));

  return (
    <form action={acao} className="card">
      <h2>Preço de venda padrão</h2>
      <p className="muted small">
        Usado para sugerir o preço de venda a partir do custo: no orçamento, ao digitar o custo de um item avulso, o
        valor de venda é preenchido sozinho; itens do estoque sem preço de venda cadastrado também entram com esse
        cálculo; e a importação de NF-e já começa com esse percentual.
      </p>
      {estado?.erro && <div className="alert error">{estado.erro}</div>}
      {estado?.ok && <div className="alert ok">{estado.ok}</div>}
      <div className="grid2">
        <label className="field">
          <span>Cálculo</span>
          <select name="modo" value={modo} onChange={(e) => setModo(e.target.value === "margem" ? "margem" : "markup")}>
            <option value="markup">Markup (percentual sobre o custo)</option>
            <option value="margem">Margem (percentual sobre o preço de venda)</option>
          </select>
        </label>
        <label className="field">
          <span>Percentual (%)</span>
          <input type="number" name="percentual" min="0" max={modo === "margem" ? 99.9 : undefined} step="0.1" value={perc} onChange={(e) => setPerc(e.target.value)} required />
        </label>
      </div>
      <p className="small">
        Exemplo: custo de {brl(100)} → venda de <strong>{exemplo === null ? "—" : brl(exemplo)}</strong>
        {modo === "markup" ? " (custo × (1 + percentual))" : " (custo ÷ (1 − percentual))"}.
      </p>
      <button className="btn primary" type="submit" disabled={salvando}>Salvar</button>
    </form>
  );
}
