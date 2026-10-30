"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { lancarNoContasPagar } from "@/app/acoes-rh";
import { brl, dataBR, hojeISO } from "@/lib/formato";
import Icone from "@/components/Icone";
import { PARTES_FOLHA, arred, nomeMes, valorParte, type ItemFolha, type LancadoFolha, type ParteFolha } from "./rh-util";

const chave = (item: string, parte: ParteFolha) => `${item}:${parte}`;

// Escolhe o que vai para o Contas a pagar (salário, VR, VT, VA de cada um); a baixa é feita depois, na conciliação
export default function FolhaLancar({
  competencia,
  itens,
  lancados,
  alterado,
  onAviso,
}: {
  competencia: string;
  itens: ItemFolha[];
  lancados: LancadoFolha[];
  alterado: boolean; // há edição sem salvar na folha: os valores daqui ainda são os antigos
  onAviso: (a: { tipo: "ok" | "error" | "warn"; texto: string }) => void;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [vencimento, setVencimento] = useState(hojeISO());
  const [agrupar, setAgrupar] = useState(false);

  const porChave = new Map(lancados.map((l) => [chave(l.item, l.parte), l]));
  const disponivel = (i: ItemFolha, parte: ParteFolha) => valorParte(i, parte) > 0 && !porChave.has(chave(i.id, parte));

  function alternar(chaves: string[], ligar: boolean) {
    setMarcados((atual) => {
      const novo = new Set(atual);
      for (const c of chaves) {
        if (ligar) novo.add(c);
        else novo.delete(c);
      }
      return novo;
    });
  }

  const selecao = itens.flatMap((i) =>
    PARTES_FOLHA.filter(({ parte }) => marcados.has(chave(i.id, parte)) && disponivel(i, parte)).map(({ parte }) => ({ item: i.id, parte }))
  );
  const total = arred(selecao.reduce((s, x) => s + valorParte(itens.find((i) => i.id === x.item)!, x.parte), 0));
  const contas = agrupar ? new Set(selecao.map((s) => s.parte)).size : selecao.length;

  function lancar() {
    if (!confirm(`Lançar ${contas} conta(s) no Contas a pagar, total ${brl(total)}, vencimento ${dataBR(vencimento)}?`)) return;
    iniciar(async () => {
      const r = await lancarNoContasPagar(competencia, selecao, vencimento, agrupar);
      if ("erro" in r) return onAviso({ tipo: "error", texto: r.erro });
      onAviso({ tipo: "ok", texto: `${r.ok} conta(s) lançada(s) no Contas a pagar. Dê baixa pela conciliação.` });
      setMarcados(new Set());
      router.refresh();
    });
  }

  return (
    <section className="card rh-lancar">
      <h2>Lançar no Contas a pagar</h2>
      <p className="small muted">
        Marque o que vai pagar de {nomeMes(competencia)}. Nada vai para o Contas a pagar sem passar por aqui. Excluir a conta lá faz o valor voltar a ficar disponível.
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Funcionário</th>
              {PARTES_FOLHA.map(({ parte, rotulo }) => {
                const coluna = itens.filter((i) => disponivel(i, parte)).map((i) => chave(i.id, parte));
                return (
                  <th key={parte} className="num">
                    <label className="check rh-lancar-marca">
                      <input
                        type="checkbox"
                        aria-label={`Marcar todos: ${rotulo}`}
                        disabled={!coluna.length}
                        checked={coluna.length > 0 && coluna.every((c) => marcados.has(c))}
                        onChange={(e) => alternar(coluna, e.target.checked)}
                      />
                      <span>{rotulo}</span>
                    </label>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id}>
                <td><strong>{i.nome}</strong></td>
                {PARTES_FOLHA.map(({ parte, rotulo }) => {
                  const c = chave(i.id, parte);
                  const feito = porChave.get(c);
                  const valor = valorParte(i, parte);
                  return (
                    <td key={parte} className="num">
                      {feito ? (
                        <Link href={`/financeiro/pagar?lancamento=${feito.lancamento_id}`} title="Abrir no Contas a pagar">
                          <span className={`badge ${feito.status === "pago" ? "pronto" : "media"}`}>{feito.status === "pago" ? "Pago" : "Lançado"}</span>
                        </Link>
                      ) : valor > 0 ? (
                        <label className="check rh-lancar-marca">
                          <input type="checkbox" aria-label={`${rotulo} de ${i.nome}`} checked={marcados.has(c)} onChange={(e) => alternar([c], e.target.checked)} />
                          <span>{brl(valor)}</span>
                        </label>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="actions rh-lancar-acoes">
        <label className="field">
          <span>Vencimento</span>
          <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
        </label>
        <label className="check" title="Use quando o banco mostra um pagamento só para todos, como a recarga do VA">
          <input type="checkbox" checked={agrupar} onChange={(e) => setAgrupar(e.target.checked)} />
          <span>Somar por tipo (uma conta só para VT, outra para VA...)</span>
        </label>
        <strong className="rh-lancar-total">{contas} conta(s) · {brl(total)}</strong>
        <button className="btn primary" type="button" disabled={pendente || alterado || !selecao.length || !vencimento} onClick={lancar}>
          <Icone nome="pagar" tamanho={16} /> Lançar no Contas a pagar
        </button>
      </div>
      {alterado && <p className="small muted">Salve as alterações da folha antes de lançar.</p>}
    </section>
  );
}
