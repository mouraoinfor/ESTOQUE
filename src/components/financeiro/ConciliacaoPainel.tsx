"use client";

import { useActionState, useState, useTransition } from "react";
import {
  buscarAbertos,
  conciliar,
  conciliarAutomatico,
  criarLancamentoDoMovimento,
  desfazerConciliacao,
  excluirMovimento,
  importarExtrato,
  verificarExtrato,
  type LancamentoAberto,
  type LinhaExtrato,
} from "@/app/acoes-bancos";
import { brl, dataBR } from "@/lib/formato";
import type { MovimentoExtrato, Sugestao } from "@/app/(app)/financeiro/conciliacao/dados";
import Icone from "@/components/Icone";

type Aviso = { erro?: string; ok?: string } | undefined;

function Avisos({ a }: { a: Aviso }) {
  return (
    <>
      {a?.erro && <div className="alert error">{a.erro}</div>}
      {a?.ok && <div className="alert ok">{a.ok}</div>}
    </>
  );
}

function Valor({ tipo, valor }: { tipo: "credito" | "debito"; valor: number }) {
  return <span className={tipo === "credito" ? "valor-credito" : "valor-debito"}>{tipo === "credito" ? "+" : "−"} {brl(valor)}</span>;
}

// ---------------------------------------------------------------------
// Leitura de OFX (SGML 1.x ou XML 2.x) no navegador
// ---------------------------------------------------------------------

function decodificar(buf: ArrayBuffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf); // OFX de bancos brasileiros costuma vir em CHARSET:1252
  }
}

function entidades(s: string) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function tag(bloco: string, nome: string) {
  const m = bloco.match(new RegExp(`<${nome}>\\s*([^<\\r\\n]*)`, "i"));
  return m ? entidades(m[1].trim()) : "";
}

export function lerOFX(texto: string): { linhas: LinhaExtrato[]; conta: string; erros: number } {
  const blocos = texto.split(/<STMTTRN>/i).slice(1).map((b) => b.split(/<\/STMTTRN>/i)[0]);
  const linhas: LinhaExtrato[] = [];
  let erros = 0;
  for (const b of blocos) {
    const dt = tag(b, "DTPOSTED").match(/^(\d{4})(\d{2})(\d{2})/);
    const valor = Number(tag(b, "TRNAMT").replace(/\s/g, "").replace(",", "."));
    if (!dt || !isFinite(valor) || valor === 0) { erros++; continue; }
    const memo = tag(b, "MEMO"), nome = tag(b, "NAME");
    const descricao = memo && nome && memo !== nome && !memo.includes(nome) ? `${nome} - ${memo}` : memo || nome || "(sem descrição)";
    linhas.push({
      data: `${dt[1]}-${dt[2]}-${dt[3]}`,
      tipo: valor < 0 ? "debito" : "credito",
      valor: Math.round(Math.abs(valor) * 100) / 100,
      descricao,
      fitid: tag(b, "FITID") || null,
    });
  }
  return { linhas, conta: [tag(texto, "BANKID"), tag(texto, "BRANCHID"), tag(texto, "ACCTID")].filter(Boolean).join(" / "), erros };
}

type Situacao = "fitid" | "parecido" | null;

