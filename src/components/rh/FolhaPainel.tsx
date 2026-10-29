"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adicionarItemFolha, gerarFolha, removerItemFolha, salvarFolha, salvarObservacoesMes } from "@/app/acoes-rh";
import { brl } from "@/lib/formato";
import Icone from "@/components/Icone";
import { DIAS_PADRAO, arred, mesParam, nomeMes, somarMeses, totaisFolha, type Funcionario, type ItemFolha, type ItemFolhaEdicao } from "./rh-util";

type Campo = "salario" | "comissao" | "desconto" | "dias" | "vr" | "vt" | "va";
const CAMPOS_VALOR: Campo[] = ["salario", "comissao", "desconto", "dias", "vr", "vt", "va"];

// Linha em edição: números como texto para permitir digitar livremente
interface Linha {
  id: string;
  funcionario_id: string | null;
  nome: string;
  funcao: string | null;
  valores: Record<Campo, string>;
  desconto_descricao: string;
  observacoes: string;
  pago: boolean;
}

type Resumo = Pick<Funcionario, "id" | "nome" | "funcao" | "ativo" | "vr_dia" | "vt_dia">;

function paraLinha(i: ItemFolha): Linha {
  const valores = {} as Record<Campo, string>;
  for (const c of CAMPOS_VALOR) valores[c] = i[c] === null || i[c] === undefined ? "" : String(i[c]);
  return {
    id: i.id,
    funcionario_id: i.funcionario_id,
    nome: i.nome,
    funcao: i.funcao,
    valores,
    desconto_descricao: i.desconto_descricao ?? "",
    observacoes: i.observacoes ?? "",
    pago: i.pago,
  };
}

const n = (s: string) => {
  const v = Number(s.replace(",", "."));
  return Number.isFinite(v) ? v : 0;
};

const assinatura = (l: Linha) => JSON.stringify([l.valores, l.desconto_descricao.trim(), l.observacoes.trim(), l.pago]);

