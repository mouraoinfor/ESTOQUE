import type { Metadata } from "next";
import Link from "next/link";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { empresaAtual } from "@/lib/empresa";
import { brl, dataBR, formatarDocumento, hojeISO } from "@/lib/formato";
import BotaoImprimir from "@/components/orcamentos/BotaoImprimir";
import { prepararRecorrencias } from "@/components/financeiro/LancamentosDados";
import "@/app/(app)/orcamentos/orcamentos.css";
import "./relatorio.css";

export const dynamic = "force-dynamic";

const FUSO = "America/Sao_Paulo";
const DATA = /^\d{4}-\d{2}-\d{2}$/;

interface Conta {
  id: string;
  descricao: string;
  fornecedor: string | null;
  documento: string | null;
  observacoes: string | null;
  banco: string | null;
  vencimento: string;
  pago_em: string | null;
  valor: number;
}

export const metadata: Metadata = { title: "Contas a pagar do dia" };

function dataExtenso(iso: string) {
  return new Date(`${iso}T12:00:00-03:00`).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: FUSO,
  });
}

function Tabela({ contas, mostrarVenc, pagas }: { contas: Conta[]; mostrarVenc: boolean; pagas?: boolean }) {
  const total = contas.reduce((s, c) => s + c.valor, 0);
  return (
    <table className="orc-folha-itens rel-tabela">
      <thead>
        <tr>
          <th className="rel-check">{pagas ? "" : "Pago"}</th>
          {mostrarVenc && <th>Venc.</th>}
          <th>Descrição</th>
          <th>Fornecedor</th>
          <th>Banco</th>
          <th className="v">Valor</th>
        </tr>
      </thead>
      <tbody>
        {contas.map((c) => (
          <tr key={c.id}>
            <td className="rel-check">{pagas ? "✓" : <span className="rel-quadrado" />}</td>
            {mostrarVenc && <td className="rel-venc">{dataBR(c.vencimento).slice(0, 5)}</td>}
            <td>
              {c.descricao}
              {(c.documento || c.observacoes) && (
                <div className="rel-sub">{[c.documento && `Doc. ${c.documento}`, c.observacoes].filter(Boolean).join(" · ")}</div>
              )}
            </td>
            <td>{c.fornecedor ?? "—"}</td>
            <td>{c.banco ?? "—"}</td>
            <td className="v">{brl(c.valor)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={mostrarVenc ? 5 : 4}>{contas.length} {contas.length === 1 ? "conta" : "contas"}</td>
          <td className="v">{brl(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

// Relatório para imprimir: o que vence no dia (ou período), o que está vencido e o que já foi pago no dia
export default async function RelatorioPagar({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; ate?: string; vencidas?: string }>;
}) {
  await exigirAcesso("pagar");
  const p = await searchParams;
  const hoje = hojeISO();
  const de = p.data && DATA.test(p.data) ? p.data : hoje;
  const ate = p.ate && DATA.test(p.ate) && p.ate >= de ? p.ate : de;
  const incluirVencidas = p.vencidas !== "0";
  const umDia = de === ate;

  const { atual } = await empresaAtual();
  if (!atual) {
    return (
      <div className="orc-impressao">
        <div className="alert warn rel-largura">
          Nenhuma empresa cadastrada. <Link href="/financeiro/empresas">Cadastre a empresa (CNPJ)</Link> para usar o financeiro.
        </div>
      </div>
    );
  }
  await prepararRecorrencias(atual.id);

  const SELECT = `select l.id, l.descricao, coalesce(f.nome, fu.nome) as fornecedor, l.documento, l.observacoes, b.nome as banco,
                         l.vencimento::text as vencimento, l.pago_em::text as pago_em, l.valor
                    from lancamentos l
                    left join fornecedores f on f.id = l.fornecedor_id
                    left join funcionarios fu on fu.id = l.funcionario_id
                    left join bancos b on b.id = l.banco_id
                   where l.empresa_id = $1 and l.tipo = 'pagar'`;

  const [doDia, vencidas, pagas] = await Promise.all([
    query<Conta>(`${SELECT} and l.status = 'aberto' and l.vencimento between $2::date and $3::date order by l.vencimento, b.nome nulls last, l.valor desc`, [atual.id, de, ate]),
    incluirVencidas
      ? query<Conta>(`${SELECT} and l.status = 'aberto' and l.vencimento < $2::date order by l.vencimento, l.valor desc`, [atual.id, de])
      : Promise.resolve([] as Conta[]),
    query<Conta>(`${SELECT} and l.status = 'pago' and l.pago_em between $2::date and $3::date order by l.pago_em, l.valor desc`, [atual.id, de, ate]),
  ]);

  const soma = (lista: Conta[]) => lista.reduce((s, c) => s + c.valor, 0);
  const totalDia = soma(doDia);
  const totalVencidas = soma(vencidas);
  const aPagar = [...doDia, ...vencidas];

  // Quanto precisa ter em cada banco para cobrir o que está em aberto
  const porBanco = [...aPagar.reduce((m, c) => {
    const nome = c.banco ?? "Banco não definido";
    return m.set(nome, (m.get(nome) ?? 0) + c.valor);
  }, new Map<string, number>())].sort((a, b) => b[1] - a[1]);

  const periodo = umDia ? dataExtenso(de) : `${dataBR(de)} a ${dataBR(ate)}`;
  const geradoEm = new Date().toLocaleString("pt-BR", { timeZone: FUSO, dateStyle: "short", timeStyle: "short" });

  return (
    <div className="orc-impressao">
      <div className="orc-imp-barra">
        <Link className="btn" href="/financeiro/pagar">← Contas a pagar</Link>
        <form className="rel-filtro" method="get">
          <label>De <input type="date" name="data" defaultValue={de} /></label>
          <label>Até <input type="date" name="ate" defaultValue={umDia ? "" : ate} /></label>
          <label className="rel-opcao">
            <select name="vencidas" defaultValue={incluirVencidas ? "1" : "0"}>
              <option value="1">Com vencidas anteriores</option>
              <option value="0">Sem vencidas anteriores</option>
            </select>
          </label>
          <button className="btn" type="submit">Atualizar</button>
        </form>
        <BotaoImprimir />
      </div>

      <article className="orc-folha rel-folha">
        <header className="orc-folha-topo">
          <div className="orc-folha-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-amais.png" alt="A+ Com Engenharia e Tecnologia" />
          </div>
          <div className="orc-folha-num">
            <div className="orc-folha-titulo">CONTAS A PAGAR</div>
            <div className="rel-periodo">{periodo}</div>
            <div>Gerado em {geradoEm}</div>
          </div>
        </header>

        <p className="orc-folha-empresa">
          {atual.nome}{atual.documento && ` · CNPJ ${formatarDocumento(atual.documento)}`}
        </p>

        <section className="rel-resumo">
          <div>
            <div className="orc-folha-rotulo">{umDia ? (de === hoje ? "Vence hoje" : "Vence no dia") : "Vence no período"}</div>
            <div className="rel-num">{brl(totalDia)}</div>
          </div>
          {incluirVencidas && (
            <div>
              <div className="orc-folha-rotulo">Vencidas antes</div>
              <div className={`rel-num${totalVencidas > 0 ? " rel-alerta" : ""}`}>{brl(totalVencidas)}</div>
            </div>
          )}
          <div className="rel-destaque">
            <div className="orc-folha-rotulo">Total a pagar</div>
            <div className="rel-num">{brl(totalDia + totalVencidas)}</div>
          </div>
          {pagas.length > 0 && (
            <div>
              <div className="orc-folha-rotulo">Já pago {umDia ? "no dia" : "no período"}</div>
              <div className="rel-num">{brl(soma(pagas))}</div>
            </div>
          )}
        </section>

        <h2 className="rel-titulo">{umDia ? "Vencendo no dia" : "Vencendo no período"}</h2>
        {doDia.length
          ? <Tabela contas={doDia} mostrarVenc={!umDia} />
          : <p className="rel-vazio">Nenhuma conta em aberto vencendo {umDia ? "neste dia" : "neste período"}.</p>}

        {incluirVencidas && vencidas.length > 0 && (
          <>
            <h2 className="rel-titulo rel-alerta">Vencidas e ainda em aberto</h2>
            <Tabela contas={vencidas} mostrarVenc />
          </>
        )}

        {porBanco.length > 1 && (
          <>
            <h2 className="rel-titulo">Por banco</h2>
            <table className="orc-folha-itens rel-bancos">
              <tbody>
                {porBanco.map(([nome, valor]) => (
                  <tr key={nome}><td>{nome}</td><td className="v">{brl(valor)}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {pagas.length > 0 && (
          <>
            <h2 className="rel-titulo">Já pagas {umDia ? "no dia" : "no período"}</h2>
            <Tabela contas={pagas} mostrarVenc pagas />
          </>
        )}

        <footer className="orc-folha-rodape">
          Contas em aberto conforme o sistema em {geradoEm}. Marque o quadrado ao pagar e dê baixa no sistema.
        </footer>
      </article>
    </div>
  );
}
