import Link from "next/link";
import { brl, dataBR } from "@/lib/formato";
import Icone from "@/components/Icone";

export interface PagamentoFuncionario {
  id: string;
  descricao: string;
  vencimento: string;
  valor: number;
  status: "aberto" | "pago";
  pago_em: string | null;
  banco_nome: string | null;
  observacoes: string | null;
}

// Só consulta: reembolsos, compras na rua, adiantamentos lançados no Contas a pagar para o funcionário
export default function PagamentosFuncionario({ pagamentos }: { pagamentos: PagamentoFuncionario[] }) {
  const total = pagamentos.reduce((s, p) => s + p.valor, 0);
  const abertos = pagamentos.filter((p) => p.status === "aberto");

  return (
    <section className="card">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Pagamentos e reembolsos</h2>
        <Link className="btn small" href="/financeiro/pagar"><Icone nome="pagar" tamanho={14} /> Lançar no Contas a pagar</Link>
      </div>
      <p className="small muted">
        Compras na rua, reembolsos, adiantamentos... São lançados no Contas a pagar escolhendo o funcionário no campo Fornecedor. Não mexem na folha.
      </p>

      {!pagamentos.length ? (
        <p className="muted small">Nada lançado para este funcionário.</p>
      ) : (
        <>
          <p className="small">
            {pagamentos.length} lançamento(s) · total {brl(total)}
            {abertos.length > 0 && <> · <strong>{brl(abertos.reduce((s, p) => s + p.valor, 0))} em aberto</strong></>}
          </p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>O que foi</th><th className="num">Valor</th><th>Situação</th></tr></thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td className="small">{dataBR(p.pago_em ?? p.vencimento)}</td>
                    <td>
                      <Link href={`/financeiro/pagar?lancamento=${p.id}`}>{p.descricao}</Link>
                      {p.observacoes && <div className="small muted">{p.observacoes}</div>}
                    </td>
                    <td className="num"><strong>{brl(p.valor)}</strong></td>
                    <td className="small">
                      {p.status === "pago"
                        ? <span className="badge pronto">Pago{p.banco_nome ? ` · ${p.banco_nome}` : ""}</span>
                        : <span className="badge media">Em aberto · vence {dataBR(p.vencimento)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
