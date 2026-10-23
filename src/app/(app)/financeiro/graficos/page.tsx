import Link from "next/link";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { empresaAtual } from "@/lib/empresa";
import { brl, hojeISO } from "@/lib/formato";
import { podeAcessar } from "@/lib/modulos";
import { Barras, ColunasAgrupadas, type Serie } from "@/components/Graficos";
import { prepararRecorrencias } from "@/components/financeiro/LancamentosDados";
import "../lancamentos.css";

export const dynamic = "force-dynamic";

const PERIODOS = [3, 6, 12] as const;
const reais = (v: number) => brl(Math.round(v)).replace(",00", "");
const COR_RECEBER = "var(--ok)";
const COR_PAGAR = "var(--danger)";

interface Mes {
  mes: string;
  receber: number;
  pagar: number;
}

// Gráficos do financeiro: realizado (baixas) no período e previsão do que está em aberto
export default async function GraficosFinanceiro({ searchParams }: { searchParams: Promise<{ meses?: string }> }) {
  const usuario = await exigirAcesso("fingraficos");
  const { atual } = await empresaAtual();
  if (!atual) {
    return (
      <>
        <h1>Gráficos do financeiro</h1>
        <div className="alert warn">
          Nenhuma empresa cadastrada. <Link href="/financeiro/empresas">Cadastre a empresa (CNPJ)</Link> para usar o financeiro.
        </div>
      </>
    );
  }
  const vePagar = podeAcessar(usuario, "pagar");
  const veReceber = podeAcessar(usuario, "receber");
  const pedido = Number((await searchParams).meses);
  const meses = PERIODOS.find((p) => p === pedido) ?? 6;
  const hoje = hojeISO();
  const empresaId = atual.id;

  await prepararRecorrencias(empresaId);

  // Início do período: 1º dia do mês, (meses - 1) meses atrás
  const INICIO = `date_trunc('month', $2::date) - make_interval(months => $3::int - 1)`;

  const [realizado, previsto, [resumo], fornecedores, clientes, origens] = await Promise.all([
    query<Mes>(
      `select to_char(m.mes, 'MM/YY') as mes,
              coalesce(sum(l.valor) filter (where l.tipo = 'receber'), 0) as receber,
              coalesce(sum(l.valor) filter (where l.tipo = 'pagar'), 0) as pagar
         from generate_series(${INICIO}, date_trunc('month', $2::date), interval '1 month') as m(mes)
         left join lancamentos l
           on l.empresa_id = $1 and l.status = 'pago'
          and l.pago_em >= m.mes and l.pago_em < m.mes + interval '1 month'
        group by m.mes order by m.mes`,
      [empresaId, hoje, meses]
    ),
    // Em aberto: vencidos numa coluna só, depois este mês e os 5 seguintes
    query<Mes>(
      `select mes, receber, pagar from (
         select null::date as ordem, 'Vencidos' as mes,
                coalesce(sum(valor) filter (where tipo = 'receber'), 0) as receber,
                coalesce(sum(valor) filter (where tipo = 'pagar'), 0) as pagar
           from lancamentos where empresa_id = $1 and status = 'aberto' and vencimento < $2::date
         union all
         select m.mes::date, to_char(m.mes, 'MM/YY'),
                coalesce(sum(l.valor) filter (where l.tipo = 'receber'), 0),
                coalesce(sum(l.valor) filter (where l.tipo = 'pagar'), 0)
           from generate_series(date_trunc('month', $2::date), date_trunc('month', $2::date) + interval '5 months', interval '1 month') as m(mes)
           left join lancamentos l
             on l.empresa_id = $1 and l.status = 'aberto' and l.vencimento >= $2::date
            and l.vencimento >= m.mes and l.vencimento < m.mes + interval '1 month'
          group by m.mes
       ) p order by ordem nulls first`,
      [empresaId, hoje]
    ),
    query<{ receber: number; pagar: number; aberto_receber: number; aberto_pagar: number }>(
      `select coalesce(sum(valor) filter (where tipo = 'receber' and status = 'pago' and pago_em >= ${INICIO}), 0) as receber,
              coalesce(sum(valor) filter (where tipo = 'pagar' and status = 'pago' and pago_em >= ${INICIO}), 0) as pagar,
              coalesce(sum(valor) filter (where tipo = 'receber' and status = 'aberto'), 0) as aberto_receber,
              coalesce(sum(valor) filter (where tipo = 'pagar' and status = 'aberto'), 0) as aberto_pagar
         from lancamentos where empresa_id = $1`,
      [empresaId, hoje, meses]
    ),
    vePagar
      ? query<{ nome: string; valor: number }>(
          `select coalesce(f.nome, 'Sem fornecedor') as nome, sum(l.valor) as valor
             from lancamentos l left join fornecedores f on f.id = l.fornecedor_id
            where l.empresa_id = $1 and l.tipo = 'pagar' and l.status = 'pago' and l.pago_em >= ${INICIO}
            group by 1 order by valor desc limit 10`,
          [empresaId, hoje, meses]
        )
      : Promise.resolve([]),
    veReceber
      ? query<{ nome: string; valor: number }>(
          `select coalesce(c.nome, 'Sem cliente') as nome, sum(l.valor) as valor
             from lancamentos l left join clientes c on c.id = l.cliente_id
            where l.empresa_id = $1 and l.tipo = 'receber' and l.status = 'pago' and l.pago_em >= ${INICIO}
            group by 1 order by valor desc limit 10`,
          [empresaId, hoje, meses]
        )
      : Promise.resolve([]),
    vePagar
      ? query<{ nome: string; valor: number }>(
          `select case when recorrencia_id is not null then 'Contas fixas'
                       when nota_id is not null then 'Notas fiscais (compras)'
                       else 'Lançamentos avulsos' end as nome,
                  sum(valor) as valor
             from lancamentos
            where empresa_id = $1 and tipo = 'pagar' and status = 'pago' and pago_em >= ${INICIO}
            group by 1 order by valor desc`,
          [empresaId, hoje, meses]
        )
      : Promise.resolve([]),
  ]);

  // Só as séries que o usuário pode ver
  const series: (Serie & { campo: "receber" | "pagar" })[] = [
    ...(veReceber ? [{ nome: "Recebido", cor: COR_RECEBER, campo: "receber" as const }] : []),
    ...(vePagar ? [{ nome: "Pago", cor: COR_PAGAR, campo: "pagar" as const }] : []),
  ];
  const seriesPrevisto = series.map((s) => ({ ...s, nome: s.campo === "receber" ? "A receber" : "A pagar" }));
  const agrupar = (lista: Mes[]) => lista.map((m) => ({ rotulo: m.mes, valores: series.map((s) => m[s.campo]) }));
  const resultado = resumo.receber - resumo.pagar;
  const ambos = vePagar && veReceber;

  return (
    <div className="lanc">
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1.1rem" }}>
        <h1 style={{ margin: 0 }}>Gráficos do financeiro <span className="muted small" style={{ fontWeight: 600 }}>· {atual.nome}</span></h1>
        <div className="tabs fin-graf-periodo">
          {PERIODOS.map((p) => (
            <Link key={p} className={`btn small${p === meses ? " active" : ""}`} href={`/financeiro/graficos?meses=${p}`}>
              {p} meses
            </Link>
          ))}
        </div>
      </div>

      {!series.length && <div className="alert warn">Seu usuário não tem acesso a contas a pagar nem a receber. Peça ao administrador.</div>}

      {series.length > 0 && (
        <>
          <div className="stats">
            {veReceber && <div className="stat lanc-stat-ok"><div className="label">Recebido em {meses} meses</div><div className="value">{brl(resumo.receber)}</div></div>}
            {vePagar && <div className="stat lanc-stat-perigo"><div className="label">Pago em {meses} meses</div><div className="value">{brl(resumo.pagar)}</div></div>}
            {ambos && <div className="stat"><div className="label">Resultado do período</div><div className={`value ${resultado < 0 ? "fin-neg" : "fin-pos"}`}>{brl(resultado)}</div></div>}
            {vePagar && <div className="stat"><div className="label">Média de despesas por mês</div><div className="value">{brl(resumo.pagar / meses)}</div></div>}
          </div>

          <div className="charts">
            <section className="card chart">
              <h2>{ambos ? "Entradas × saídas por mês" : series[0].campo === "receber" ? "Recebido por mês" : "Pago por mês"}</h2>
              <p className="sub">Contas baixadas, pela data do pagamento — últimos {meses} meses</p>
              <ColunasAgrupadas dados={agrupar(realizado)} series={series} formatar={reais} />
            </section>

            <section className="card chart">
              <h2>Previsão do que está em aberto</h2>
              <p className="sub">Pelo vencimento: vencidos e os próximos 6 meses</p>
              <ColunasAgrupadas dados={agrupar(previsto)} series={seriesPrevisto} formatar={reais} />
            </section>

            {vePagar && (
              <section className="card chart">
                <h2>Despesas por fornecedor</h2>
                <p className="sub">Os 10 maiores pagamentos do período</p>
                <Barras dados={fornecedores.map((d) => ({ rotulo: d.nome, valor: d.valor }))} formatar={reais} />
              </section>
            )}

            {veReceber && (
              <section className="card chart">
                <h2>Receitas por cliente</h2>
                <p className="sub">Os 10 maiores recebimentos do período</p>
                <Barras dados={clientes.map((d) => ({ rotulo: d.nome, valor: d.valor }))} formatar={reais} />
              </section>
            )}

            {vePagar && (
              <section className="card chart">
                <h2>Despesas por origem</h2>
                <p className="sub">Contas fixas, compras com nota fiscal e lançamentos avulsos pagos no período</p>
                <Barras dados={origens.map((d) => ({ rotulo: d.nome, valor: d.valor }))} formatar={reais} />
              </section>
            )}

            <section className="card chart">
              <h2>Mês a mês</h2>
              <p className="sub">Valores exatos do período</p>
              <div className="table-wrap" style={{ boxShadow: "none" }}>
                <table className="fin-tabela-mes">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      {veReceber && <th className="v">Recebido</th>}
                      {vePagar && <th className="v">Pago</th>}
                      {ambos && <th className="v">Resultado</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {realizado.map((m) => (
                      <tr key={m.mes}>
                        <td>{m.mes}</td>
                        {veReceber && <td className="v">{brl(m.receber)}</td>}
                        {vePagar && <td className="v">{brl(m.pagar)}</td>}
                        {ambos && <td className={`v ${m.receber - m.pagar < 0 ? "fin-neg" : "fin-pos"}`}>{brl(m.receber - m.pagar)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {ambos && (
            <p className="muted small" style={{ marginTop: "1rem" }}>
              Em aberto hoje: a receber {brl(resumo.aberto_receber)} · a pagar {brl(resumo.aberto_pagar)}.
            </p>
          )}
        </>
      )}
    </div>
  );
}