export function ImportarOFX({ bancoId }: { bancoId: string }) {
  const [linhas, setLinhas] = useState<LinhaExtrato[]>([]);
  const [situacao, setSituacao] = useState<Situacao[]>([]);
  const [marcadas, setMarcadas] = useState<boolean[]>([]);
  const [info, setInfo] = useState("");
  const [aviso, setAviso] = useState<Aviso>();
  const [ocupado, start] = useTransition();

  async function abrir(arquivo: File | undefined) {
    setAviso(undefined);
    setLinhas([]);
    if (!arquivo) return;
    const { linhas: lidas, conta, erros } = lerOFX(decodificar(await arquivo.arrayBuffer()));
    if (!lidas.length) { setAviso({ erro: "Nenhuma transação encontrada no arquivo. Confira se é um OFX de extrato." }); return; }
    // FITID repetido dentro do mesmo arquivo: fica só o primeiro
    const vistos = new Set<string>();
    const unicas = lidas.filter((l) => !l.fitid || (!vistos.has(l.fitid) && vistos.add(l.fitid)));
    start(async () => {
      const r = await verificarExtrato(bancoId, unicas);
      if (r.erro || !r.ok) { setAviso({ erro: r.erro ?? "Erro ao verificar o arquivo." }); return; }
      setLinhas(unicas);
      setSituacao(r.ok);
      setMarcadas(r.ok.map((s) => s === null));
      setInfo(`${arquivo.name}${conta ? ` · conta no arquivo: ${conta}` : ""}${erros ? ` · ${erros} linha(s) ilegível(is) ignorada(s)` : ""}`);
    });
  }

  function gravar() {
    const escolhidas = linhas.filter((_, i) => marcadas[i] && situacao[i] !== "fitid");
    if (!escolhidas.length) { setAviso({ erro: "Nenhuma linha marcada para gravar." }); return; }
    start(async () => {
      const r = await importarExtrato(bancoId, escolhidas);
      if (r.erro || !r.ok) { setAviso({ erro: r.erro }); return; }
      setAviso({ ok: `${r.ok.inseridas} linha(s) gravada(s)${r.ok.ignoradas ? `, ${r.ok.ignoradas} já existia(m)` : ""}.` });
      setLinhas([]);
    });
  }

  const novas = situacao.filter((s) => s === null).length;
  const totalMarcado = linhas.reduce((s, l, i) => s + (marcadas[i] && situacao[i] !== "fitid" ? 1 : 0), 0);

  return (
    <div className="card">
      <h2>Importar extrato (OFX)</h2>
      <p className="muted small">Baixe o extrato em OFX no internet banking. As linhas aparecem numa prévia antes de gravar; linhas já importadas são ignoradas.</p>
      <Avisos a={aviso} />
      <div className="ofx-arquivo">
        <label className="btn">
          <Icone nome="upload" tamanho={16} /> Escolher arquivo .ofx
          <input type="file" accept=".ofx,.OFX,application/x-ofx,text/plain" hidden onChange={(e) => { abrir(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {ocupado && <span className="muted small">Processando…</span>}
      </div>

      {linhas.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <p className="small muted">{info} — {linhas.length} linha(s), {novas} nova(s).</p>
          <div className="table-wrap ofx-previa" style={{ maxHeight: 420, overflowY: "auto" }}>
            <table>
              <thead>
                <tr><th></th><th>Data</th><th>Descrição</th><th className="num">Valor</th><th>Situação</th></tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr key={i} className={situacao[i] === "fitid" ? "existe" : ""}>
                    <td>
                      <input type="checkbox" disabled={situacao[i] === "fitid"} checked={!!marcadas[i] && situacao[i] !== "fitid"}
                        onChange={(e) => setMarcadas((m) => m.map((v, j) => (j === i ? e.target.checked : v)))} />
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{dataBR(l.data)}</td>
                    <td>{l.descricao}</td>
                    <td className="num"><Valor tipo={l.tipo} valor={l.valor} /></td>
                    <td>
                      {situacao[i] === "fitid" && <span className="badge">Já importada</span>}
                      {situacao[i] === "parecido" && <span className="badge media" title="Já existe no extrato um movimento com a mesma data, tipo e valor">Possível duplicada</span>}
                      {situacao[i] === null && <span className="badge novo">Nova</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions" style={{ marginTop: ".75rem" }}>
            <button className="btn primary" type="button" disabled={ocupado || !totalMarcado} onClick={gravar}>Gravar {totalMarcado} linha(s)</button>
            <button className="btn" type="button" disabled={ocupado} onClick={() => setLinhas([])}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Pendentes
// ---------------------------------------------------------------------

function BuscarLancamento({ mov, onConciliar, ocupado }: { mov: MovimentoExtrato; onConciliar: (l: string) => void; ocupado: boolean }) {
  const [texto, setTexto] = useState("");
  const [res, setRes] = useState<LancamentoAberto[]>();
  const [erro, setErro] = useState<string>();
  const [buscando, start] = useTransition();
  function buscar() {
    start(async () => {
      const r = await buscarAbertos(mov.id, texto);
      setErro(r.erro);
      setRes(r.ok ?? []);
    });
  }
  return (
    <details className="conc-extra" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open && !res) buscar(); }}>
      <summary>Buscar outro lançamento em aberto</summary>
      <div className="actions" style={{ marginTop: ".5rem" }}>
        <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Descrição, fornecedor/cliente, documento ou valor"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscar(); } }} style={{ flex: "1 1 200px" }} />
        <button className="btn small" type="button" onClick={buscar} disabled={buscando}>Buscar</button>
      </div>
      {erro && <div className="small" style={{ color: "var(--danger)" }}>{erro}</div>}
      {res && !res.length && <p className="small muted">Nenhum lançamento em aberto encontrado.</p>}
      {res && res.length > 0 && (
        <div className="conc-sugs" style={{ marginTop: ".5rem" }}>
          {res.map((l) => (
            <div className="conc-sug" key={l.id}>
              <div className="conc-sug-txt">
                <strong>{l.descricao}</strong>
                <span className="small muted">{[l.parte_nome, `venc. ${dataBR(l.vencimento)}`, l.documento].filter(Boolean).join(" · ")}</span>
              </div>
              <div className="actions" style={{ flexWrap: "nowrap" }}>
                <span className={Math.abs(l.valor - mov.valor) > 0.01 ? "diff-neg small" : "small"}>{brl(l.valor)}</span>
                <button className="btn small" type="button" disabled={ocupado} onClick={() => onConciliar(l.id)}>Conciliar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {res && res.some((l) => Math.abs(l.valor - mov.valor) > 0.01) && (
        <p className="small muted">Valores em vermelho são diferentes do movimento; o lançamento fica pago pelo valor cadastrado nele.</p>
      )}
    </details>
  );
}

function CriarLancamento({ mov, partes }: { mov: MovimentoExtrato; partes: { id: string; nome: string }[] }) {
  const [estado, acao, enviando] = useActionState(criarLancamentoDoMovimento.bind(null, mov.id), undefined);
  const tipo = mov.tipo === "debito" ? "Fornecedor" : "Cliente";
  return (
    <details className="conc-extra">
      <summary>Criar lançamento a partir do movimento</summary>
      <form action={acao} style={{ marginTop: ".5rem" }}>
        <Avisos a={estado} />
        <p className="small muted">
          Cria {mov.tipo === "debito" ? "uma conta a pagar" : "uma conta a receber"} de {brl(mov.valor)} já paga em {dataBR(mov.data)} e ligada a este movimento.
        </p>
        <label className="field"><span>Descrição</span><input type="text" name="descricao" required defaultValue={mov.descricao} /></label>
        <label className="field">
          <span>{tipo} (opcional)</span>
          <select name="parte_id" defaultValue="">
            <option value="">— sem {tipo.toLowerCase()} —</option>
            {partes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <button className="btn small primary" type="submit" disabled={enviando}>Criar e conciliar</button>
      </form>
    </details>
  );
}

function PendenteItem({ mov, sugestoes, fornecedores, clientes }: {
  mov: MovimentoExtrato;
  sugestoes: Sugestao[];
  fornecedores: { id: string; nome: string }[];
  clientes: { id: string; nome: string }[];
}) {
  const [ocupado, start] = useTransition();
  const [aviso, setAviso] = useState<Aviso>();
  const ligar = (lancId: string) => start(async () => setAviso(await conciliar(mov.id, lancId)));
  return (
    <div className="conc-mov">
      <div className="conc-info">
        <span className="small muted">{dataBR(mov.data)}{mov.fitid ? " · OFX" : ""}</span>
        <span className="conc-desc">{mov.descricao}</span>
        <Valor tipo={mov.tipo} valor={mov.valor} />
        <div>
          <button className="btn small danger" type="button" disabled={ocupado} title="Excluir esta linha do extrato"
            onClick={() => { if (window.confirm("Excluir esta linha do extrato?")) start(async () => setAviso(await excluirMovimento(mov.id))); }}>
            <Icone nome="lixo" tamanho={13} />
          </button>
        </div>
      </div>
      <div className="conc-sugs">
        <Avisos a={aviso} />
        {sugestoes.length ? (
          <>
            <span className="small muted">Sugestões ({mov.tipo === "debito" ? "contas a pagar" : "contas a receber"} com o mesmo valor):</span>
            {sugestoes.map((s) => (
              <div className="conc-sug" key={s.id}>
                <div className="conc-sug-txt">
                  <strong>{s.descricao}</strong>
                  <span className="small muted">
                    {[s.parte_nome, `venc. ${dataBR(s.vencimento)}`, s.dias === 0 ? "mesmo dia" : `${s.dias} dia(s) de diferença`, s.documento].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <button className="btn small primary" type="button" disabled={ocupado} onClick={() => ligar(s.id)}>
                  <Icone nome="conciliacao" tamanho={14} /> Conciliar
                </button>
              </div>
            ))}
          </>
        ) : (
          <span className="small muted">Nenhum lançamento em aberto com o mesmo valor e vencimento próximo.</span>
        )}
        <BuscarLancamento mov={mov} onConciliar={ligar} ocupado={ocupado} />
        <CriarLancamento mov={mov} partes={mov.tipo === "debito" ? fornecedores : clientes} />
      </div>
    </div>
  );
}

export function Pendentes({ bancoId, de, ate, pendentes, sugestoes, fornecedores, clientes }: {
  bancoId: string;
  de: string;
  ate: string;
  pendentes: MovimentoExtrato[];
  sugestoes: Sugestao[];
  fornecedores: { id: string; nome: string }[];
  clientes: { id: string; nome: string }[];
}) {
  const [ocupado, start] = useTransition();
  const [aviso, setAviso] = useState<Aviso>();
  const porMov = new Map<string, Sugestao[]>();
  for (const s of sugestoes) porMov.set(s.movimento_id, [...(porMov.get(s.movimento_id) ?? []), s]);

  return (
    <div className="card">
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: ".75rem" }}>
        <h2 style={{ margin: 0 }}>Pendentes de conciliar ({pendentes.length})</h2>
        <button className="btn primary" type="button" disabled={ocupado || !pendentes.length}
          title="Liga os movimentos que têm exatamente uma sugestão com o mesmo valor e até 3 dias de diferença"
          onClick={() => start(async () => setAviso(await conciliarAutomatico(bancoId, de, ate)))}>
          <Icone nome="conciliacao" tamanho={16} /> Conciliar automático
        </button>
      </div>
      <Avisos a={aviso} />
      {!pendentes.length && <p className="muted small">Nenhum movimento do extrato pendente neste período.</p>}
      {pendentes.map((m) => (
        <PendenteItem key={m.id} mov={m} sugestoes={porMov.get(m.id) ?? []} fornecedores={fornecedores} clientes={clientes} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Conciliados
// ---------------------------------------------------------------------

export function Conciliados({ movimentos }: { movimentos: MovimentoExtrato[] }) {
  const [ocupado, start] = useTransition();
  const [aviso, setAviso] = useState<Aviso>();
  return (
    <div className="card">
      <h2>Conciliados no período ({movimentos.length})</h2>
      <Avisos a={aviso} />
      {!movimentos.length ? (
        <p className="muted small">Nenhum movimento conciliado neste período.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Data</th><th>Movimento</th><th>Lançamento</th><th className="num">Valor</th><th></th></tr>
            </thead>
            <tbody>
              {movimentos.map((m) => (
                <tr key={m.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{dataBR(m.data)}</td>
                  <td>{m.descricao}</td>
                  <td>
                    <a href={`/financeiro/${m.lanc_tipo}?lancamento=${m.lancamento_id}`}>{m.lanc_descricao}</a>
                    <div className="small muted">{[m.lanc_parte, m.lanc_vencimento && `venc. ${dataBR(m.lanc_vencimento)}`].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td className="num"><Valor tipo={m.tipo} valor={m.valor} /></td>
                  <td className="num">
                    <button className="btn small" type="button" disabled={ocupado}
                      onClick={() => { if (window.confirm("Desfazer a conciliação? O lançamento volta a ficar em aberto.")) start(async () => setAviso(await desfazerConciliacao(m.id))); }}>
                      Desfazer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
