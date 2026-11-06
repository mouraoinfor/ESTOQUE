"use client";

import { brl } from "@/lib/formato";
import { lerValor, parcelar, valorCampo } from "./LancamentosUtil";

export interface ParcelaEdit { valor: string; vencimento: string }

// Divisão padrão (valores iguais, todo mês) que o usuário depois ajusta parcela a parcela
export function gerarParcelas(valor: string, parcelas: string, vencimento: string, max = 120): ParcelaEdit[] {
  const total = lerValor(valor);
  const n = Number(parcelas);
  if (!total || total <= 0 || !Number.isInteger(n) || n < 2 || n > max || !/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) return [];
  return parcelar("", total, n, vencimento).map((p) => ({ valor: valorCampo(p.valor), vencimento: p.vencimento }));
}

// Muda uma parcela; devolve a lista nova e o total (soma das parcelas) já no formato do campo
export function mudarParcela(lista: ParcelaEdit[], i: number, campo: keyof ParcelaEdit, novo: string) {
  const nova = lista.map((p, j) => (j === i ? { ...p, [campo]: novo } : p));
  const soma = nova.reduce((acc, p) => acc + (lerValor(p.valor) ?? 0), 0);
  return { lista: nova, total: valorCampo(Math.round(soma * 100) / 100) };
}

export function parcelasInvalidas(lista: ParcelaEdit[]) {
  return lista.some((p) => !((lerValor(p.valor) ?? 0) > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(p.vencimento));
}

// Tabela de parcelas com vencimento e valor editáveis. Com "nomes", os campos vão no FormData do formulário.
export default function ParcelasEditaveis({
  lista,
  editada,
  onMudar,
  onRedividir,
  nomes,
}: {
  lista: ParcelaEdit[];
  editada: boolean;
  onMudar: (i: number, campo: keyof ParcelaEdit, valor: string) => void;
  onRedividir: () => void;
  nomes?: { valor: string; vencimento: string };
}) {
  if (lista.length < 2) return null;
  const soma = lista.reduce((acc, p) => acc + (lerValor(p.valor) ?? 0), 0);
  return (
    <div className="parcelas-edit">
      <div className="parcelas-edit-topo small muted">
        <span>Ajuste o vencimento e o valor de cada parcela{editada ? " — o valor total vira a soma das parcelas." : "."}</span>
        {editada && <button type="button" className="btn small" onClick={onRedividir}>Dividir igual de novo</button>}
      </div>
      <div className="parcelas-edit-rolagem">
      <table className="parcelas-edit-tabela">
        <thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor (R$)</th></tr></thead>
        <tbody>
          {lista.map((p, i) => (
            <tr key={i}>
              <td className="muted">{i + 1}/{lista.length}</td>
              <td>
                <input type="date" name={nomes?.vencimento} required value={p.vencimento} onChange={(e) => onMudar(i, "vencimento", e.target.value)} />
              </td>
              <td>
                <input type="text" name={nomes?.valor} inputMode="decimal" required value={p.valor} onChange={(e) => onMudar(i, "valor", e.target.value)} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><td /><td className="small muted">Total</td><td><strong>{brl(Math.round(soma * 100) / 100)}</strong></td></tr></tfoot>
      </table>
      </div>
    </div>
  );
}
