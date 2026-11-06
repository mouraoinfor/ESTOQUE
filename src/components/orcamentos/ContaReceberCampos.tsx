"use client";

import ParcelasEditaveis, { gerarParcelas, mudarParcela, type ParcelaEdit } from "@/components/financeiro/ParcelasEditaveis";
import { valorCampo } from "@/components/financeiro/LancamentosUtil";

export interface ContaForm {
  empresa_id: string;
  valor: string;
  vencimento: string;
  parcelas: string;
  lista: ParcelaEdit[]; // parcelas ajustáveis uma a uma (vazia = 1 parcela)
  editada: boolean;
}

// Refaz a divisão padrão (valores iguais, todo mês) a partir de valor/vencimento/parcelas
function comLista(c: ContaForm): ContaForm {
  const v = Number(c.valor);
  return { ...c, lista: v > 0 ? gerarParcelas(valorCampo(v), c.parcelas, c.vencimento, 60) : [], editada: false };
}

// Campos da conta a receber gerada pelo orçamento (parcelas editáveis)
export default function ContaReceberCampos({
  valor,
  onMudar,
  empresas,
}: {
  valor: ContaForm;
  onMudar: (v: ContaForm) => void;
  empresas: { id: string; nome: string }[];
}) {
  function aoMudarParcela(i: number, campo: keyof ParcelaEdit, novo: string) {
    const r = mudarParcela(valor.lista, i, campo, novo);
    onMudar({
      ...valor,
      lista: r.lista,
      valor: r.total.replace(",", "."),
      vencimento: i === 0 && campo === "vencimento" ? novo : valor.vencimento,
      editada: true,
    });
  }

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
          <input type="number" min="0.01" step="0.01" value={valor.valor} onChange={(e) => onMudar(comLista({ ...valor, valor: e.target.value }))} />
        </label>
        <label className="field"><span>1º vencimento</span>
          <input type="date" value={valor.vencimento} onChange={(e) => onMudar(comLista({ ...valor, vencimento: e.target.value }))} />
        </label>
        <label className="field"><span>Parcelas</span>
          <input type="number" min="1" max="60" step="1" value={valor.parcelas} onChange={(e) => onMudar(comLista({ ...valor, parcelas: e.target.value }))} />
        </label>
      </div>
      <ParcelasEditaveis lista={valor.lista} editada={valor.editada} onMudar={aoMudarParcela} onRedividir={() => onMudar(comLista(valor))} />
    </div>
  );
}
