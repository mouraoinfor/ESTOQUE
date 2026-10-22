import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl, CONDICAO_LABEL, STATUS_LABEL, type Condicao, type Status } from "@/lib/types";
import { Barras, Colunas } from "@/components/Graficos";

export const dynamic = "force-dynamic";

// Preço usado em todos os cálculos: o de venda definido, senão o sugerido
const PRECO = "coalesce(preco_venda, preco_sugerido, 0)";
const EM_ESTOQUE = "status <> 'vendido'";

const inteiro = (v: number) => v.toLocaleString("pt-BR");
const reais = (v: number) => brl(Math.round(v)).replace(",00", "");

export default async function Graficos() {
  await exigirAcesso("graficos");
  const [[resumo], porCategoria, porStatus, porCondicao, top, porMes] = await Promise.all([
    query<{ itens: number; unidades: number; valor_total: number; valor_venda: number; sem_preco: number }>(
      `select count(*)::int as itens,
              coalesce(sum(quantidade), 0)::int as unidades,
              coalesce(sum(${PRECO} * quantidade) filter (where ${EM_ESTOQUE}), 0) as valor_total,
              coalesce(sum(${PRECO} * quantidade) filter (where ${EM_ESTOQUE} and para_venda), 0) as valor_venda,
              count(*) filter (where ${PRECO} = 0)::int as sem_preco
         from produtos`
    ),
    query<{ categoria: string; valor: number; unidades: number }>(
      `select coalesce(categoria, 'Sem categoria') as categoria,
              coalesce(sum(${PRECO} * quantidade), 0) as valor,
              coalesce(sum(quantidade), 0)::int as unidades
         from produtos where ${EM_ESTOQUE}
        group by 1 order by valor desc`
    ),
    query<{ status: Status; n: number }>("select status, count(*)::int as n from produtos group by 1 order by n desc"),
    query<{ condicao: Condicao; valor: number; unidades: number }>(
      `select condicao, coalesce(sum(${PRECO} * quantidade), 0) as valor, coalesce(sum(quantidade), 0)::int as unidades
         from produtos where ${EM_ESTOQUE} group by 1 order by valor desc`
    ),
    query<{ id: string; codigo: number; nome: string; valor: number }>(
      `select id, codigo, nome, ${PRECO} * quantidade as valor
         from produtos where ${EM_ESTOQUE} order by valor desc limit 10`
    ),
    query<{ mes: string; n: number }>(
      `select to_char(date_trunc('month', created_at), 'MM/YY') as mes, count(*)::int as n
         from movimentacoes
        where created_at >= date_trunc('month', now()) - interval '5 months'
        group by date_trunc('month', created_at), 1 order by date_trunc('month', created_at)`
    ),
  ]);

  return (
    <>
      <h1>Gráficos</h1>
      <div className="stats">
        <div className="stat"><div className="label">Valor total do estoque</div><div className="value">{reais(resumo.valor_total)}</div></div>
        <div className="stat"><div className="label">Valor dos itens à venda</div><div className="value">{reais(resumo.valor_venda)}</div></div>
        <div className="stat"><div className="label">Unidades em estoque</div><div className="value">{inteiro(resumo.unidades)}</div></div>
        <div className="stat"><div className="label">Itens cadastrados</div><div className="value">{inteiro(resumo.itens)}</div></div>
      </div>
      {resumo.sem_preco > 0 && (
        <div className="alert warn">{resumo.sem_preco} {resumo.sem_preco === 1 ? "item está" : "itens estão"} sem preço e não entram nos valores.</div>
      )}

      <div className="charts">
        <section className="card chart">
          <h2>Valor do estoque por categoria</h2>
          <p className="sub">Preço × quantidade, sem os vendidos</p>
          <Barras dados={porCategoria.map((c) => ({ rotulo: c.categoria, valor: c.valor }))} formatar={reais} />
        </section>

        <section className="card chart">
          <h2>Unidades por categoria</h2>
          <p className="sub">Quantidade em estoque</p>
          <Barras
            dados={[...porCategoria].sort((a, b) => b.unidades - a.unidades).map((c) => ({ rotulo: c.categoria, valor: c.unidades }))}
            formatar={inteiro}
          />
        </section>

        <section className="card chart">
          <h2>10 itens de maior valor</h2>
          <p className="sub">Preço × quantidade</p>
          <Barras dados={top.map((t) => ({ rotulo: `#${t.codigo} ${t.nome}`, valor: t.valor, href: `/itens/${t.id}` }))} formatar={reais} />
        </section>

        <section className="card chart">
          <h2>Itens por status</h2>
          <p className="sub">Andamento dos anúncios</p>
          <Barras dados={porStatus.map((s) => ({ rotulo: STATUS_LABEL[s.status] ?? s.status, valor: s.n }))} formatar={inteiro} />
        </section>

        <section className="card chart">
          <h2>Novo × usado</h2>
          <p className="sub">Valor em estoque por condição</p>
          <Barras
            dados={porCondicao.map((c) => ({ rotulo: `${CONDICAO_LABEL[c.condicao] ?? c.condicao} (${c.unidades} un.)`, valor: c.valor }))}
            formatar={reais}
          />
        </section>

        <section className="card chart">
          <h2>Movimentações por mês</h2>
          <p className="sub">Entradas, saídas, vendas e ajustes — últimos 6 meses</p>
          <Colunas dados={porMes.map((m) => ({ rotulo: m.mes, valor: m.n }))} formatar={inteiro} />
        </section>
      </div>
    </>
  );
}
