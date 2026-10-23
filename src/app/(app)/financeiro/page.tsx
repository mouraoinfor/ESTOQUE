import Link from "next/link";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { empresaAtual } from "@/lib/empresa";
import { bancosComSaldo, type BancoComSaldo, type TipoLancamento } from "@/lib/financeiro";
import { brl, dataBR, hojeISO } from "@/lib/formato";
import { podeAcessar } from "@/lib/modulos";
import { Barras, Colunas } from "@/components/Graficos";
import Icone from "@/components/Icone";
import { prepararRecorrencias } from "@/components/financeiro/LancamentosDados";
import { somarDias } from "@/components/financeiro/LancamentosUtil";
import "./lancamentos.css";

export const dynamic = "force-dynamic";

interface Vencimento {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  parte_nome: string | null;
  vencimento: string;
  valor: number;
}

const reais = (v: number) => brl(Math.round(v)).replace(",00", "");

function porMes(empresaId: string, tipo: TipoLancamento, hoje: string) {
  return query<{ mes: string; valor: number }>(
    `select to_char(m.mes, 'MM/YY') as mes, coalesce(sum(l.valor), 0) as valor
       from generate_series(date_trunc('month', $3::date) - interval '5 months', date_trunc('month', $3::date), interval '1 month') as m(mes)
       left join lancamentos l
         on l.empresa_id = $1 and l.tipo = $2 and l.status = 'pago'
        and l.pago_em >= m.mes and l.pago_em < m.mes + interval '1 month'
      group by m.mes order by m.mes`,
    [empresaId, tipo, hoje]
  );
}

