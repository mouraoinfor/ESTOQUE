"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { darBaixaLancamentos } from "@/app/acoes-lancamentos";
import { brl } from "@/lib/formato";
import type { TipoLancamento } from "@/lib/financeiro";
import type { BancoOpcao, LancamentoLinha } from "./LancamentosDados";

// Dar baixa em um ou vários lançamentos: mesma data e banco para todos.
// Boletos antecipados não pedem banco: o valor já entrou na antecipação, a baixa só registra que o cliente pagou.
export default function LancamentoBaixa({
  tipo,
  lancamentos,
  bancos,
  hoje,
  onSalvo,
  onCancelar,
}: {
  tipo: TipoLancamento;
  lancamentos: LancamentoLinha[];
  bancos: BancoOpcao[];
  hoje: string;
  onSalvo: (msg: string) => void;
  onCancelar: () => void;
}) {
  const [estado, acao, enviando] = useActionState(darBaixaLancamentos.bind(null, tipo), undefined);
  useEffect(() => {
    if (estado?.ok) onSalvo(estado.ok);
  }, [estado, onSalvo]);

  const ativos = bancos.filter((b) => b.ativo);
  const total = lancamentos.reduce((s, l) => s + l.valor, 0);
  // Sugere o banco previsto quando todos os selecionados têm o mesmo
  const previstos = [...new Set(lancamentos.map((l) => l.banco_id))];
  const antecipados = lancamentos.filter((l) => l.antecipado_em).length;
  const precisaBanco = antecipados < lancamentos.length;
  const sugerido = previstos.length === 1 && ativos.some((b) => b.id === previstos[0]) ? previstos[0]! : ativos.length === 1 ? ativos[0].id : "";

  if (precisaBanco && !ativos.length) {
    return (
      <div className="alert warn">
        Para dar baixa é preciso ter um banco ativo. <Link href="/financeiro/bancos">Cadastrar banco</Link>
      </div>
    );
  }

  return (
    <form action={acao}>
      {estado?.erro && <div className="alert error">{estado.erro}</div>}
      {lancamentos.map((l) => <input key={l.id} type="hidden" name="ids" value={l.id} />)}
      <p className="small">
        {lancamentos.length === 1 ? <strong>{lancamentos[0].descricao}</strong> : <>{lancamentos.length} lançamentos</>}
        {" "}— total <strong>{brl(total)}</strong>
      </p>
      {antecipados > 0 && (
        <p className="small muted">
          {antecipados === lancamentos.length ? "Boleto(s) antecipado(s)" : `${antecipados} antecipado(s)`}: o valor já foi creditado no banco
          na antecipação — a baixa só marca que o cliente pagou, sem novo crédito.
        </p>
      )}
      <div className="grid2">
        <label className="field"><span>Data do {tipo === "pagar" ? "pagamento" : "recebimento"}</span><input type="date" name="data" required defaultValue={hoje} /></label>
        {precisaBanco && (
          <label className="field">
            <span>Banco{antecipados > 0 ? " (dos não antecipados)" : ""}</span>
            <select name="banco_id" required defaultValue={sugerido}>
              <option value="" disabled>Escolha o banco</option>
              {ativos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
            </select>
          </label>
        )}
      </div>
      <label className="field">
        <span>Observação da baixa (opcional)</span>
        <input type="text" name="observacao_baixa" maxLength={500}
          placeholder={lancamentos.length > 1 ? "Ex.: pagos juntos num débito só de " + brl(total) : "Ex.: pago no débito da conta"} />
      </label>
      <div className="actions">
        <button className="btn primary" type="submit" disabled={enviando}>{enviando ? "Registrando..." : "Confirmar baixa"}</button>
        <button className="btn" type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
