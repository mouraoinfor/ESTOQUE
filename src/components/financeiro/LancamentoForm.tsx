"use client";

import { useActionState, useEffect, useState } from "react";
import { criarLancamento, editarLancamento } from "@/app/acoes-lancamentos";
import { dataBR } from "@/lib/formato";
import type { TipoLancamento } from "@/lib/financeiro";
import type { BancoOpcao, LancamentoLinha } from "./LancamentosDados";
import LancamentoParteCampo, { type ParteOpcao } from "./LancamentoParteCampo";
import { valorCampo } from "./LancamentosUtil";
import ParcelasEditaveis, { gerarParcelas, mudarParcela, parcelasInvalidas, type ParcelaEdit } from "./ParcelasEditaveis";

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
  const [lista, setLista] = useState<ParcelaEdit[]>([]);
  const [editada, setEditada] = useState(false);
  const pago = l?.status === "pago";

  // Mudou total, quantidade ou 1º vencimento: refaz a divisão padrão
  function refazer(v: string, n: string, venc: string) {
    setLista(gerarParcelas(v, n, venc));
    setEditada(false);
  }
  function aoMudarParcela(i: number, campo: keyof ParcelaEdit, novo: string) {
    const r = mudarParcela(lista, i, campo, novo);
    setLista(r.lista);
    setValor(r.total);
    if (i === 0 && campo === "vencimento") setVencimento(novo);
    setEditada(true);
  }

  useEffect(() => {
    if (estado?.ok) onSalvo(estado.ok);
  }, [estado, onSalvo]);

  const invalidas = parcelasInvalidas(lista);
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
          inicialId={tipo === "pagar" ? (l?.funcionario_id ? `func:${l.funcionario_id}` : l?.fornecedor_id) : l?.cliente_id}
          inicialNome={l?.parte_nome}
        />
        <label className="field"><span>Documento (boleto, duplicata...)</span><input type="text" name="documento" defaultValue={l?.documento ?? ""} /></label>
      </div>
      <div className="grid4">
        <label className="field">
          <span>{l ? "Valor" : "Valor total"}</span>
          <input type="text" name="valor" inputMode="decimal" placeholder="0,00" required value={valor} onChange={(e) => { setValor(e.target.value); if (!l) refazer(e.target.value, parcelas, vencimento); }} disabled={pago} />
        </label>
        <label className="field">
          <span>{l ? "Vencimento" : "1º vencimento"}</span>
          <input type="date" name="vencimento" required value={vencimento} onChange={(e) => { setVencimento(e.target.value); if (!l) refazer(valor, parcelas, e.target.value); }} />
        </label>
        {!l && (
          <label className="field">
            <span>Parcelar em</span>
            <input type="number" name="parcelas" min={1} max={120} value={parcelas} onChange={(e) => { setParcelas(e.target.value); refazer(valor, e.target.value, vencimento); }} />
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
      {!l && (
        <ParcelasEditaveis
          lista={lista}
          editada={editada}
          onMudar={aoMudarParcela}
          onRedividir={() => refazer(valor, parcelas, vencimento)}
          nomes={{ valor: "parcela_valor", vencimento: "parcela_vencimento" }}
        />
      )}
      <label className="field"><span>Observações</span><textarea name="observacoes" rows={2} style={{ minHeight: 60 }} defaultValue={l?.observacoes ?? ""} /></label>
      <div className="actions">
        <button className="btn primary" type="submit" disabled={enviando || invalidas}>{enviando ? "Salvando..." : l ? "Salvar" : "Criar lançamento"}</button>
        <button className="btn" type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