function ListaVencimentos({ itens, hoje, vazio }: { itens: Vencimento[]; hoje: string; vazio: string }) {
  if (!itens.length) return <p className="muted small">{vazio}</p>;
  return (
    <ul className="fin-lista">
      {itens.map((v) => (
        <li key={v.id}>
          <span className={`data small${v.vencimento < hoje ? " vencido" : ""}`}>{v.vencimento === hoje ? "Hoje" : dataBR(v.vencimento).slice(0, 5)}</span>
          <span className="principal">
            <Link href={`/financeiro/${v.tipo}${v.vencimento < hoje ? "?status=vencidos" : ""}`}>{v.descricao}</Link>
            {v.parte_nome && <span className="small muted"> · {v.parte_nome}</span>}
          </span>
          <span className={`badge ${v.tipo === "pagar" ? "baixa" : "novo"}`}>{v.tipo === "pagar" ? "Pagar" : "Receber"}</span>
          <span className={`valor ${v.tipo === "pagar" ? "fin-neg" : "fin-pos"}`}>{v.tipo === "pagar" ? "−" : "+"}{brl(v.valor)}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function VisaoGeral() {
  const usuario = await exigirAcesso("financeiro");
  const { atual } = await empresaAtual();
  if (!atual) {
    return (
      <>
        <h1>Financeiro</h1>
        <div className="alert warn">
          Nenhuma empresa cadastrada. <Link href="/financeiro/empresas">Cadastre a empresa (CNPJ)</Link> para usar o financeiro.
        </div>
      </>
    );
  }
  const vePagar = podeAcessar(usuario, "pagar");
  const veReceber = podeAcessar(usuario, "receber");
  const veBancos = podeAcessar(usuario, "bancos");
  const tipos: TipoLancamento[] = [...(vePagar ? ["pagar" as const] : []), ...(veReceber ? ["receber" as const] : [])];
  const hoje = hojeISO();
  const empresaId = atual.id;

  await prepararRecorrencias(empresaId);

  const SELECT_VENC = `select l.id, l.tipo, l.descricao, coalesce(f.nome, c.nome) as parte_nome, l.vencimento::text as vencimento, l.valor
      from lancamentos l
      left join fornecedores f on f.id = l.fornecedor_id
      left join clientes c on c.id = l.cliente_id
     where l.empresa_id = $1 and l.tipo = any($2::text[]) and l.status = 'aberto'`;

  const [bancos, [resumo], proximos, vencidos, pagoMes, recebidoMes, despesas] = await Promise.all([
    veBancos ? bancosComSaldo(empresaId) : Promise.resolve([] as BancoComSaldo[]),
    query<{ pagar: number; receber: number; pagar_vencido: number; receber_vencido: number; n_vencidos: number }>(
      `select coalesce(sum(valor) filter (where tipo = 'pagar'), 0) as pagar,
              coalesce(sum(valor) filter (where tipo = 'receber'), 0) as receber,
              coalesce(sum(valor) filter (where tipo = 'pagar' and vencimento < $2::date), 0) as pagar_vencido,
              coalesce(sum(valor) filter (where tipo = 'receber' and vencimento < $2::date), 0) as receber_vencido,
              count(*) filter (where vencimento < $2::date and tipo = any($3::text[]))::int as n_vencidos
         from lancamentos where empresa_id = $1 and status = 'aberto'`,
      [empresaId, hoje, tipos]
    ),
    tipos.length
      ? query<Vencimento>(`${SELECT_VENC} and l.vencimento between $3::date and $3::date + 15 order by l.vencimento, l.tipo, l.descricao limit 40`, [empresaId, tipos, hoje])
      : Promise.resolve([] as Vencimento[]),
    tipos.length
      ? query<Vencimento>(`${SELECT_VENC} and l.vencimento < $3::date order by l.vencimento, l.tipo, l.descricao limit 40`, [empresaId, tipos, hoje])
      : Promise.resolve([] as Vencimento[]),
    vePagar ? porMes(empresaId, "pagar", hoje) : Promise.resolve([]),
    veReceber ? porMes(empresaId, "receber", hoje) : Promise.resolve([]),
    vePagar
      ? query<{ nome: string; valor: number }>(
          `select coalesce(f.nome, 'Sem fornecedor') as nome, sum(l.valor) as valor
             from lancamentos l left join fornecedores f on f.id = l.fornecedor_id
            where l.empresa_id = $1 and l.tipo = 'pagar'
              and l.vencimento >= date_trunc('month', $2::date) and l.vencimento < date_trunc('month', $2::date) + interval '1 month'
            group by 1 order by valor desc limit 10`,
          [empresaId, hoje]
        )
      : Promise.resolve([]),
  ]);

  const saldoTotal = bancos.filter((b) => b.ativo).reduce((s, b) => s + b.saldo, 0);
  const resultado = resumo.receber - resumo.pagar;
  const nada = !vePagar && !veReceber && !veBancos;

  return (
    <div className="lanc">
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: "1.1rem" }}>
        <h1 style={{ margin: 0 }}>Financeiro <span className="muted small" style={{ fontWeight: 600 }}>· {atual.nome}</span></h1>
        <div className="actions">
          {podeAcessar(usuario, "fingraficos") && (
            <Link className="btn" href="/financeiro/graficos"><Icone nome="graficos" tamanho={16} /> Gráficos</Link>
          )}
          {vePagar && (
            <Link className="btn" href="/relatorio-pagar" target="_blank"><Icone nome="imprimir" tamanho={16} /> Contas a pagar do dia</Link>
          )}
        </div>
      </div>

      {nada && <div className="alert warn">Seu usuário não tem acesso a contas a pagar, a receber nem bancos. Peça ao administrador.</div>}

      <div className="stats">
        {veBancos && <div className="stat"><div className="label">Saldo nos bancos</div><div className={`value${saldoTotal < 0 ? " fin-neg" : ""}`}>{brl(saldoTotal)}</div></div>}
        {vePagar && <div className="stat"><div className="label">A pagar em aberto</div><div className="value">{brl(resumo.pagar)}</div></div>}
        {veReceber && <div className="stat"><div className="label">A receber em aberto</div><div className="value">{brl(resumo.receber)}</div></div>}
        {vePagar && veReceber && (
          <div className="stat"><div className="label">Resultado previsto</div><div className={`value ${resultado < 0 ? "fin-neg" : "fin-pos"}`}>{brl(resultado)}</div></div>
        )}
        {vePagar && (
          <div className="stat lanc-stat-perigo">
            <div className="label">Vencidos a pagar</div>
            <div className="value"><Link href="/financeiro/pagar?status=vencidos" style={{ color: "inherit" }}>{brl(resumo.pagar_vencido)}</Link></div>
          </div>
        )}
      </div>

      <div className="fin-blocos">
        {veBancos && (
          <section className="card">
            <h2>Saldo por banco</h2>
            {bancos.length ? (
              <>
                <ul className="fin-lista">
                  {bancos.map((b) => (
                    <li key={b.id}>
                      <span className="principal">
                        <Link href="/financeiro/bancos">{b.nome}</Link>
                        {(b.agencia || b.conta) && <span className="small muted"> · {[b.agencia && `ag. ${b.agencia}`, b.conta && `c/c ${b.conta}`].filter(Boolean).join(" ")}</span>}
                        {!b.ativo && <span className="badge" style={{ marginLeft: ".4rem" }}>Inativo</span>}
                      </span>
                      <span className={`valor${b.saldo < 0 ? " fin-neg" : ""}`}>{brl(b.saldo)}</span>
                    </li>
                  ))}
                </ul>
                <div className="fin-total"><span>Total (ativos)</span><span className={saldoTotal < 0 ? "fin-neg" : ""}>{brl(saldoTotal)}</span></div>
              </>
            ) : (
              <p className="muted small">Nenhum banco cadastrado. <Link href="/financeiro/bancos">Cadastrar banco</Link></p>
            )}
          </section>
        )}

        {tipos.length > 0 && (
          <section className="card">
            <h2>Próximos vencimentos</h2>
            <p className="muted small" style={{ marginTop: "-.4rem" }}>Em aberto, de hoje até {dataBR(somarDias(hoje, 15))}</p>
            <ListaVencimentos itens={proximos} hoje={hoje} vazio="Nada vencendo nos próximos 15 dias." />
          </section>
        )}

        {tipos.length > 0 && (
          <section className="card">
            <h2>Vencidos {resumo.n_vencidos > 0 && <span className="badge baixa">{resumo.n_vencidos}</span>}</h2>
            {(vePagar || veReceber) && resumo.n_vencidos > 0 && (
              <p className="small muted" style={{ marginTop: "-.4rem" }}>
                {vePagar && <>A pagar: <strong className="fin-neg">{brl(resumo.pagar_vencido)}</strong></>}
                {vePagar && veReceber && " · "}
                {veReceber && <>A receber: <strong>{brl(resumo.receber_vencido)}</strong></>}
                {resumo.n_vencidos > vencidos.length && <> · mostrando os {vencidos.length} mais antigos</>}
              </p>
            )}
            <ListaVencimentos itens={vencidos} hoje={hoje} vazio="Nenhum lançamento vencido." />
          </section>
        )}
      </div>

      {(vePagar || veReceber) && (
        <div className="charts">
          {vePagar && (
            <section className="card chart">
              <h2>Pago por mês</h2>
              <p className="sub">Contas a pagar baixadas — últimos 6 meses</p>
              <Colunas dados={pagoMes.map((m) => ({ rotulo: m.mes, valor: m.valor }))} formatar={reais} />
            </section>
          )}
          {veReceber && (
            <section className="card chart">
              <h2>Recebido por mês</h2>
              <p className="sub">Contas a receber baixadas — últimos 6 meses</p>
              <Colunas dados={recebidoMes.map((m) => ({ rotulo: m.mes, valor: m.valor }))} formatar={reais} />
            </section>
          )}
          {vePagar && (
            <section className="card chart">
              <h2>Maiores despesas por fornecedor</h2>
              <p className="sub">Contas a pagar com vencimento neste mês (pagas e em aberto)</p>
              <Barras dados={despesas.map((d) => ({ rotulo: d.nome, valor: d.valor }))} formatar={reais} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

