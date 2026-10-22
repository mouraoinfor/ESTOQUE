"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Icone from "@/components/Icone";
import { excluirNotaAcao } from "@/app/acoes-notas";
import { brl, dataBR } from "@/lib/formato";
import type { FaltaEstoque, ParcelaPaga } from "@/lib/nfe-importar";

type Etapa =
  | { tipo: "inicio" }
  | { tipo: "confirmar" }
  | { tipo: "pagas"; pagas: ParcelaPaga[] }
  | { tipo: "faltas"; faltas: FaltaEstoque[] }
  | { tipo: "erro"; erro: string };

// Excluir a nota: desfaz o estoque e apaga as parcelas. Pergunta antes de estornar baixas ou desfazer só em parte.
export default function ExcluirNota({ id, podePagar }: { id: string; podePagar: boolean }) {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "inicio" });
  const [opcoes, setOpcoes] = useState<{ estornarPagas: boolean; parcial: boolean }>({ estornarPagas: false, parcial: false });
  const [pendente, start] = useTransition();

  function executar(op: { estornarPagas: boolean; parcial: boolean }) {
    setOpcoes(op);
    start(async () => {
      const r = await excluirNotaAcao(id, op);
      if ("ok" in r) {
        router.push("/notas");
        return;
      }
      if (r.pagas?.length) setEtapa({ tipo: "pagas", pagas: r.pagas });
      else if (r.faltas?.length) setEtapa({ tipo: "faltas", faltas: r.faltas });
      else setEtapa({ tipo: "erro", erro: r.erro });
    });
  }

  function cancelar() {
    setEtapa({ tipo: "inicio" });
    setOpcoes({ estornarPagas: false, parcial: false });
  }

  if (etapa.tipo === "inicio") {
    return (
      <button type="button" className="btn danger" onClick={() => setEtapa({ tipo: "confirmar" })}>
        <Icone nome="lixo" tamanho={16} /> Excluir nota
      </button>
    );
  }

  return (
    <div className="card nfe-excluir">
      {etapa.tipo === "confirmar" && (
        <>
          <strong>Excluir esta nota?</strong>
          <p className="small">
            A entrada no estoque é desfeita (saída com motivo &quot;Exclusão NF&quot;), as parcelas em aberto no contas a pagar são
            apagadas e o custo/preço dos produtos volta ao que era antes, se não mudou depois. Produtos criados pela nota e sem outro uso
            são apagados. Depois dá para importar o mesmo XML de novo.
          </p>
          <div className="actions">
            <button type="button" className="btn danger" disabled={pendente} onClick={() => executar(opcoes)}>
              {pendente ? "Excluindo..." : "Sim, excluir"}
            </button>
            <button type="button" className="btn" onClick={cancelar} disabled={pendente}>Cancelar</button>
          </div>
        </>
      )}

      {etapa.tipo === "pagas" && (
        <>
          <strong><Icone nome="alerta" tamanho={15} /> {etapa.pagas.length === 1 ? "Uma parcela já foi paga" : `${etapa.pagas.length} parcelas já foram pagas`}</strong>
          <ul className="small">
            {etapa.pagas.map((p) => (
              <li key={p.id}>{p.descricao} · {brl(p.valor)} · paga em {dataBR(p.pago_em)}</li>
            ))}
          </ul>
          {podePagar ? (
            <>
              <p className="small">
                Para excluir a nota, a baixa {etapa.pagas.length === 1 ? "desta parcela será estornada" : "destas parcelas será estornada"}: o
                movimento de pagamento sai do banco (ou volta a ficar sem ligação, se veio da conciliação) e a parcela é apagada junto com a nota.
              </p>
              <div className="actions">
                <button type="button" className="btn danger" disabled={pendente} onClick={() => executar({ ...opcoes, estornarPagas: true })}>
                  {pendente ? "Excluindo..." : "Estornar as baixas e excluir mesmo assim"}
                </button>
                <button type="button" className="btn" onClick={cancelar} disabled={pendente}>Cancelar</button>
              </div>
            </>
          ) : (
            <>
              <p className="small">Estornar baixas exige acesso ao contas a pagar. Peça a quem tem acesso.</p>
              <button type="button" className="btn" onClick={cancelar}>Fechar</button>
            </>
          )}
        </>
      )}

      {etapa.tipo === "faltas" && (
        <>
          <strong><Icone nome="alerta" tamanho={15} /> Não há saldo para desfazer toda a entrada no estoque</strong>
          <table className="small nfe-faltas">
            <thead><tr><th>Produto</th><th className="num">Entrou pela nota</th><th className="num">Em estoque</th><th className="num">Será retirado</th></tr></thead>
            <tbody>
              {etapa.faltas.map((f, k) => (
                <tr key={k}><td>{f.nome}</td><td className="num">{f.entrou}</td><td className="num">{f.tem}</td><td className="num">{Math.min(f.entrou, f.tem)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="small">Parte já saiu ou foi vendida. Você pode desfazer só o que tiver saldo (esses produtos ficam zerados) ou cancelar.</p>
          <div className="actions">
            <button type="button" className="btn danger" disabled={pendente} onClick={() => executar({ ...opcoes, parcial: true })}>
              {pendente ? "Excluindo..." : "Desfazer só o que tiver saldo e excluir"}
            </button>
            <button type="button" className="btn" onClick={cancelar} disabled={pendente}>Cancelar</button>
          </div>
        </>
      )}

      {etapa.tipo === "erro" && (
        <>
          <div className="alert error" style={{ marginBottom: ".5rem" }}>{etapa.erro}</div>
          <button type="button" className="btn" onClick={cancelar}>Fechar</button>
        </>
      )}
    </div>
  );
}
