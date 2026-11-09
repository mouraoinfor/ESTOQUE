"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import Icone from "@/components/Icone";
import { desfazerAntecipacaoLancamento, excluirLancamento, excluirRecorrencia, estornarLancamento } from "@/app/acoes-lancamentos";
import { Barras } from "@/components/Graficos";
import { brl, dataBR } from "@/lib/formato";
import type { TipoLancamento } from "@/lib/financeiro";
import AntecipacaoForm from "./AntecipacaoForm";
import type { BancoOpcao, LancamentoLinha, RecorrenciaLinha } from "./LancamentosDados";
import LancamentoBaixa from "./LancamentoBaixa";
import LancamentoForm from "./LancamentoForm";
import LancamentoModal from "./LancamentoModal";
import { normalizar, type ParteOpcao } from "./LancamentoParteCampo";
import { FORMAS_PAGAMENTO, mesDe, somarDias } from "./LancamentosUtil";
import RecorrenciaForm from "./RecorrenciaForm";

export type FiltroStatus = "aberto" | "vencidos" | "pagos" | "todos";
type Periodo = "" | "hoje" | "semana" | "dia" | "este" | "proximo" | "passado" | "personalizado";
type FiltroAntecipacao = "abertos" | "a_antecipar" | "antecipados" | "baixados";
type Aba = "lancamentos" | "antecipacao" | "fixas" | "credito";

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const reais = (v: number) => brl(Math.round(v)).replace(",00", "");

// Soma por dia de vencimento (até ~2 meses) ou por mês, para o gráfico que acompanha os filtros
function agruparVencimentos(lista: LancamentoLinha[], porDia: boolean) {
  const soma = new Map<string, number>();
  for (const l of lista) {
    const k = porDia ? l.vencimento : l.vencimento.slice(0, 7);
    soma.set(k, (soma.get(k) ?? 0) + l.valor);
  }
  return [...soma].sort(([a], [b]) => a.localeCompare(b)).map(([k, valor]) => {
    const [a, m, d] = k.split("-").map(Number);
    const rotulo = porDia
      ? `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")} ${SEMANA[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]}`
      : `${MESES[m - 1]}/${String(a).slice(2)}`;
    return { rotulo, valor };
  });
}

function diasEntre(de: string, ate: string) {
  return (Date.parse(ate + "T00:00:00Z") - Date.parse(de + "T00:00:00Z")) / 86_400_000;
}

type Janela =
  | { tipo: "novo"; credito?: boolean }
  | { tipo: "editar"; l: LancamentoLinha }
  | { tipo: "baixa"; ids: string[] }
  | { tipo: "antecipar"; ids: string[] }
  | { tipo: "recorrencia"; r?: RecorrenciaLinha }
  | { tipo: "excluirRecorrencia"; r: RecorrenciaLinha }
  | null;

const ehCredito = (l: LancamentoLinha) => l.tipo === "pagar" && l.forma_pagamento === "cartao_credito";

