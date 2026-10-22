"use client";

import { useActionState, useEffect } from "react";
import { salvarRecorrencia } from "@/app/acoes-lancamentos";
import type { TipoLancamento } from "@/lib/financeiro";
import type { BancoOpcao, RecorrenciaLinha } from "./LancamentosDados";
import LancamentoParteCampo, { type ParteOpcao } from "./LancamentoParteCampo";
import { valorCampo } from "./LancamentosUtil";

// Conta fixa: gera um lançamento por mês (até o mês seguinte ao atual)
export default function RecorrenciaForm({
  tipo,
  recorrencia,
  partes,
  bancos,
  hoje,
  onSalvo,
  onCancelar,
}: {
  tipo: TipoLancamento;
  recorrencia?: RecorrenciaLinha;
  partes: ParteOpcao[];
  bancos: BancoOpcao[];
  hoje: string;
  onSalvo: (msg: string) => void;
  onCancelar: () => void;
}) {
  const r = recorrencia;
  const [estado, acao, enviando] = useActionState(salvarRecorrencia.bind(null, tipo, r?.id ?? null), undefined);
  useEffect(() => {
    if (estado?.ok) onSalvo(estado.ok);
  }, [estado, onSalvo]);
  const opcoesBanco = bancos.filter((b) => b.ativo || b.id === r?.banco_id);

  return (
    <form action={acao}>
      {estado?.erro && <div className="alert error">{estado.erro}</div>}
      <label className="field"><span>Descrição</span><input type="text" name="descricao" required defaultValue={r?.descricao ?? ""} autoFocus placeholder={tipo === "pagar" ? "Ex.: Aluguel, internet, contador" : "Ex.: Mensalidade do cliente"} /></label>
      <div className="grid2">
        <LancamentoParteCampo rotulo={tipo === "pagar" ? "Fornecedor" : "Cliente"} partes={partes} inicialId={r?.parte_id} inicialNome={r?.parte_nome} />
        <label className="field">
          <span>Banco</span>
          <select name="banco_id" defaultValue={r?.banco_id ?? ""}>
            <option value="">—</option>
            {opcoesBanco.map((b) => <option key={b.id} value={b.id}>{b.nome}{b.ativo ? "" : " (inativo)"}</option>)}
          </select>
        </label>
      </div>
      <div className="grid4">
        <label className="field"><span>Valor</span><input type="text" name="valor" inputMode="decimal" placeholder="0,00" required defaultValue={valorCampo(r?.valor)} /></label>
        <label className="field"><span>Dia do vencimento</span><input type="number" name="dia_vencimento" min={1} max={31} required defaultValue={r?.dia_vencimento ?? 10} /></label>
        <label className="field"><span>Início</span><input type="date" name="inicio" required defaultValue={r?.inicio ?? hoje} /></label>
        <label className="field"><span>Fim (opcional)</span><input type="date" name="fim" defaultValue={r?.fim ?? ""} /></label>
      </div>
      <p className="small muted">
        Dia 29, 30 ou 31 em mês mais curto vence no último dia do mês. Os lançamentos são gerados até o mês que vem.
        {r && " Alterar valor, dia, descrição ou banco também atualiza os lançamentos futuros ainda em aberto."}
      </p>
      <label className="check" style={{ marginBottom: ".85rem" }}>
        <input type="checkbox" name="ativo" defaultChecked={r?.ativo ?? true} /> Ativa (gera lançamentos)
      </label>
      <div className="actions">
        <button className="btn primary" type="submit" disabled={enviando}>{enviando ? "Salvando..." : r ? "Salvar" : "Criar conta fixa"}</button>
        <button className="btn" type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
