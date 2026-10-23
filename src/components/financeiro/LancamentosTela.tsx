"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import Icone from "@/components/Icone";
import { excluirLancamento, excluirRecorrencia, estornarLancamento } from "@/app/acoes-lancamentos";
import { brl, dataBR } from "@/lib/formato";
import type { TipoLancamento } from "@/lib/financeiro";
import type { BancoOpcao, LancamentoLinha, RecorrenciaLinha } from "./LancamentosDados";
import LancamentoBaixa from "./LancamentoBaixa";
import LancamentoForm from "./LancamentoForm";
import LancamentoModal from "./LancamentoModal";
import { normalizar, type ParteOpcao } from "./LancamentoParteCampo";
import { mesDe, somarDias } from "./LancamentosUtil";
import RecorrenciaForm from "./RecorrenciaForm";

export type FiltroStatus = "aberto" | "vencidos" | "pagos" | "todos";
type Periodo = "" | "este" | "proximo" | "passado" | "personalizado";

type Janela =
  | { tipo: "novo" }
  | { tipo: "editar"; l: LancamentoLinha }
  | { tipo: "baixa"; ids: string[] }
  | { tipo: "recorrencia"; r?: RecorrenciaLinha }
  | { tipo: "excluirRecorrencia"; r: RecorrenciaLinha }
  | null;

