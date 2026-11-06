"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { anteciparBoletos } from "@/app/acoes-lancamentos";
import { brl } from "@/lib/formato";
import type { BancoOpcao, LancamentoLinha } from "./LancamentosDados";
import { lerValor } from "./LancamentosUtil";

// Antecipar boletos: o banco credita o valor no dia (entra no extrato/conciliação), mas o boleto
// continua em aberto até o cliente pagar. A taxa, se informada, vira uma conta a pagar já paga.
export default function AntecipacaoForm({
  lancamentos,
  bancos,
  hoje,
  onSalvo,
  onCancelar,
}: {
  lancamentos: LancamentoLinha[];
  bancos: BancoOpcao[];
  hoje: string;
  onSalvo: (msg: string) => void;
  onCancelar: () => void;
}) {
  const [estado, acao, enviando] = useActionState(anteciparBoletos, undefined);
  const [taxa, setTaxa] = useState("");
  useEffect(() => {
    if (estado?.ok) onSalvo(estado.ok);
  }, [estado, onSalvo]);

  const ativos = bancos.filter((b) => b.ativo);
  const total = lancamentos.reduce((s, l) => s + l.valor, 0);
  const previstos = [...new Set(lancamentos.map((l) => l.banco_id))];
  const sugerido = previstos.length === 1 && ativos.some((b) => b.id === previstos[0]) ? previstos[0]! : ativos.length === 1 ? ativos[0].id : "";
  const valorTaxa = lerValor(taxa) ?? 0;

  if (!ativos.length) {
    return (
      <div className="alert warn">
        Para antecipar é preciso ter um banco ativo. <Link href="/financeiro/bancos">Cadastrar banco</Link>
      </div>
    );
  }

  return (
    <form action={acao}>
      {estado?.erro && <div className="alert error">{estado.erro}</div>}
      {lancamentos.map((l) => <input key={l.id} type="hidden" name="ids" value={l.id} />)}
      <p className="small">
        {lancamentos.length === 1 ? <strong>{lancamentos[0].descricao}</strong> : <>{lancamentos.length} boletos</>}
        {" "}— total <strong>{brl(total)}</strong>
      </p>
      <p className="small muted">
        O valor entra no banco na data da antecipação (aparece no extrato e na conciliação). O boleto continua em aberto,
        aguardando o cliente pagar; quando ele pagar, marque como baixado — sem novo crédito.
      </p>
      <div className="grid2">
        <label className="field"><span>Data da antecipação</span><input type="date" name="data" required defaultValue={hoje} /></label>
        <label className="field">
          <span>Banco que creditou</span>
          <select name="banco_id" required defaultValue={sugerido}>
            <option value="" disabled>Escolha o banco</option>
            {ativos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Taxa / desconto do banco (opcional)</span>
          <input name="taxa" inputMode="decimal" placeholder="0,00" value={taxa} onChange={(e) => setTaxa(e.target.value)} />
        </label>
        <div className="field">
          <span>Líquido creditado</span>
          <div style={{ padding: ".52rem 0", fontWeight: 700 }}>{brl(total - valorTaxa)}</div>
        </div>
      </div>
      {valorTaxa > 0 && (
        <p className="small muted">A taxa entra como conta a pagar já paga (débito no mesmo banco e dia).</p>
      )}
      <div className="actions">
        <button className="btn primary" type="submit" disabled={enviando}>{enviando ? "Registrando..." : "Confirmar antecipação"}</button>
        <button className="btn" type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