export default function FolhaPainel({
  competencia,
  meses,
  proximo,
  itens,
  observacoes,
  funcionarios,
  faltas,
}: {
  competencia: string;
  meses: string[];
  proximo: string;
  itens: ItemFolha[];
  observacoes: string;
  funcionarios: Resumo[];
  faltas: Record<string, number>; // dias de falta no mês desta folha, por funcionário
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error" | "warn"; texto: string } | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>(() => itens.map(paraLinha));
  const [notas, setNotas] = useState(observacoes);
  const [novoFuncionario, setNovoFuncionario] = useState("");
  const [novoNome, setNovoNome] = useState("");

  // Quando o servidor devolve dados novos: depois de gravar recarrega tudo; depois de
  // adicionar/remover linha mantém o que ainda está sendo editado nas outras linhas
  const recarregar = useRef(false);
  const originais = useMemo(() => new Map(itens.map((i) => [i.id, assinatura(paraLinha(i))])), [itens]);
  useEffect(() => {
    const tudo = recarregar.current;
    recarregar.current = false;
    setLinhas((atuais) => {
      const locais = new Map(atuais.map((l) => [l.id, l]));
      return itens.map((i) => (!tudo && locais.get(i.id)) || paraLinha(i));
    });
  }, [itens]);
  useEffect(() => setNotas(observacoes), [observacoes]);

  const alteradas = linhas.filter((l) => originais.get(l.id) !== assinatura(l));
  const notasAlteradas = notas.trim() !== observacoes.trim();
  const porId = useMemo(() => new Map(funcionarios.map((f) => [f.id, f])), [funcionarios]);
  const naFolha = new Set(linhas.map((l) => l.funcionario_id).filter(Boolean));
  const disponiveis = funcionarios.filter((f) => !naFolha.has(f.id));

  const t = totaisFolha(linhas.map((l) => ({
    salario: n(l.valores.salario), comissao: n(l.valores.comissao), desconto: n(l.valores.desconto),
    vr: n(l.valores.vr), vt: n(l.valores.vt), va: n(l.valores.va),
  })));
  const pagos = linhas.filter((l) => l.pago).length;

  // Lista de meses do seletor: os que têm folha + o próximo + o atual (se for um mês vazio)
  const opcoes = Array.from(new Set([proximo, competencia, ...meses])).sort().reverse();
  const vazio = itens.length === 0;
  const alvoGerar = vazio ? competencia : competencia === meses[0] ? proximo : null;

  // Linhas cujos dias não batem com 22 - faltas do mês (folha gerada antes de lançar a falta)
  const mesFaltas = nomeMes(competencia);
  const diasCertos = (l: Linha) => Math.max(DIAS_PADRAO - (faltas[l.funcionario_id ?? ""] ?? 0), 0);
  const semFaltasAplicadas = linhas.filter((l) => l.funcionario_id && faltas[l.funcionario_id] && n(l.valores.dias) !== diasCertos(l));
  function aplicarFaltas() {
    for (const l of semFaltasAplicadas) mudarValor(l, "dias", String(diasCertos(l)));
  }

  function irPara(comp: string) {
    if ((alteradas.length || notasAlteradas) && !confirm("Há alterações não salvas neste mês. Sair mesmo assim?")) return;
    router.push(`/rh/folha?mes=${mesParam(comp)}`);
  }

  function mudar(id: string, alterar: (l: Linha) => Linha) {
    setLinhas((ls) => ls.map((l) => (l.id === id ? alterar(l) : l)));
  }

  function mudarValor(l: Linha, campo: Campo, valor: string) {
    mudar(l.id, (x) => {
      const valores = { ...x.valores, [campo]: valor };
      // Mudou os dias: recalcula VR e VT pelo valor diário do cadastro
      const f = x.funcionario_id ? porId.get(x.funcionario_id) : undefined;
      if (campo === "dias" && f && valor.trim() !== "") {
        const dias = n(valor);
        if (f.vr_dia > 0) valores.vr = String(arred(f.vr_dia * dias));
        if (f.vt_dia > 0) valores.vt = String(arred(f.vt_dia * dias));
      }
      return { ...x, valores };
    });
  }

  function salvar() {
    const dados: ItemFolhaEdicao[] = alteradas.map((l) => ({
      id: l.id,
      salario: n(l.valores.salario),
      comissao: n(l.valores.comissao),
      desconto: n(l.valores.desconto),
      dias: l.valores.dias.trim() === "" ? null : Number(l.valores.dias),
      vr: n(l.valores.vr),
      vt: n(l.valores.vt),
      va: n(l.valores.va),
      desconto_descricao: l.desconto_descricao,
      observacoes: l.observacoes,
      pago: l.pago,
    }));
    iniciar(async () => {
      const r = await salvarFolha(competencia, dados);
      if ("erro" in r) return setAviso({ tipo: "error", texto: r.erro });
      setAviso({ tipo: "ok", texto: `${r.ok} linha(s) salva(s).` });
      recarregar.current = true;
      router.refresh();
    });
  }

  function gerar(alvo: string) {
    if (!confirm(`Gerar a folha de ${nomeMes(alvo)} com todos os funcionários ativos (valores do cadastro, ${DIAS_PADRAO} dias menos as faltas de ${nomeMes(alvo)})? Ela é paga em ${nomeMes(somarMeses(alvo, 1))}.`)) return;
    iniciar(async () => {
      const r = await gerarFolha(alvo);
      if ("erro" in r) return setAviso({ tipo: "error", texto: r.erro });
      setAviso({ tipo: "ok", texto: `Folha de ${nomeMes(alvo)} gerada com ${r.ok} funcionário(s).` });
      if (alvo === competencia) router.refresh();
      else router.push(`/rh/folha?mes=${mesParam(alvo)}`);
    });
  }

  function adicionar() {
    const avulso = novoFuncionario === "avulso";
    if (!novoFuncionario || (avulso && !novoNome.trim())) {
      return setAviso({ tipo: "warn", texto: avulso ? "Informe o nome da linha avulsa." : "Escolha um funcionário para adicionar." });
    }
    iniciar(async () => {
      const r = await adicionarItemFolha(competencia, avulso ? null : novoFuncionario, novoNome);
      if ("erro" in r) return setAviso({ tipo: "error", texto: r.erro });
      setAviso({ tipo: "ok", texto: "Linha adicionada." });
      setNovoFuncionario("");
      setNovoNome("");
      router.refresh();
    });
  }

  function remover(l: Linha) {
    if (!confirm(`Remover ${l.nome} da folha de ${nomeMes(competencia)}?`)) return;
    iniciar(async () => {
      const r = await removerItemFolha(l.id);
      if ("erro" in r) return setAviso({ tipo: "error", texto: r.erro });
      setAviso({ tipo: "ok", texto: `${l.nome} removido da folha.` });
      router.refresh();
    });
  }

  function salvarNotas() {
    iniciar(async () => {
      const r = await salvarObservacoesMes(competencia, notas);
      if ("erro" in r) return setAviso({ tipo: "error", texto: r.erro });
      setAviso({ tipo: "ok", texto: "Anotações do mês salvas." });
      router.refresh();
    });
  }

  const marcarTodos = (pago: boolean) => setLinhas((ls) => ls.map((l) => ({ ...l, pago })));
  const indice = meses.indexOf(competencia);

  return (
    <>
      <div className="card rh-barra-mes">
        <div className="actions">
          <button className="btn small" type="button" title="Mês anterior" onClick={() => irPara(somarMeses(competencia, -1))}>
            <Icone nome="cima" tamanho={14} className="rh-seta-esq" />
          </button>
          <select value={competencia} onChange={(e) => irPara(e.target.value)} aria-label="Mês da folha">
            {opcoes.map((m) => (
              <option key={m} value={m}>
                {nomeMes(m)} · paga em {nomeMes(somarMeses(m, 1))}{meses.includes(m) ? "" : " (sem folha)"}
              </option>
            ))}
          </select>
          <button className="btn small" type="button" title="Próximo mês" onClick={() => irPara(somarMeses(competencia, 1))}>
            <Icone nome="cima" tamanho={14} className="rh-seta-dir" />
          </button>
          {indice > 0 && <button className="btn small" type="button" onClick={() => irPara(meses[0])}>Ir para o último mês</button>}
        </div>
        {alvoGerar && (
          <button className="btn primary" type="button" disabled={pendente} onClick={() => gerar(alvoGerar)}>
            <Icone nome="novo" tamanho={16} /> Gerar folha de {nomeMes(alvoGerar)}
          </button>
        )}
      </div>

      {aviso && <div className={`alert ${aviso.tipo}`}>{aviso.texto}</div>}

      {vazio ? (
        <div className="alert warn">
          Ainda não há folha para {nomeMes(competencia)} (paga em {nomeMes(somarMeses(competencia, 1))}). Gere a partir do cadastro dos funcionários ativos ou adicione as linhas uma a uma.
        </div>
      ) : (
        <div className="stats">
          <div className="stat"><div className="label">Bruto (salário + comissão)</div><div className="value">{brl(t.bruto)}</div></div>
          <div className="stat"><div className="label">Descontos</div><div className="value">{brl(t.descontos)}</div></div>
          <div className="stat"><div className="label">Líquido</div><div className="value">{brl(t.liquido)}</div></div>
          <div className="stat"><div className="label">Benefícios (VR + VT + VA)</div><div className="value">{brl(t.vr + t.vt + t.va)}</div></div>
          <div className="stat"><div className="label">Total geral</div><div className="value">{brl(t.geral)}</div></div>
          <div className="stat"><div className="label">Pagos</div><div className="value">{pagos}/{linhas.length}</div></div>
        </div>
      )}

      {!vazio && semFaltasAplicadas.length > 0 && (
        <div className="alert warn rh-faltas-aviso">
          {semFaltasAplicadas.length} funcionário(s) com faltas em {mesFaltas} ainda sem o desconto nos dias de VR/VT desta folha.
          <button type="button" className="btn small" onClick={aplicarFaltas}>Aplicar faltas</button>
          <span className="small muted">Depois clique em Salvar alterações. O salário e o VA não mudam.</span>
        </div>
      )}

      {!vazio && (
        <div className="table-wrap rh-folha">
          <table>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th className="num">Salário</th>
                <th className="num">Comissão</th>
                <th className="num">Desconto</th>
                <th>Motivo do desconto</th>
                <th className="num">Dias</th>
                <th className="num">VR</th>
                <th className="num">VT</th>
                <th className="num">VA</th>
                <th className="num">Líquido</th>
                <th>Pago</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const liq = n(l.valores.salario) + n(l.valores.comissao) - n(l.valores.desconto);
                const sujo = originais.get(l.id) !== assinatura(l);
                return (
                  <tr key={l.id} className={sujo ? "rh-alterada" : undefined}>
                    <td className="rh-col-nome">
                      {l.funcionario_id ? <Link href={`/rh/${l.funcionario_id}`}><strong>{l.nome}</strong></Link> : <strong>{l.nome}</strong>}
                      {l.funcao && <span className="muted small"> · {l.funcao}</span>}
                      <input
                        type="text"
                        className="rh-obs"
                        placeholder="Observação"
                        value={l.observacoes}
                        onChange={(e) => mudar(l.id, (x) => ({ ...x, observacoes: e.target.value }))}
                      />
                    </td>
                    {(["salario", "comissao", "desconto"] as const).map((c) => (
                      <td key={c} className="num">
                        <input type="number" min={0} step="0.01" value={l.valores[c]} onChange={(e) => mudarValor(l, c, e.target.value)} aria-label={c} />
                      </td>
                    ))}
                    <td>
                      <input
                        type="text"
                        className="rh-desc-input"
                        placeholder="—"
                        value={l.desconto_descricao}
                        onChange={(e) => mudar(l.id, (x) => ({ ...x, desconto_descricao: e.target.value }))}
                      />
                    </td>
                    <td className="num">
                      <input type="number" min={0} max={31} step={1} className="rh-dias" value={l.valores.dias} onChange={(e) => mudarValor(l, "dias", e.target.value)} aria-label="dias" />
                      {l.funcionario_id && faltas[l.funcionario_id] ? (
                        <div className="small rh-faltas" title={`Faltas em ${mesFaltas}: abatem dias de VR e VT`}>{faltas[l.funcionario_id]} falta(s)</div>
                      ) : null}
                    </td>
                    {(["vr", "vt", "va"] as const).map((c) => (
                      <td key={c} className="num">
                        <input type="number" min={0} step="0.01" value={l.valores[c]} onChange={(e) => mudarValor(l, c, e.target.value)} aria-label={c} />
                      </td>
                    ))}
                    <td className="num"><strong>{brl(liq)}</strong></td>
                    <td>
                      <label className="check rh-pago">
                        <input type="checkbox" checked={l.pago} onChange={(e) => mudar(l.id, (x) => ({ ...x, pago: e.target.checked }))} />
                        <span>{l.pago ? "Pago" : "Não"}</span>
                      </label>
                    </td>
                    <td>
                      <button className="btn small danger" type="button" title="Remover linha" disabled={pendente} onClick={() => remover(l)}>
                        <Icone nome="lixo" tamanho={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="rh-total">
                <td>Total ({linhas.length})</td>
                <td className="num">{brl(linhas.reduce((s, l) => s + n(l.valores.salario), 0))}</td>
                <td className="num">{brl(linhas.reduce((s, l) => s + n(l.valores.comissao), 0))}</td>
                <td className="num">{brl(t.descontos)}</td>
                <td />
                <td />
                <td className="num">{brl(t.vr)}</td>
                <td className="num">{brl(t.vt)}</td>
                <td className="num">{brl(t.va)}</td>
                <td className="num">{brl(t.liquido)}</td>
                <td colSpan={2} className="num">Geral {brl(t.geral)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {!vazio && (
        <div className="actions rh-salvar">
          <button className="btn primary" type="button" disabled={pendente || !alteradas.length} onClick={salvar}>
            <Icone nome="ok" tamanho={16} /> Salvar alterações{alteradas.length ? ` (${alteradas.length})` : ""}
          </button>
          {alteradas.length > 0 && (
            <button className="btn" type="button" disabled={pendente} onClick={() => setLinhas(itens.map(paraLinha))}>Descartar</button>
          )}
          <button className="btn small" type="button" onClick={() => marcarTodos(true)}>Marcar todos como pagos</button>
          <button className="btn small" type="button" onClick={() => marcarTodos(false)}>Desmarcar todos</button>
        </div>
      )}

      <div className="rh-folha-baixo">
        <section className="card">
          <h2>Adicionar linha</h2>
          <div className="actions rh-adicionar">
            <select value={novoFuncionario} onChange={(e) => setNovoFuncionario(e.target.value)} aria-label="Funcionário">
              <option value="">Escolha o funcionário...</option>
              <optgroup label="Ativos">
                {disponiveis.filter((f) => f.ativo).map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </optgroup>
              <optgroup label="Desligados">
                {disponiveis.filter((f) => !f.ativo).map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </optgroup>
              <option value="avulso">Outro (linha avulsa)</option>
            </select>
            {novoFuncionario === "avulso" && (
              <input type="text" placeholder="Nome" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
            )}
            <button className="btn" type="button" disabled={pendente} onClick={adicionar}>
              <Icone nome="novo" tamanho={16} /> Adicionar
            </button>
          </div>
          <p className="muted small rh-nota">Funcionário do cadastro entra com salário, VA e VR/VT de 22 dias menos as faltas de {mesFaltas}.</p>
        </section>

        <section className="card">
          <h2>Anotações do mês</h2>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Vales, descontos combinados, datas de pagamento..." />
          <div className="actions rh-salvar">
            <button className="btn" type="button" disabled={pendente || !notasAlteradas} onClick={salvarNotas}>
              <Icone nome="ok" tamanho={16} /> Salvar anotações
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
