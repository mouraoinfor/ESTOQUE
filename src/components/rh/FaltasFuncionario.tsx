"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { excluirFalta, registrarFalta } from "@/app/acoes-rh";
import { brl, dataBR, hojeISO } from "@/lib/formato";
import Icone from "@/components/Icone";
import { arred, nomeMes, somarMeses, type Falta } from "./rh-util";

// Faltas do funcionário: cada dia tira VR e VT da folha do mês seguinte (salário e VA não mudam)
export default function FaltasFuncionario({
  funcionarioId,
  faltas,
  vrDia,
  vtDia,
}: {
  funcionarioId: string;
  faltas: Falta[];
  vrDia: number;
  vtDia: number;
}) {
  const router = useRouter();
  const [data, setData] = useState(hojeISO());
  const [dias, setDias] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, iniciar] = useTransition();

  function registrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    iniciar(async () => {
      const r = await registrarFalta(funcionarioId, data, Math.trunc(Number(dias)), motivo);
      if ("erro" in r) return setErro(r.erro);
      setDias("1");
      setMotivo("");
      router.refresh();
    });
  }

  function excluir(f: Falta) {
    if (!window.confirm(`Excluir a falta de ${dataBR(f.data)}?`)) return;
    iniciar(async () => {
      const r = await excluirFalta(f.id);
      if ("erro" in r) setErro(r.erro);
      router.refresh();
    });
  }

  // Total por mês da falta (desconta na folha do mês seguinte)
  const porMes = new Map<string, number>();
  for (const f of faltas) {
    const m = `${f.data.slice(0, 7)}-01`;
    porMes.set(m, (porMes.get(m) ?? 0) + f.dias);
  }
  const porDia = vrDia + vtDia;

  return (
    <section className="card">
      <h2>Faltas</h2>
      <p className="small muted">
        Cada dia de falta tira 1 dia de VR e de VT na folha do <strong>mês seguinte</strong>
        {porDia > 0 && <> ({brl(porDia)} por dia)</>}. O salário e o VA não são descontados.
      </p>
      {erro && <div className="alert error">{erro}</div>}
      <form onSubmit={registrar} className="actions rh-falta-form">
        <label className="field">
          <span>Data da falta</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </label>
        <label className="field">
          <span>Dias</span>
          <input type="number" min={1} max={31} step={1} value={dias} onChange={(e) => setDias(e.target.value)} required />
        </label>
        <label className="field rh-falta-motivo">
          <span>Motivo (opcional)</span>
          <input type="text" value={motivo} placeholder="Ex.: atestado, falta sem aviso" onChange={(e) => setMotivo(e.target.value)} />
        </label>
        <button className="btn primary" disabled={pendente}><Icone nome="novo" tamanho={16} /> Registrar falta</button>
      </form>

      {porMes.size > 0 && (
        <div className="small rh-falta-resumo">
          {[...porMes].map(([m, d]) => (
            <span key={m} className="badge">
              {nomeMes(m)}: {d} dia(s) · abate {porDia > 0 ? brl(arred(d * porDia)) : `${d} dia(s)`} em {nomeMes(somarMeses(m, 1))}
            </span>
          ))}
        </div>
      )}

      {!faltas.length ? (
        <p className="muted small">Nenhuma falta registrada.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Data</th><th className="num">Dias</th><th>Motivo</th><th>Abate na folha de</th><th className="hide-sm">Registrado por</th><th /></tr>
            </thead>
            <tbody>
              {faltas.map((f) => (
                <tr key={f.id}>
                  <td>{dataBR(f.data)}</td>
                  <td className="num">{f.dias}</td>
                  <td className="small">{f.motivo ?? <span className="muted">—</span>}</td>
                  <td className="small">{nomeMes(somarMeses(`${f.data.slice(0, 7)}-01`, 1))}</td>
                  <td className="small muted hide-sm">{f.usuario ?? "—"}</td>
                  <td>
                    <button type="button" className="btn small danger" disabled={pendente} onClick={() => excluir(f)} aria-label="Excluir"><Icone nome="lixo" tamanho={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
