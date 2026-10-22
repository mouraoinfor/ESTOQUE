"use client";

import { brl, dataBR } from "@/lib/formato";
import { parcelar } from "./tipos";

export interface ContaForm {
  empresa_id: string;
  valor: string;
  vencimento: string;
  parcelas: string;
}

// Campos da conta a receber gerada pelo orçamento (com prévia das parcelas)
export default function ContaReceberCampos({
  valor,
  onMudar,
  empresas,
}: {
  valor: ContaForm;
  onMudar: (v: ContaForm) => void;
  empresas: { id: string; nome: string }[];
}) {
  const total = Number(valor.valor);
  const n = Math.trunc(Number(valor.parcelas));
  const previa = total > 0 && n >= 1 && n <= 60 && /^\d{4}-\d{2}-\d{2}$/.test(valor.vencimento) ? parcelar(total, n, valor.vencimento) : [];

  return (
    <div className="orc-conta">
      <label className="field">
        <span>Empresa</span>
        <select value={valor.empresa_id} onChange={(e) => onMudar({ ...valor, empresa_id: e.target.value })}>
          <option value="">Escolha...</option>
          {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </label>
      <div className="grid4">
        <label className="field"><span>Valor total</span>
          <input type="number" min="0.01" step="0.01" value={valor.valor} onChange={(e) => onMudar({ ...valor, valor: e.target.value })} />
        </label>
        <label className="field"><span>1º vencimento</span>
          <input type="date" value={valor.vencimento} onChange={(e) => onMudar({ ...valor, vencimento: e.target.value })} />
        </label>
        <label className="field"><span>Parcelas</span>
          <input type="number" min="1" max="60" step="1" value={valor.parcelas} onChange={(e) => onMudar({ ...valor, parcelas: e.target.value })} />
        </label>
      </div>
      {previa.length > 1 && (
        <p className="small muted">
          {previa.slice(0, 6).map((p, i) => <span key={i}>{i > 0 && " · "}{i + 1}/{previa.length}: {dataBR(p.vencimento)} {brl(p.valor)}</span>)}
          {previa.length > 6 && " ..."}
        </p>
      )}
    </div>
  );
}
