"use client";

import { useActionState, useEffect, useState } from "react";
import { criarLancamento, editarLancamento } from "@/app/acoes-lancamentos";
import { brl, dataBR } from "@/lib/formato";
import type { TipoLancamento } from "@/lib/financeiro";
import type { BancoOpcao, LancamentoLinha } from "./LancamentosDados";
import LancamentoParteCampo, { type ParteOpcao } from "./LancamentoParteCampo";
import { lerValor, parcelar, valorCampo } from "./LancamentosUtil";

// Formulário de novo lançamento (com parcelamento) ou de edição de um lançamento
export default function LancamentoForm({
  tipo,
  lancamento,
  partes,
  bancos,
  hoje,
  onSalvo,
  onCancelar,
}: {
  tipo: TipoLancamento;
  lancamento?: LancamentoLinha;
  partes: ParteOpcao[];
  bancos: BancoOpcao[];
  hoje: string;
  onSalvo: (msg: string) => void;
  onCancelar: () => void;
}) {
  const l = lancamento;
  const acaoBase = l ? editarLancamento.bind(null, tipo, l.id) : criarLancamento.bind(null, tipo);
  const [estado, acao, enviando] = useActionState(acaoBase, undefined);
  const [valor, setValor] = useState(valorCampo(l?.valor));
  const [parcelas, setParcelas] = useState("1");
  const [vencimento, setVencimento] = useState(l?.vencimento ?? hoje);
  const pago = l?.status === "pago";

  useEffect(() => {
    if (estado?.ok) onSalvo(estado.ok);
  }, [estado, onSalvo]);

  const total = lerValor(valor);
  const n = Number(parcelas);
  const previa = !l && total && total > 0 && Number.isInteger(n) && n > 1 && n <= 120 && vencimento
    ? parcelar("", total, n, vencimento)
    : null;
  // Banco inativo só aparece se já estiver no lançamento
  const opcoesBanco = bancos.filter((b) => b.ativo || b.id === l?.banco_id);

  return (
    <form action={acao}>
      {estado?.erro && <div className="alert error">{estado.erro}</div>}
      {pago && (
        <div className="alert warn small">
          {tipo === "pagar" ? "Pago" : "Recebido"} em {dataBR(l?.pago_em)} no banco {l?.banco_nome ?? "—"}. Para mudar valor ou banco, estorne a baixa antes.
        </div>
      )}
      <label className="field"><span>Descrição</span><input type="text" name="descricao" required defaultValue={l?.descricao ?? ""} autoFocus /></label>
      <div className="grid2">
        <LancamentoParteCampo
          rotulo={tipo === "pagar" ? "Fornecedor" : "Cliente"}
          partes={partes}
          inicialId={tipo === "pagar" ? l?.fornecedor_id : l?.cliente_id}
          inicialNome={l?.parte_nome}
        />
        <label className="field"><span>Documento (boleto, duplicata...)</span><input type="text" name="documento" defaultValue={l?.documento ?? ""} /></label>
      </div>
      <div className="grid4">
        <label className="field">
          <span>{l ? "Valor" : "Valor total"}</span>
          <input type="text" name="valor" inputMode="decimal" placeholder="0,00" required value={valor} onChange={(e) => setValor(e.target.value)} disabled={pago} />
        </label>
        <label className="field">
          <span>{l ? "Vencimento" : "1º vencimento"}</span>
          <input type="date" name="vencimento" required value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
        </label>
        {!l && (
          <label className="field">
            <span>Parcelar em</span>
            <input type="number" name="parcelas" min={1} max={120} value={parcelas} onChange={(e) => setParcelas(e.target.value)} />
          </label>
        )}
        <label className="field">
          <span>Banco previsto</span>
          <select name="banco_id" defaultValue={l?.banco_id ?? ""} disabled={pago}>
            <option value="">—</option>
            {opcoesBanco.map((b) => <option key={b.id} value={b.id}>{b.nome}{b.ativo ? "" : " (inativo)"}</option>)}
          </select>
        </label>
      </div>
      {previa && (
        <p className="small muted lanc-previa">
          {n}x de {brl(previa[0].valor)}
          {previa[n - 1].valor !== previa[0].valor && <> (última {brl(previa[n - 1].valor)})</>}
          {" "}— vencimentos de {dataBR(previa[0].vencimento)} a {dataBR(previa[n - 1].vencimento)}, todo mês.
        </p>
      )}
      <label className="field"><span>Observações</span><textarea name="observacoes" rows={2} style={{ minHeight: 60 }} defaultValue={l?.observacoes ?? ""} /></label>
      <div className="actions">
        <button className="btn primary" type="submit" disabled={enviando}>{enviando ? "Salvando..." : l ? "Salvar" : "Criar lançamento"}</button>
        <button className="btn" type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
