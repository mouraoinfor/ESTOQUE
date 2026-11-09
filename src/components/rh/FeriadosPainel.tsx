"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { excluirFeriado, salvarFeriados } from "@/app/acoes-rh";
import Icone from "@/components/Icone";
import { dataBR } from "@/lib/formato";
import { emDiaUtil, feriadosNacionais, type Feriado } from "./rh-util";

const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const diaSemana = (d: string) => SEMANA[new Date(d + "T12:00:00Z").getUTCDay()];

// Cadastro de feriados: cada feriado de segunda a sexta tira um dia de VR/VT da folha do mês
export default function FeriadosPainel({ feriados, anoInicial }: { feriados: Feriado[]; anoInicial: number }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [ano, setAno] = useState(anoInicial);
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [sugestao, setSugestao] = useState<(Feriado & { marcado: boolean; facultativo: boolean })[] | null>(null);

  const doAno = useMemo(() => feriados.filter((f) => f.data.startsWith(`${ano}-`)), [feriados, ano]);
  const cadastradas = useMemo(() => new Set(feriados.map((f) => f.data)), [feriados]);
  const uteis = doAno.filter((f) => emDiaUtil(f.data)).length;

  function gravar(lista: Feriado[], depois?: () => void) {
    setErro("");
    iniciar(async () => {
      const r = await salvarFeriados(lista);
      if ("erro" in r) return setErro(r.erro);
      depois?.();
      router.refresh();
    });
  }

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    gravar([{ data, descricao }], () => { setData(""); setDescricao(""); });
  }

  function excluir(f: Feriado) {
    if (!window.confirm(`Excluir o feriado ${f.descricao} (${dataBR(f.data)})?`)) return;
    setErro("");
    iniciar(async () => {
      const r = await excluirFeriado(f.data);
      if ("erro" in r) return setErro(r.erro);
      router.refresh();
    });
  }

  function abrirNacionais() {
    setSugestao(
      feriadosNacionais(ano)
        .filter((f) => !cadastradas.has(f.data))
        .map((f) => ({ ...f, marcado: !f.facultativo }))
    );
  }

  return (
    <section className="card rh-feriados">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}><Icone nome="calendario" tamanho={18} /> Feriados</h2>
        <div className="actions">
          <button type="button" className="btn small" onClick={() => { setAno(ano - 1); setSugestao(null); }} aria-label="Ano anterior">‹</button>
          <strong>{ano}</strong>
          <button type="button" className="btn small" onClick={() => { setAno(ano + 1); setSugestao(null); }} aria-label="Próximo ano">›</button>
        </div>
      </div>
      <p className="small muted">
        Feriado de segunda a sexta tira um dia de VR e VT na folha do mês (dias úteis − feriados − faltas).
        Cadastre também os feriados locais (distritais/municipais) e as pontes que a empresa der.
        {doAno.length > 0 && <> {ano}: {doAno.length} feriado(s), {uteis} em dia útil.</>}
      </p>
      {erro && <div className="alert error">{erro}</div>}

      <form className="filters" onSubmit={adicionar}>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} required aria-label="Data do feriado" />
        <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Nome do feriado" maxLength={120} required />
        <button className="btn" disabled={pendente}><Icone nome="novo" tamanho={16} /> Adicionar</button>
        <button type="button" className="btn" disabled={pendente} onClick={abrirNacionais}>Feriados nacionais de {ano}</button>
      </form>

      {sugestao && (
        <div className="card rh-feriados-sugestao">
          {!sugestao.length ? (
            <p className="small muted">Todos os feriados nacionais de {ano} já estão cadastrados.</p>
          ) : (
            <>
              <p className="small">Marque os que a empresa folga (pontos facultativos vêm desmarcados):</p>
              {sugestao.map((f, k) => (
                <label key={f.data} className="check">
                  <input type="checkbox" checked={f.marcado} onChange={() => setSugestao(sugestao.map((x, j) => (j === k ? { ...x, marcado: !x.marcado } : x)))} />
                  {dataBR(f.data)} ({diaSemana(f.data)}) — {f.descricao}{f.facultativo && <span className="muted"> · ponto facultativo</span>}
                </label>
              ))}
            </>
          )}
          <div className="actions" style={{ marginTop: ".6rem" }}>
            {sugestao.some((f) => f.marcado) && (
              <button type="button" className="btn primary small" disabled={pendente}
                onClick={() => gravar(sugestao.filter((f) => f.marcado).map(({ data, descricao }) => ({ data, descricao })), () => setSugestao(null))}>
                Adicionar {sugestao.filter((f) => f.marcado).length} feriado(s)
              </button>
            )}
            <button type="button" className="btn small" onClick={() => setSugestao(null)}>Fechar</button>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Data</th><th>Dia</th><th>Feriado</th><th></th></tr>
          </thead>
          <tbody>
            {doAno.map((f) => (
              <tr key={f.data}>
                <td>{dataBR(f.data)}</td>
                <td className="small">{diaSemana(f.data)}{!emDiaUtil(f.data) && <span className="muted"> · fim de semana, não muda os dias</span>}</td>
                <td>{f.descricao}</td>
                <td className="num">
                  <button type="button" className="btn small danger" disabled={pendente} onClick={() => excluir(f)} aria-label="Excluir"><Icone nome="lixo" tamanho={14} /></button>
                </td>
              </tr>
            ))}
            {!doAno.length && (
              <tr><td colSpan={4} className="muted" style={{ textAlign: "center", padding: "1rem" }}>Nenhum feriado cadastrado em {ano}.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