export default function LancamentosTela({
  tipo,
  lancamentos: todos,
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
  abaInicial: Aba;
  destaque?: string; // ?lancamento=<id> (links do extrato/conciliação): mostra só esse lançamento
}) {
  const pagar = tipo === "pagar";
  // Compras no cartão de crédito não entram no contas a pagar: ficam só na aba "Compras no crédito"
  const lancamentos = useMemo(() => todos.filter((l) => !ehCredito(l)), [todos]);
  const compras = useMemo(() => todos.filter(ehCredito), [todos]);
  const parteRotulo = pagar ? "Fornecedor" : "Cliente";
  const pagoRotulo = pagar ? "Pago" : "Recebido";

  const [aba, setAba] = useState<Aba>(abaInicial);
  const [status, setStatus] = useState<FiltroStatus>(statusInicial);
  const [filtroAnt, setFiltroAnt] = useState<FiltroAntecipacao>("abertos");
  const [periodo, setPeriodo] = useState<Periodo>("");
  const [dia, setDia] = useState(hoje);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [busca, setBusca] = useState("");
  const [banco, setBanco] = useState("");
  const [forma, setForma] = useState("");
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

  const intervalo = useMemo(() => {
    if (periodo === "hoje") return { de: hoje, ate: hoje };
    if (periodo === "semana") return { de: hoje, ate: em7 };
    if (periodo === "dia") return { de: dia, ate: dia };
    if (periodo === "este") return mesDe(hoje);
    if (periodo === "proximo") return mesDe(hoje, 1);
    if (periodo === "passado") return mesDe(hoje, -1);
    if (periodo === "personalizado") return { de, ate };
    return { de: "", ate: "" };
  }, [periodo, de, ate, dia, hoje, em7]);
  const comPeriodo = !!(intervalo.de || intervalo.ate);
  const noPeriodo = useCallback(
    (d: string | null) => !!d && (!intervalo.de || d >= intervalo.de) && (!intervalo.ate || d <= intervalo.ate),
    [intervalo]
  );

  // Banco e busca (valem para a tabela, os cartões e o gráfico)
  const combina = useMemo(() => {
    const q = normalizar(busca);
    return (l: LancamentoLinha) => {
      if (banco === "sem" && l.banco_id) return false;
      if (banco && banco !== "sem" && l.banco_id !== banco) return false;
      if (forma === "sem" && l.forma_pagamento) return false;
      if (forma && forma !== "sem" && l.forma_pagamento !== forma) return false;
      if (q && !normalizar([l.descricao, l.parte_nome, l.documento, l.nota_numero, l.observacoes, l.cartao].filter(Boolean).join(" ")).includes(q)) return false;
      return true;
    };
  }, [banco, forma, busca]);

  // Compras no crédito: só consulta, por mês da fatura (vencimento) e por cartão
  const cartoes = useMemo(() => [...new Set(todos.map((l) => l.cartao).filter((c): c is string => !!c))].sort(), [todos]);
  const [mesFatura, setMesFatura] = useState(0); // meses a partir do atual
  const [filtroCartao, setFiltroCartao] = useState("");
  const fatura = mesDe(hoje, mesFatura);
  const credito = useMemo(() => {
    const q = normalizar(busca);
    const lista = compras.filter((l) =>
      l.vencimento >= fatura.de && l.vencimento <= fatura.ate
      && (!filtroCartao || (l.cartao ?? "") === filtroCartao)
      && (!q || normalizar([l.descricao, l.parte_nome, l.documento, l.nota_numero, l.observacoes, l.cartao].filter(Boolean).join(" ")).includes(q))
    ).sort((a, b) => a.vencimento.localeCompare(b.vencimento) || a.descricao.localeCompare(b.descricao));
    const porCartao = new Map<string, number>();
    for (const l of lista) porCartao.set(l.cartao || "Sem nome", (porCartao.get(l.cartao || "Sem nome") ?? 0) + l.valor);
    const daqui = compras.filter((l) => l.vencimento > fatura.ate && (!filtroCartao || (l.cartao ?? "") === filtroCartao)).reduce((s, l) => s + l.valor, 0);
    return { lista, total: lista.reduce((s, l) => s + l.valor, 0), porCartao, daqui };
  }, [compras, fatura.de, fatura.ate, filtroCartao, busca]);
  const nomeMes = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

  // Período (vencimento) + banco + busca; o status fica de fora porque os cartões separam por status
  const base = useMemo(() => {
    if (foco) return lancamentos.filter((l) => l.id === foco);
    return lancamentos.filter((l) => (!comPeriodo || noPeriodo(l.vencimento)) && combina(l));
  }, [lancamentos, noPeriodo, comPeriodo, combina, foco]);

  const filtrados = useMemo(() => {
    if (foco) return base;
    return base.filter((l) => {
      if (status === "aberto" && l.status !== "aberto") return false;
      if (status === "vencidos" && !(l.status === "aberto" && l.vencimento < hoje)) return false;
      if (status === "pagos" && l.status !== "pago") return false;
      return true;
    });
  }, [base, status, hoje, foco]);

  // Cartões acompanham os filtros. Sem período: "a vencer" = próximos 7 dias e "pago" = este mês;
  // com período: a vencer dentro dele e pago pela data do pagamento dentro dele.
  // Boleto antecipado já entrou no banco: sai do "em aberto" e conta como recebido na data da antecipação.
  const cards = useMemo(() => {
    let aberto = 0, vencido = 0, aVencer = 0, pago = 0;
    for (const l of base) {
      if (l.status !== "aberto" || l.antecipado_em) continue;
      aberto += l.valor;
      if (l.vencimento < hoje) vencido += l.valor;
      else if (comPeriodo || l.vencimento <= em7) aVencer += l.valor;
    }
    const pagoDe = comPeriodo ? intervalo.de : mesAtual.de;
    const pagoAte = comPeriodo ? intervalo.ate : mesAtual.ate;
    for (const l of foco ? base : lancamentos) {
      const entrou = l.antecipado_em ?? (l.status === "pago" ? l.pago_em : null);
      if (entrou && (!pagoDe || entrou >= pagoDe) && (!pagoAte || entrou <= pagoAte) && combina(l)) pago += l.valor;
    }
    return { aberto, vencido, aVencer, pago };
  }, [base, lancamentos, foco, combina, hoje, em7, comPeriodo, intervalo, mesAtual.de, mesAtual.ate]);

  // Antecipação de boletos (só contas a receber)
  const listaAntecipacao = useMemo(() => base.filter((l) => {
    if (filtroAnt === "abertos") return l.status === "aberto";
    if (filtroAnt === "a_antecipar") return l.status === "aberto" && !l.antecipado_em;
    if (filtroAnt === "antecipados") return l.status === "aberto" && !!l.antecipado_em;
    return l.status === "pago" && !!l.antecipado_em;
  }), [base, filtroAnt]);
  const cardsAnt = useMemo(() => {
    let aguardando = 0, atrasado = 0, aAntecipar = 0, baixados = 0;
    for (const l of base) {
      if (l.status === "aberto" && l.antecipado_em) {
        aguardando += l.valor;
        if (l.vencimento < hoje) atrasado += l.valor;
      } else if (l.status === "aberto") aAntecipar += l.valor;
      else if (l.antecipado_em) baixados += l.valor;
    }
    return { aguardando, atrasado, aAntecipar, baixados };
  }, [base, hoje]);

  const modoAnt = aba === "antecipacao";
  const visiveis = modoAnt ? listaAntecipacao : filtrados;

  // Na aba Lançamentos o gráfico é previsão: antecipados em aberto ficam fora (o valor já entrou)
  const grafico = useMemo(() => {
    const lista = modoAnt ? visiveis : visiveis.filter((l) => !(l.status === "aberto" && l.antecipado_em));
    const fora = visiveis.length - lista.length;
    if (!lista.length) return { porDia: false, dados: [], total: 0, fora };
    const datas = lista.map((l) => l.vencimento).sort();
    const porDia = comPeriodo && diasEntre(datas[0], datas[datas.length - 1]) <= 62;
    return { porDia, dados: agruparVencimentos(lista, porDia), total: lista.reduce((s, l) => s + l.valor, 0), fora, n: lista.length };
  }, [visiveis, comPeriodo, modoAnt]);

  const totalFiltrado = visiveis.reduce((s, l) => s + l.valor, 0);
  const abertosVisiveis = visiveis.filter((l) => l.status === "aberto");
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
    const msg = l.status === "pago" || l.antecipado_em
      ? `Excluir "${l.descricao}"?\n\nEste lançamento já está ${l.status === "pago" ? pagoRotulo.toLowerCase() : "antecipado"}: o movimento de ${brl(l.valor)} sai do banco ${l.banco_nome ?? ""}.`
      : `Excluir "${l.descricao}" (${brl(l.valor)})?`;
    if (!window.confirm(msg + (l.recorrencia_id ? "\n\nÉ uma conta fixa: este mês não será gerado de novo." : ""))) return;
    executar(() => excluirLancamento(tipo, l.id));
  }

  function estornar(l: LancamentoLinha) {
    const efeito = l.antecipado_em
      ? "O boleto volta a ficar em aberto (antecipado); o crédito da antecipação continua no banco."
      : "O lançamento volta a ficar em aberto e o movimento no banco é desfeito.";
    if (!window.confirm(`Estornar a baixa de "${l.descricao}"?\n\n${efeito}`)) return;
    executar(() => estornarLancamento(tipo, l.id));
  }

  function desfazerAntecipacao(l: LancamentoLinha) {
    if (!window.confirm(`Desfazer a antecipação de "${l.descricao}"?\n\nO crédito de ${brl(l.valor)} sai do banco ${l.banco_nome ?? ""} e o boleto volta a "a antecipar".`)) return;
    executar(() => desfazerAntecipacaoLancamento(l.id));
  }

  const lancPorId = useMemo(() => new Map(todos.map((l) => [l.id, l])), [todos]);

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
          {aba === "credito"
            ? <button className="btn primary" type="button" onClick={() => setJanela({ tipo: "novo", credito: true })}><Icone nome="novo" tamanho={16} /> Nova compra no crédito</button>
            : aba !== "fixas"
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

      {aba === "credito" ? (
        <div className="stats">
          <div className="stat"><div className="label">Fatura de {nomeMes(fatura.de)}</div><div className="value">{brl(credito.total)}</div></div>
          <div className="stat"><div className="label">Compras no mês</div><div className="value">{credito.lista.length}</div></div>
          <div className="stat"><div className="label">Parcelas nas faturas seguintes</div><div className="value">{brl(credito.daqui)}</div></div>
        </div>
      ) : modoAnt ? (
        <div className="stats">
          <div className="stat lanc-stat-ok"><div className="label">Antecipado, aguardando o cliente</div><div className="value">{brl(cardsAnt.aguardando)}</div></div>
          <div className="stat lanc-stat-perigo"><div className="label">Antecipados vencidos (cliente atrasado)</div><div className="value">{brl(cardsAnt.atrasado)}</div></div>
          <div className="stat"><div className="label">Em aberto sem antecipação</div><div className="value">{brl(cardsAnt.aAntecipar)}</div></div>
          <div className="stat"><div className="label">Antecipados já baixados</div><div className="value">{brl(cardsAnt.baixados)}</div></div>
        </div>
      ) : (
        <div className="stats">
          <div className="stat"><div className="label">Total em aberto{comPeriodo ? " no período" : ""}</div><div className="value">{brl(cards.aberto)}</div></div>
          <div className="stat lanc-stat-perigo"><div className="label">Vencido{comPeriodo ? " no período" : ""}</div><div className="value">{brl(cards.vencido)}</div></div>
          <div className="stat lanc-stat-alerta"><div className="label">{comPeriodo ? "A vencer no período" : "Vence nos próximos 7 dias"}</div><div className="value">{brl(cards.aVencer)}</div></div>
          <div className="stat lanc-stat-ok"><div className="label">{pagoRotulo} {comPeriodo ? "no período" : "no mês"}</div><div className="value">{brl(cards.pago)}</div></div>
        </div>
      )}

      <div className="tabs">
        <button type="button" className={aba === "lancamentos" ? "active" : ""} onClick={() => setAba("lancamentos")}>Lançamentos</button>
        {!pagar && <button type="button" className={aba === "antecipacao" ? "active" : ""} onClick={() => setAba("antecipacao")}>Antecipação de boletos</button>}
        <button type="button" className={aba === "fixas" ? "active" : ""} onClick={() => setAba("fixas")}>Contas fixas ({recorrencias.length})</button>
        {pagar && <button type="button" className={aba === "credito" ? "active" : ""} onClick={() => setAba("credito")}><Icone nome="cartao" tamanho={14} /> Compras no crédito ({compras.length})</button>}
      </div>

      {aba === "credito" ? (
        <>
          <p className="small muted" style={{ marginTop: 0 }}>
            Compras no cartão de crédito, só para consulta: não entram no contas a pagar, nos totais nem na conciliação.
            Cada uma aparece no mês da fatura (vencimento). Para pagar, lance a fatura do cartão como uma conta normal.
          </p>
          <div className="filters lanc-filtros">
            <div className="actions">
              <button type="button" className="btn small" onClick={() => setMesFatura(mesFatura - 1)} aria-label="Fatura anterior">‹</button>
              <strong className="lanc-mes-fatura">{nomeMes(fatura.de)}</strong>
              <button type="button" className="btn small" onClick={() => setMesFatura(mesFatura + 1)} aria-label="Próxima fatura">›</button>
              {mesFatura !== 0 && <button type="button" className="btn small" onClick={() => setMesFatura(0)}>Mês atual</button>}
            </div>
            {cartoes.length > 0 && (
              <select value={filtroCartao} onChange={(e) => setFiltroCartao(e.target.value)} aria-label="Cartão">
                <option value="">Todos os cartões</option>
                {cartoes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <input type="search" placeholder="Buscar descrição, fornecedor, observação..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          {credito.porCartao.size > 1 && (
            <p className="small">{[...credito.porCartao].map(([c, v]) => <span key={c} className="lanc-por-cartao"><Icone nome="cartao" tamanho={12} /> {c}: <strong>{brl(v)}</strong></span>)}</p>
          )}
          <div className="table-wrap">
            <table className="lanc-tabela">
              <thead>
                <tr>
                  <th>Fatura</th>
                  <th>Descrição</th>
                  <th>{parteRotulo}</th>
                  <th className="hide-sm">Cartão</th>
                  <th className="hide-sm">Origem</th>
                  <th className="num">Valor</th>
                  <th className="num">Ações</th>
                </tr>
              </thead>
              <tbody>
                {credito.lista.map((l) => (
                  <tr key={l.id}>
                    <td className="lanc-venc">{dataBR(l.vencimento)}</td>
                    <td>
                      <strong>{l.descricao}</strong>
                      {l.observacoes && <div className="small muted lanc-obs" title={l.observacoes}>{l.observacoes}</div>}
                    </td>
                    <td className="small">{l.parte_nome ?? <span className="muted">—</span>}</td>
                    <td className="hide-sm small">{l.cartao ?? <span className="muted">—</span>}</td>
                    <td className="hide-sm small">
                      {l.nota_id ? <Link href={`/notas/${l.nota_id}`}>NF {l.nota_numero ?? ""}</Link> : <span className="muted">—</span>}
                    </td>
                    <td className="num"><strong>{brl(l.valor)}</strong></td>
                    <td className="num">
                      <div className="lanc-acoes">
                        <button className="btn small" type="button" data-abrir disabled={ocupado} onClick={() => setJanela({ tipo: "editar", l })} title="Editar" aria-label="Editar"><Icone nome="editar" tamanho={14} /></button>
                        <button className="btn small danger" type="button" disabled={ocupado} onClick={() => excluir(l)} title="Excluir" aria-label="Excluir"><Icone nome="lixo" tamanho={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!credito.lista.length && (
                  <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: "2rem" }}>Nenhuma compra no crédito com fatura em {nomeMes(fatura.de)}.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>{credito.lista.length} compra(s)</td>
                  <td className="num"><strong>{brl(credito.total)}</strong></td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : aba !== "fixas" ? (
        <>
          {foco && (
            <div className="alert ok actions" style={{ justifyContent: "space-between" }}>
              <span>Mostrando só o lançamento do link.</span>
              <button type="button" className="btn small" onClick={() => setFoco(undefined)}>Ver todos</button>
            </div>
          )}
          {modoAnt && (
            <p className="small muted" style={{ marginTop: 0 }}>
              Marque os boletos que o banco antecipou: o valor entra no banco no dia (extrato e conciliação), mas o boleto
              continua em aberto até o cliente pagar. Quando ele pagar, marque como baixado — o valor já foi creditado, não entra de novo.
              Os não antecipados seguem a baixa normal.
            </p>
          )}
          <div className="filters lanc-filtros">
            {modoAnt ? (
              <select value={filtroAnt} onChange={(e) => setFiltroAnt(e.target.value as FiltroAntecipacao)} aria-label="Situação da antecipação">
                <option value="abertos">Todos em aberto</option>
                <option value="a_antecipar">Em aberto sem antecipação</option>
                <option value="antecipados">Antecipados aguardando o cliente</option>
                <option value="baixados">Antecipados já baixados</option>
              </select>
            ) : (
              <select value={status} onChange={(e) => setStatus(e.target.value as FiltroStatus)} aria-label="Status">
                <option value="aberto">Em aberto</option>
                <option value="vencidos">Vencidos</option>
                <option value="pagos">{pagar ? "Pagos" : "Recebidos"}</option>
                <option value="todos">Todos</option>
              </select>
            )}
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} aria-label="Período de vencimento">
              <option value="">Qualquer vencimento</option>
              <option value="hoje">Vence hoje</option>
              <option value="semana">Vence nos próximos 7 dias</option>
              <option value="dia">Vence no dia...</option>
              <option value="este">Vence este mês</option>
              <option value="proximo">Vence no próximo mês</option>
              <option value="passado">Venceu no mês passado</option>
              <option value="personalizado">Período personalizado</option>
            </select>
            {periodo === "dia" && (
              <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} aria-label="Dia do vencimento" title="Dia do vencimento" />
            )}
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
            <select value={forma} onChange={(e) => setForma(e.target.value)} aria-label="Forma de pagamento">
              <option value="">Todas as formas</option>
              {Object.entries(FORMAS_PAGAMENTO).filter(([k]) => !pagar || k !== "cartao_credito").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              <option value="sem">Forma não informada</option>
            </select>
          </div>

          {marcados.length > 0 && (
            <div className="lanc-selecao card">
              <span><strong>{marcados.length}</strong> selecionado(s) — {brl(marcados.reduce((s, l) => s + l.valor, 0))}</span>
              <div className="actions">
                {modoAnt && marcados.some((l) => !l.antecipado_em) && (
                  <button className="btn primary small" type="button"
                    onClick={() => setJanela({ tipo: "antecipar", ids: marcados.filter((l) => !l.antecipado_em).map((l) => l.id) })}>
                    <Icone nome="banco" tamanho={14} /> Marcar como antecipado{marcados.some((l) => l.antecipado_em) ? ` (${marcados.filter((l) => !l.antecipado_em).length})` : ""}
                  </button>
                )}
                <button className={`btn small${modoAnt ? "" : " primary"}`} type="button" onClick={() => setJanela({ tipo: "baixa", ids: marcados.map((l) => l.id) })}>
                  <Icone nome="ok" tamanho={14} /> {modoAnt ? "Marcar como baixado" : "Dar baixa nos selecionados"}
                </button>
                <button className="btn small" type="button" onClick={() => setSelecionados(new Set())}>Limpar seleção</button>
              </div>
            </div>
          )}

          {grafico.dados.length > 0 && (
            <details className="card chart lanc-grafico" open>
              <summary>
                <strong>{grafico.porDia ? "Por dia de vencimento" : "Por mês de vencimento"}</strong>
                <span className="small muted">
                  {" "}· segue os filtros acima — {brl(grafico.total)} em {grafico.n} lançamento(s)
                  {grafico.fora > 0 && <> · {grafico.fora} antecipado(s) fora (já creditados)</>}
                </span>
              </summary>
              <Barras dados={grafico.dados} formatar={reais} />
            </details>
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
                {visiveis.map((l) => {
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
                        {l.forma_pagamento && (
                          <div className="small lanc-forma">
                            {l.forma_pagamento === "cartao_credito" && <Icone nome="cartao" tamanho={12} />}
                            {FORMAS_PAGAMENTO[l.forma_pagamento as keyof typeof FORMAS_PAGAMENTO] ?? l.forma_pagamento}
                            {l.cartao && ` · ${l.cartao}`}
                          </div>
                        )}
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
                        {l.antecipado_em && (
                          <div><span className="badge anunciado" title={`Antecipado em ${dataBR(l.antecipado_em)}: valor já creditado no banco`}>
                            Antecipado {dataBR(l.antecipado_em).slice(0, 5)}
                          </span></div>
                        )}
                      </td>
                      <td className="hide-sm small">
                        {l.nota_id && <Link href={`/notas/${l.nota_id}`}>NF {l.nota_numero ?? ""}</Link>}
                        {l.recorrencia_id && <span className="muted">Conta fixa</span>}
                        {!l.nota_id && !l.recorrencia_id && <span className="muted">—</span>}
                      </td>
                      <td className="num">
                        <div className="lanc-acoes">
                          {modoAnt && aberto && !l.antecipado_em && (
                            <button className="btn small" type="button" disabled={ocupado} onClick={() => setJanela({ tipo: "antecipar", ids: [l.id] })} title="Marcar como antecipado">
                              Antecipar
                            </button>
                          )}
                          {modoAnt && aberto && l.antecipado_em && (
                            <button className="btn small" type="button" disabled={ocupado} onClick={() => desfazerAntecipacao(l)} title="Desfazer antecipação">
                              <Icone nome="estorno" tamanho={14} />
                            </button>
                          )}
                          {aberto
                            ? <button className="btn small primary" type="button" disabled={ocupado} onClick={() => setJanela({ tipo: "baixa", ids: [l.id] })} title={l.antecipado_em ? "Cliente pagou: marcar como baixado" : "Dar baixa"}><Icone nome="ok" tamanho={14} /> Baixar</button>
                            : <button className="btn small" type="button" disabled={ocupado} onClick={() => estornar(l)} title="Estornar baixa">Estornar</button>}
                          <button className="btn small" type="button" data-abrir disabled={ocupado} onClick={() => setJanela({ tipo: "editar", l })} title="Editar" aria-label="Editar"><Icone nome="editar" tamanho={14} /></button>
                          <button className="btn small danger" type="button" disabled={ocupado} onClick={() => excluir(l)} title="Excluir" aria-label="Excluir"><Icone nome="lixo" tamanho={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!visiveis.length && (
                  <tr><td colSpan={10} className="muted" style={{ textAlign: "center", padding: "2rem" }}>Nenhum lançamento com esses filtros.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6}>{visiveis.length} lançamento(s)</td>
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
        <LancamentoModal titulo={janela.credito ? "Nova compra no cartão de crédito" : pagar ? "Nova conta a pagar" : "Nova conta a receber"} onFechar={fechar} largo>
          <LancamentoForm tipo={tipo} partes={partes} bancos={bancos} hoje={hoje} cartoes={cartoes} formaInicial={janela.credito ? "cartao_credito" : undefined} onSalvo={salvo} onCancelar={fechar} />
        </LancamentoModal>
      )}
      {janela?.tipo === "editar" && (
        <LancamentoModal titulo="Editar lançamento" onFechar={fechar} largo>
          <LancamentoForm tipo={tipo} lancamento={janela.l} partes={partes} bancos={bancos} hoje={hoje} cartoes={cartoes} onSalvo={salvo} onCancelar={fechar} />
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
      {janela?.tipo === "antecipar" && (
        <LancamentoModal titulo="Antecipação de boletos" onFechar={fechar}>
          <AntecipacaoForm
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
