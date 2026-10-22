"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { excluirMovimento, excluirTransferencia } from "@/app/acoes-bancos";
import { brl, dataBR } from "@/lib/formato";
import type { MovimentoExtrato } from "@/app/(app)/financeiro/conciliacao/dados";
import Icone from "@/components/Icone";

function Origem({ m }: { m: MovimentoExtrato }) {
  if (m.origem === "transferencia") {
    return (
      <>
        <span className="origem-tag">Transferência</span>
        <div className="small muted">
          {m.tipo === "debito" ? "para " : "de "}
          {m.contra_banco ? <>{m.contra_banco}{!m.contra_mesma_empresa && m.contra_empresa ? ` (${m.contra_empresa})` : ""}</> : "conta excluída"}
        </div>
      </>
    );
  }
  const link = m.lancamento_id && m.lanc_tipo && (
    <Link className="small" href={`/financeiro/${m.lanc_tipo}?lancamento=${m.lancamento_id}`}>
      {m.lanc_tipo === "pagar" ? "Conta a pagar" : "Conta a receber"}: {m.lanc_descricao}
      {m.lanc_parte ? ` — ${m.lanc_parte}` : ""}
    </Link>
  );
  if (m.origem === "baixa") return <><span className="origem-tag">Baixa</span><div>{link}</div></>;
  return (
    <>
      <span className="origem-tag">Extrato{m.fitid ? " (OFX)" : ""}</span>
      <div>{link || <span className="small" style={{ color: "var(--warn)" }}>Não conciliado</span>}</div>
    </>
  );
}

export default function ExtratoTabela({ movimentos, saldoAnterior, de, ate }: { movimentos: MovimentoExtrato[]; saldoAnterior: number; de: string; ate: string }) {
  const [pendente, start] = useTransition();
  const [aviso, setAviso] = useState<{ erro?: string; ok?: string }>();

  let saldo = saldoAnterior;
  const linhas = movimentos.map((m) => {
    saldo += m.tipo === "credito" ? m.valor : -m.valor;
    return { m, saldo };
  });

  function apagar(m: MovimentoExtrato) {
    const transf = m.origem === "transferencia" && m.transferencia_id;
    const msg = transf
      ? "Excluir esta transferência? Os dois lados (origem e destino) serão apagados."
      : m.lancamento_id
        ? "Excluir este movimento? O lançamento conciliado com ele volta a ficar em aberto."
        : "Excluir este movimento do extrato?";
    if (!window.confirm(msg)) return;
    start(async () => setAviso(transf ? await excluirTransferencia(m.transferencia_id!) : await excluirMovimento(m.id)));
  }

  return (
    <>
      {aviso?.erro && <div className="alert error">{aviso.erro}</div>}
      {aviso?.ok && <div className="alert ok">{aviso.ok}</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th className="hide-sm">Origem</th>
              <th className="num">Valor</th>
              <th className="num">Saldo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr className="linha-saldo">
              <td>{dataBR(de)}</td>
              <td colSpan={2}>Saldo anterior</td>
              <td></td>
              <td className="num">{brl(saldoAnterior)}</td>
              <td></td>
            </tr>
            {linhas.map(({ m, saldo }) => (
              <tr key={m.id}>
                <td style={{ whiteSpace: "nowrap" }}>{dataBR(m.data)}</td>
                <td>{m.descricao}</td>
                <td className="hide-sm"><Origem m={m} /></td>
                <td className="num"><span className={m.tipo === "credito" ? "valor-credito" : "valor-debito"}>{m.tipo === "credito" ? "+" : "−"} {brl(m.valor)}</span></td>
                <td className={`num ${saldo < 0 ? "diff-neg" : ""}`}>{brl(saldo)}</td>
                <td className="num">
                  {m.origem !== "baixa" && (
                    <button className="btn small danger" type="button" disabled={pendente} onClick={() => apagar(m)}
                      title={m.origem === "transferencia" ? "Excluir transferência" : "Excluir movimento"}>
                      <Icone nome="lixo" tamanho={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            <tr className="linha-saldo">
              <td>{dataBR(ate)}</td>
              <td colSpan={2}>Saldo final do período</td>
              <td></td>
              <td className="num">{brl(saldo)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      {!movimentos.length && <p className="muted small">Nenhum movimento no período.</p>}
    </>
  );
}