export default function LancamentosTela({
  tipo,
  lancamentos,
  bancos,
  partes,
  recorrencias,
  hoje,
  statusInicial,
  abaInicial,
  destaque,
}: {
  tipo: TipoLancamento;
  lancamentos: LancamentoLinha[];
  bancos: BancoOpcao[];
  partes: ParteOpcao[];
  recorrencias: RecorrenciaLinha[];
  hoje: string;
  statusInicial: FiltroStatus;
  abaInicial: "lancamentos" | "fixas";
  destaque?: string; // ?lancamento=<id> (links do extrato/conciliação): mostra só esse lançamento
}) {
  const pagar = tipo === "pagar";
  const parteRotulo = pagar ? "Fornecedor" : "Cliente";
  const pagoRotulo = pagar ? "Pago" : "Recebido";

  const [aba, setAba] = useState(abaInicial);
  const [status, setStatus] = useState<FiltroStatus>(statusInicial);
  const [periodo, setPeriodo] = useState<Periodo>("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [busca, setBusca] = useState("");
  const [banco, setBanco] = useState("");
  const [foco, setFoco] = useState(lancamentos.some((l) => l.id === destaque) ? destaque : undefined);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [janela, setJanela] = useState<Janela>(null);
  const [aviso, setAviso] = useState<{ ok?: string; erro?: string }>({});
  const [ocupado, startTransition] = useTransition();

  const fechar = useCallback(() => setJanela(null), []);
  const salvo = useCallback((msg: string) => {
    setJanela(null);
    setSelecionados(new Set());
    setAviso({ ok: msg });
  }, []);

  const semBancoAtivo = !bancos.some((b) => b.ativo);
  const mesAtual = mesDe(hoje);
  const em7 = somarDias(hoje, 7);

  const cards = useMemo(() => {
    let aberto = 0, vencido = 0, semana = 0, pagoMes = 0;
    for (const l of lancamentos) {
      if (l.status === "aberto") {
        aberto += l.valor;
        if (l.vencimento < hoje) vencido += l.valor;
        else if (l.vencimento <= em7) semana += l.valor;
      } else if (l.pago_em && l.pago_em >= mesAtual.de && l.pago_em <= mesAtual.ate) {
        pagoMes += l.valor;
      }
    }
    return { aberto, vencido, semana, pagoMes };
  }, [lancamentos, hoje, em7, mesAtual.de, mesAtual.ate]);

  const intervalo = useMemo(() => {
    if (periodo === "este") return mesDe(hoje);
    if (periodo === "proximo") return mesDe(hoje, 1);
    if (periodo === "passado") return mesDe(hoje, -1);
    if (periodo === "personalizado") return { de, ate };
    return { de: "", ate: "" };
  }, [periodo, de, ate, hoje]);

  const filtrados = useMemo(() => {
    const q = normalizar(busca);
    if (foco) return lancamentos.filter((l) => l.id === foco);
    return lancamentos.filter((l) => {
      if (status === "aberto" && l.status !== "aberto") return false;
      if (status === "vencidos" && !(l.status === "aberto" && l.vencimento < hoje)) return false;
      if (status === "pagos" && l.status !== "pago") return false;
      if (intervalo.de && l.vencimento < intervalo.de) return false;
      if (intervalo.ate && l.vencimento > intervalo.ate) return false;
      if (banco === "sem" && l.banco_id) return false;
      if (banco && banco !== "sem" && l.banco_id !== banco) return false;
      if (q && !normalizar([l.descricao, l.parte_nome, l.documento, l.nota_numero].filter(Boolean).join(" ")).includes(q)) return false;
      return true;
    });
  }, [lancamentos, status, intervalo, banco, busca, hoje, foco]);

  const totalFiltrado = filtrados.reduce((s, l) => s + l.valor, 0);
  const abertosVisiveis = filtrados.filter((l) => l.status === "aberto");
  const marcados = abertosVisiveis.filter((l) => selecionados.has(l.id));
  const todosMarcados = abertosVisiveis.length > 0 && marcados.length === abertosVisiveis.length;

  function alternar(id: string) {
    setSelecionados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function executar(fn: () => Promise<{ ok?: string; erro?: string }>) {
    startTransition(async () => {
      const r = await fn();
      setAviso(r);
    });
  }

  function excluir(l: LancamentoLinha) {
    const msg = l.status === "pago"
      ? `Excluir "${l.descricao}"?\n\nEste lançamento já está ${pagoRotulo.toLowerCase()}: a baixa será estornada e o movimento de ${brl(l.valor)} sai do banco ${l.banco_nome ?? ""}.`
      : `Excluir "${l.descricao}" (${brl(l.valor)})?`;
    if (!window.confirm(msg + (l.recorrencia_id ? "\n\nÉ uma conta fixa: este mês não será gerado de novo." : ""))) return;
    executar(() => excluirLancamento(tipo, l.id));
  }

  function estornar(l: LancamentoLinha) {
    if (!window.confirm(`Estornar a baixa de "${l.descricao}"?\n\nO lançamento volta a ficar em aberto e o movimento no banco é desfeito.`)) return;
    executar(() => estornarLancamento(tipo, l.id));
  }

  const lancPorId = useMemo(() => new Map(lancamentos.map((l) => [l.id, l])), [lancamentos]);

  return (
    <div className="lanc">
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1.1rem" }}>
        <h1 style={{ margin: 0 }}>{pagar ? "Contas a pagar" : "Contas a receber"}</h1>
        <div className="actions">
          {pagar && (
            <Link className="btn" href="/relatorio-pagar" target="_blank">
              <Icone nome="imprimir" tamanho={16} /> Relatório do dia
            </Link>
          )}
          {aba === "lancamentos"
            ? <button className="btn primary" type="button" onClick={() => setJanela({ tipo: "novo" })}><Icone nome="novo" tamanho={16} /> Novo lançamento</button>
            : <button className="btn primary" type="button" onClick={() => setJanela({ tipo: "recorrencia" })}><Icone nome="novo" tamanho={16} /> Nova conta fixa</button>}
        </div>
      </div>

      {semBancoAtivo && (
        <div className="alert warn">
          <Icone nome="alerta" tamanho={15} /> Nenhum banco ativo cadastrado nesta empresa — a baixa precisa de um banco.{" "}
          <Link href="/financeiro/bancos">Cadastrar banco</Link>
        </div>
      )}
      {aviso.ok && <div className="alert ok lanc-aviso">{aviso.ok}<button type="button" onClick={() => setAviso({})} aria-label="Fechar"><Icone nome="fechar" tamanho={14} /></button></div>}
      {aviso.erro && <div className="alert error lanc-aviso">{aviso.erro}<button type="button" onClick={() => setAviso({})} aria-label="Fechar"><Icone nome="fechar" tamanho={14} /></button></div>}

      <div className="stats">
        <div className="stat"><div className="label">Total em aberto</div><div className="value">{brl(cards.aberto)}</div></div>
        <div className="stat lanc-stat-perigo"><div className="label">Vencido</div><div className="value">{brl(cards.vencido)}</div></div>
        <div className="stat lanc-stat-alerta"><div className="label">Vence nos próximos 7 dias</div><div className="value">{brl(cards.semana)}</div></div>
        <div className="stat lanc-stat-ok"><div className="label">{pagoRotulo} no mês</div><div className="value">{brl(cards.pagoMes)}</div></div>
      </div>

      <div className="tabs">
        <button type="button" className={aba === "lancamentos" ? "active" : ""} onClick={() => setAba("lancamentos")}>Lançamentos</button>
        <button type="button" className={aba === "fixas" ? "active" : ""} onClick={() => setAba("fixas")}>Contas fixas ({recorrencias.length})</button>
      </div>

      {aba === "lancamentos" ? (
        <>
          {foco && (
            <div className="alert ok actions" style={{ justifyContent: "space-between" }}>
              <span>Mostrando só o lançamento do link.</span>
              <button type="button" className="btn small" onClick={() => setFoco(undefined)}>Ver todos</button>
            </div>
          )}
          <div className="filters lanc-filtros">
            <select value={status} onChange={(e) => setStatus(e.target.value as FiltroStatus)} aria-label="Status">
              <option value="aberto">Em aberto</option>
              <option value="vencidos">Vencidos</option>
              <option value="pagos">{pagar ? "Pagos" : "Recebidos"}</option>
              <option value="todos">Todos</option>
            </select>
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} aria-label="Período de vencimento">
              <option value="">Qualquer vencimento</option>
              <option value="este">Vence este mês</option>
              <option value="proximo">Vence no próximo mês</option>
              <option value="passado">Venceu no mês passado</option>
              <option value="personalizado">Período personalizado</option>
            </select>
            {periodo === "personalizado" && (
              <>
                <input type="date" value={de} onChange={(e) => setDe(e.target.value)} aria-label="De" title="Vencimento de" />
                <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} aria-label="Até" title="Vencimento até" />
              </>
            )}
            <input type="search" placeholder={`Buscar descrição, ${parteRotulo.toLowerCase()}, documento...`} value={busca} onChange={(e) => setBusca(e.target.value)} />
            <select value={banco} onChange={(e) => setBanco(e.target.value)} aria-label="Banco">
              <option value="">Todos os bancos</option>
              <option value="sem">Sem banco</option>
              {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}{b.ativo ? "" : " (inativo)"}</option>)}
            </select>
          </div>

          {marcados.length > 0 && (
            <div className="lanc-selecao card">
              <span><strong>{marcados.length}</strong> selecionado(s) — {brl(marcados.reduce((s, l) => s + l.valor, 0))}</span>
              <div className="actions">
                <button className="btn primary small" type="button" onClick={() => setJanela({ tipo: "baixa", ids: marcados.map((l) => l.id) })}>
                  <Icone nome="ok" tamanho={14} /> Dar baixa nos selecionados
                </button>
                <button className="btn small" type="button" onClick={() => setSelecionados(new Set())}>Limpar seleção</button>
              </div>
            </div>
          )}

          <div className="table-wrap">
            <table className="lanc-tabela">
              <thead>
                <tr>
                  <th className="lanc-check">
                    <input
                      type="checkbox"
                      aria-label="Selecionar todos em aberto"
                      checked={todosMarcados}
                      disabled={!abertosVisiveis.length}
                      onChange={() => setSelecionados(todosMarcados ? new Set() : new Set(abertosVisiveis.map((l) => l.id)))}
                    />
                  </th>
                  <th>Vencimento</th>
                  <th>Descrição</th>
                  <th>{parteRotulo}</th>
                  <th className="hide-sm">Documento</th>
                  <th className="hide-sm">Banco</th>
                  <th className="num">Valor</th>
                  <th>Status</th>
                  <th className="hide-sm">Origem</th>
                  <th className="num">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((l) => {
                  const aberto = l.status === "aberto";
                  const vencido = aberto && l.vencimento < hoje;
                  const venceHoje = aberto && l.vencimento === hoje;
                  return (
                    <tr key={l.id} className={vencido ? "lanc-vencido" : venceHoje ? "lanc-hoje" : ""}>
                      <td className="lanc-check">
                        {aberto && <input type="checkbox" aria-label="Selecionar" checked={selecionados.has(l.id)} onChange={() => alternar(l.id)} />}
                      </td>
                      <td className="lanc-venc">
                        {dataBR(l.vencimento)}
                        {venceHoje && <div className="small">hoje</div>}
                      </td>
                      <td>
                        <strong>{l.descricao}</strong>
                        {l.observacoes && <div className="small muted lanc-obs" title={l.observacoes}>{l.observacoes}</div>}
                      </td>
                      <td className="small">{l.parte_nome ?? <span className="muted">—</span>}</td>
                      <td className="hide-sm small">{l.documento ?? <span className="muted">—</span>}</td>
                      <td className="hide-sm small">{l.banco_nome ?? <span className="muted">—</span>}</td>
                      <td className="num"><strong>{brl(l.valor)}</strong></td>
                      <td>
                        {!aberto ? <span className="badge novo" title={`em ${dataBR(l.pago_em)}`}>{pagoRotulo} {dataBR(l.pago_em).slice(0, 5)}</span>
                          : vencido ? <span className="badge baixa">Vencido</span>
                          : venceHoje ? <span className="badge a_revisar">Vence hoje</span>
                          : <span className="badge pronto">Em aberto</span>}
                      </td>
                      <td className="hide-sm small">
                        {l.nota_id && <Link href={`/notas/${l.nota_id}`}>NF {l.nota_numero ?? ""}</Link>}
                        {l.recorrencia_id && <span className="muted">Conta fixa</span>}
                        {!l.nota_id && !l.recorrencia_id && <span className="muted">—</span>}
                      </td>
                      <td className="num">
                        <div className="lanc-acoes">
                          {aberto
                            ? <button className="btn small primary" type="button" disabled={ocupado} onClick={() => setJanela({ tipo: "baixa", ids: [l.id] })} title="Dar baixa"><Icone nome="ok" tamanho={14} /> Baixar</button>
                            : <button className="btn small" type="button" disabled={ocupado} onClick={() => estornar(l)} title="Estornar baixa">Estornar</button>}
                          <button className="btn small" type="button" disabled={ocupado} onClick={() => setJanela({ tipo: "editar", l })} title="Editar" aria-label="Editar"><Icone nome="editar" tamanho={14} /></button>
                          <button className="btn small danger" type="button" disabled={ocupado} onClick={() => excluir(l)} title="Excluir" aria-label="Excluir"><Icone nome="lixo" tamanho={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtrados.length && (
                  <tr><td colSpan={10} className="muted" style={{ textAlign: "center", padding: "2rem" }}>Nenhum lançamento com esses filtros.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6}>{filtrados.length} lançamento(s)</td>
                  <td className="num"><strong>{brl(totalFiltrado)}</strong></td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>{parteRotulo}</th>
                <th className="num">Dia</th>
                <th className="num">Valor</th>
                <th className="hide-sm">Banco</th>
                <th className="hide-sm">Período</th>
                <th>Situação</th>
                <th className="num">Ações</th>
              </tr>
            </thead>
            <tbody>
              {recorrencias.map((r) => {
                const encerrada = r.fim != null && r.fim < hoje;
                return (
                  <tr key={r.id}>
                    <td><strong>{r.descricao}</strong></td>
                    <td className="small">{r.parte_nome ?? <span className="muted">—</span>}</td>
                    <td className="num">{r.dia_vencimento}</td>
                    <td className="num"><strong>{brl(r.valor)}</strong></td>
                    <td className="hide-sm small">{r.banco_nome ?? <span className="muted">—</span>}</td>
                    <td className="hide-sm small">{dataBR(r.inicio)} {r.fim ? `a ${dataBR(r.fim)}` : "em diante"}</td>
                    <td>
                      {!r.ativo ? <span className="badge">Inativa</span> : encerrada ? <span className="badge">Encerrada</span> : <span className="badge novo">Ativa</span>}
                    </td>
                    <td className="num">
                      <div className="lanc-acoes">
                        <button className="btn small" type="button" disabled={ocupado} onClick={() => setJanela({ tipo: "recorrencia", r })} aria-label="Editar"><Icone nome="editar" tamanho={14} /></button>
                        <button className="btn small danger" type="button" disabled={ocupado} onClick={() => setJanela({ tipo: "excluirRecorrencia", r })} aria-label="Excluir"><Icone nome="lixo" tamanho={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!recorrencias.length && (
                <tr><td colSpan={8} className="muted" style={{ textAlign: "center", padding: "2rem" }}>
                  Nenhuma conta fixa. Cadastre {pagar ? "aluguel, internet, salários..." : "mensalidades e contratos"} para gerar os lançamentos todo mês.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {janela?.tipo === "novo" && (
        <LancamentoModal titulo={pagar ? "Nova conta a pagar" : "Nova conta a receber"} onFechar={fechar} largo>
          <LancamentoForm tipo={tipo} partes={partes} bancos={bancos} hoje={hoje} onSalvo={salvo} onCancelar={fechar} />
        </LancamentoModal>
      )}
      {janela?.tipo === "editar" && (
        <LancamentoModal titulo="Editar lançamento" onFechar={fechar} largo>
          <LancamentoForm tipo={tipo} lancamento={janela.l} partes={partes} bancos={bancos} hoje={hoje} onSalvo={salvo} onCancelar={fechar} />
        </LancamentoModal>
      )}
      {janela?.tipo === "baixa" && (
        <LancamentoModal titulo={pagar ? "Dar baixa (pagamento)" : "Dar baixa (recebimento)"} onFechar={fechar}>
          <LancamentoBaixa
            tipo={tipo}
            lancamentos={janela.ids.map((id) => lancPorId.get(id)).filter((l): l is LancamentoLinha => !!l)}
            bancos={bancos}
            hoje={hoje}
            onSalvo={salvo}
            onCancelar={fechar}
          />
        </LancamentoModal>
      )}
      {janela?.tipo === "recorrencia" && (
        <LancamentoModal titulo={janela.r ? "Editar conta fixa" : "Nova conta fixa"} onFechar={fechar} largo>
          <RecorrenciaForm tipo={tipo} recorrencia={janela.r} partes={partes} bancos={bancos} hoje={hoje} onSalvo={salvo} onCancelar={fechar} />
        </LancamentoModal>
      )}
      {janela?.tipo === "excluirRecorrencia" && (
        <LancamentoModal titulo="Excluir conta fixa" onFechar={fechar}>
          <p>Excluir a conta fixa <strong>{janela.r.descricao}</strong> ({brl(janela.r.valor)} todo dia {janela.r.dia_vencimento})?</p>
          {janela.r.abertos_futuros > 0
            ? <p className="small muted">Ela tem {janela.r.abertos_futuros} lançamento(s) em aberto com vencimento a partir de hoje. Os já pagos e os vencidos ficam como estão.</p>
            : <p className="small muted">Não há lançamentos em aberto futuros. Os já gerados ficam como estão.</p>}
          <div className="actions">
            {janela.r.abertos_futuros > 0 && (
              <button className="btn danger" type="button" disabled={ocupado}
                onClick={() => { const r = janela.r; setJanela(null); executar(() => excluirRecorrencia(tipo, r.id, true)); }}>
                Excluir e apagar os {janela.r.abertos_futuros} futuros
              </button>
            )}
            <button className="btn danger" type="button" disabled={ocupado}
              onClick={() => { const r = janela.r; setJanela(null); executar(() => excluirRecorrencia(tipo, r.id, false)); }}>
              {janela.r.abertos_futuros > 0 ? "Excluir e manter os lançamentos" : "Excluir"}
            </button>
            <button className="btn" type="button" onClick={fechar}>Cancelar</button>
          </div>
        </LancamentoModal>
      )}
    </div>
  );
}
