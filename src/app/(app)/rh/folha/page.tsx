import Link from "next/link";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl, hojeISO } from "@/lib/formato";
import { podeAcessar } from "@/lib/modulos";
import Icone from "@/components/Icone";
import { Colunas } from "@/components/Graficos";
import FolhaPainel from "@/components/rh/FolhaPainel";
import { competenciaDe, mesCurto, somarMeses, type Funcionario, type ItemFolha } from "@/components/rh/rh-util";
import "../rh.css";

export const dynamic = "force-dynamic";

const reais = (v: number) => brl(Math.round(v)).replace(",00", "");

export default async function FolhaPagina({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const usuario = await exigirAcesso("folha");
  const pedido = competenciaDe((await searchParams).mes);

  const meses = await query<{ competencia: string; linhas: number; liquido: number }>(
    `select competencia::text as competencia, count(*)::int as linhas, sum(salario + comissao - desconto) as liquido
       from folha_itens group by competencia order by competencia desc`
  );
  const ultimo = meses[0]?.competencia ?? competenciaDe(hojeISO())!;
  const competencia = pedido ?? ultimo;
  const proximo = somarMeses(ultimo, 1);

  const [itens, [notas], funcionarios, grafico] = await Promise.all([
    query<ItemFolha>(
      `select id, competencia::text as competencia, funcionario_id, nome, funcao, salario, comissao, desconto,
              desconto_descricao, dias, vr, vt, va, observacoes, pago
         from folha_itens where competencia = $1
        order by lower(nome), created_at`,
      [competencia]
    ),
    query<{ observacoes: string | null }>("select observacoes from folha_meses where competencia = $1", [competencia]),
    query<Pick<Funcionario, "id" | "nome" | "funcao" | "ativo" | "vr_dia" | "vt_dia">>(
      "select id, nome, funcao, ativo, vr_dia, vt_dia from funcionarios order by ativo desc, lower(nome)"
    ),
    // Líquido dos 12 meses até o último mês com folha
    query<{ competencia: string; liquido: number }>(
      `select m.mes::date::text as competencia, coalesce(sum(i.salario + i.comissao - i.desconto), 0) as liquido
         from generate_series($1::date - interval '11 months', $1::date, interval '1 month') as m(mes)
         left join folha_itens i on i.competencia = m.mes::date
        group by m.mes order by m.mes`,
      [ultimo]
    ),
  ]);

  return (
    <div className="rh">
      <div className="actions rh-topo">
        <h1>Folha de pagamento</h1>
        {podeAcessar(usuario, "rh") && (
          <Link className="btn" href="/rh"><Icone nome="cracha" tamanho={16} /> Funcionários</Link>
        )}
      </div>

      <FolhaPainel
        key={competencia}
        competencia={competencia}
        meses={meses.map((m) => m.competencia)}
        proximo={proximo}
        itens={itens}
        observacoes={notas?.observacoes ?? ""}
        funcionarios={funcionarios}
      />

      <section className="card chart rh-grafico">
        <h2>Líquido por mês</h2>
        <p className="sub">Salário + comissão - descontos, últimos 12 meses (sem benefícios)</p>
        <Colunas dados={grafico.map((g) => ({ rotulo: mesCurto(g.competencia), valor: g.liquido, href: `/rh/folha?mes=${g.competencia.slice(0, 7)}` }))} formatar={reais} />
      </section>
    </div>
  );
}
