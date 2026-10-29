"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { lancarParaFuncionario } from "@/app/acoes-lancamentos";
import { brl, dataBR, hojeISO } from "@/lib/formato";
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

// Reembolsos, compras na rua, adiantamentos: contas a pagar ligadas ao funcionário
export default function PagamentosFuncionario({
  funcionarioId,
  pagamentos,
  bancos,
  podeLancar,
}: {
  funcionarioId: string;
  pagamentos: PagamentoFuncionario[];
  bancos: { id: string; nome: string }[];
  podeLancar: boolean;
}) {
  const router = useRouter();
  const [estado, acao, enviando] = useActionState(lancarParaFuncionario.bind(null, funcionarioId), undefined);
  const [pago, setPago] = useState(true);
  const form = useRef<HTMLFormElement>(null);
  const tratado = useRef<unknown>(null);

  useEffect(() => {
    if (estado?.ok && tratado.current !== estado) {
      tratado.current = estado;
      form.current?.reset();
      setPago(true);
      router.refresh();
    }
  }, [estado, router]);

  const total = pagamentos.reduce((s, p) => s + p.valor, 0);
  const abertos = pagamentos.filter((p) => p.status === "aberto");

  return (
    <section className="card">
      <h2>Pagamentos e reembolsos</h2>
      <p className="small muted">
        Compras que ele fez na rua, reembolsos, adiantamentos... Entram no contas a pagar com o nome dele (não mexem na folha).
      </p>

      {podeLancar && (
        <form ref={form} action={acao} className="rh-pag-form">
          {estado?.erro && <div className="alert error">{estado.erro}</div>}
          {estado?.ok && <div className="alert ok">{estado.ok}</div>}
          <div className="grid2">
            <label className="field"><span>O que foi</span><input type="text" name="descricao" required placeholder="Ex.: compra de conectores na loja X" /></label>
            <div className="grid2" style={{ gap: "0 .6rem" }}>
              <label className="field"><span>Valor</span><input type="text" name="valor" inputMode="decimal" placeholder="0,00" required /></label>
              <label className="field"><span>{pago ? "Data do pagamento" : "Vencimento"}</span><input type="date" name="data" required defaultValue={hojeISO()} /></label>
            </div>
          </div>
          <div className="actions" style={{ alignItems: "flex-end" }}>
            <label className="check"><input type="checkbox" name="pago" checked={pago} onChange={(e) => setPago(e.target.checked)} /> Já foi pago</label>
            {pago && (
              <label className="field" style={{ margin: 0 }}>
                <span>Banco</span>
                <select name="banco_id" required defaultValue="">
                  <option value="" disabled>Escolha...</option>
                  {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </label>
            )}
            <label className="field" style={{ margin: 0, flex: "1 1 200px" }}><span>Observação (opcional)</span><input type="text" name="observacoes" /></label>
            <button className="btn primary" disabled={enviando}><Icone nome="novo" tamanho={16} /> {enviando ? "Lançando..." : "Lançar"}</button>
          </div>
        </form>
      )}

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
