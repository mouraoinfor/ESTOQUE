import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl, dataBR } from "@/lib/formato";
import { podeAcessar } from "@/lib/modulos";
import Icone from "@/components/Icone";
import FuncionarioForm from "@/components/rh/FuncionarioForm";
import FaltasFuncionario from "@/components/rh/FaltasFuncionario";
import PagamentosFuncionario, { type PagamentoFuncionario } from "@/components/rh/PagamentosFuncionario";
import { liquido, mesParam, nomeMes, totaisFolha, type Falta, type Funcionario, type ItemFolha } from "@/components/rh/rh-util";
import "../rh.css";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function FuncionarioPagina({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirAcesso("rh");
  const { id } = await params;
  const novo = id === "novo";
  if (!novo && !UUID.test(id)) notFound();

  const [funcionario] = novo
    ? [null]
    : await query<Funcionario>(
        `select id, nome, apelido, funcao, salario, admissao::text as admissao, demissao::text as demissao, ativo,
                vr_dia, vt_dia, va_mensal, documento, telefone, pix, observacoes
           from funcionarios where id = $1`,
        [id]
      );
  if (!novo && !funcionario) notFound();

  const vePagar = podeAcessar(usuario, "pagar");
  const [historico, funcoes, faltas, pagamentos] = await Promise.all([
    novo
      ? Promise.resolve([] as ItemFolha[])
      : query<ItemFolha>(
          `select id, competencia::text as competencia, funcionario_id, nome, funcao, salario, comissao, desconto,
                  desconto_descricao, dias, vr, vt, va, observacoes, pago
             from folha_itens where funcionario_id = $1
            order by competencia desc, created_at`,
          [id]
        ),
    query<{ funcao: string }>("select distinct funcao from funcionarios where funcao is not null and funcao <> '' order by funcao"),
    novo
      ? Promise.resolve([] as Falta[])
      : query<Falta>(
          "select id, data::text as data, dias, motivo, usuario from funcionario_faltas where funcionario_id = $1 order by data desc, created_at desc limit 200",
          [id]
        ),
    novo || !vePagar
      ? Promise.resolve([] as PagamentoFuncionario[])
      : query<PagamentoFuncionario>(
          `select l.id, l.descricao, l.vencimento::text as vencimento, l.valor, l.status, l.pago_em::text as pago_em,
                  b.nome as banco_nome, l.observacoes
             from lancamentos l left join bancos b on b.id = l.banco_id
            where l.funcionario_id = $1
            order by coalesce(l.pago_em, l.vencimento) desc, l.created_at desc limit 300`,
          [id]
        ),
  ]);
  const t = totaisFolha(historico);
  const veFolha = podeAcessar(usuario, "folha");

  return (
    <div className="rh">
      <p className="rh-voltar"><Link href="/rh"><Icone nome="estorno" tamanho={14} /> Funcionários</Link></p>
      <div className="actions rh-topo">
        <h1>
          {funcionario ? funcionario.nome : "Novo funcionário"}
          {funcionario && (
            <span className={`badge ${funcionario.ativo ? "novo" : "baixa"} rh-titulo-badge`}>
              {funcionario.ativo ? "Ativo" : `Desligado${funcionario.demissao ? ` em ${dataBR(funcionario.demissao)}` : ""}`}
            </span>
          )}
        </h1>
      </div>

      <FuncionarioForm funcionario={funcionario ?? null} funcoes={funcoes.map((f) => f.funcao)} />

      {funcionario && vePagar && (
        <PagamentosFuncionario pagamentos={pagamentos} />
      )}

      {funcionario && (
        <FaltasFuncionario funcionarioId={funcionario.id} faltas={faltas} vrDia={funcionario.vr_dia} vtDia={funcionario.vt_dia} />
      )}

      {funcionario && (
        <section className="card">
          <h2>Histórico na folha</h2>
          {!historico.length ? (
            <p className="muted">Nenhum mês de folha para este funcionário.</p>
          ) : (
            <>
              <div className="stats">
                <div className="stat"><div className="label">Meses na folha</div><div className="value">{historico.length}</div></div>
                <div className="stat"><div className="label">Líquido pago (total)</div><div className="value">{brl(t.liquido)}</div></div>
                <div className="stat"><div className="label">Benefícios (total)</div><div className="value">{brl(t.vr + t.vt + t.va)}</div></div>
                <div className="stat"><div className="label">Total geral</div><div className="value">{brl(t.geral)}</div></div>
              </div>
              <div className="table-wrap rh-sem-sombra">
                <table className="rh-tabela">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th className="hide-sm">Função</th>
                      <th className="num">Salário</th>
                      <th className="num">Comissão</th>
                      <th className="num">Desconto</th>
                      <th className="num">Líquido</th>
                      <th className="num hide-sm">VR</th>
                      <th className="num hide-sm">VT</th>
                      <th className="num hide-sm">VA</th>
                      <th>Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((i) => (
                      <tr key={i.id}>
                        <td>
                          {veFolha ? <Link href={`/rh/folha?mes=${mesParam(i.competencia)}`}>{nomeMes(i.competencia)}</Link> : nomeMes(i.competencia)}
                          {i.observacoes && <div className="muted small">{i.observacoes}</div>}
                        </td>
                        <td className="hide-sm">{i.funcao ?? "—"}</td>
                        <td className="num">{brl(i.salario)}</td>
                        <td className="num">{i.comissao ? brl(i.comissao) : "—"}</td>
                        <td className="num" title={i.desconto_descricao ?? undefined}>
                          {i.desconto ? <span className="diff-neg">{brl(i.desconto)}</span> : "—"}
                          {i.desconto_descricao && <div className="muted small rh-desc">{i.desconto_descricao}</div>}
                        </td>
                        <td className="num"><strong>{brl(liquido(i))}</strong></td>
                        <td className="num hide-sm">{i.vr ? brl(i.vr) : "—"}</td>
                        <td className="num hide-sm">{i.vt ? brl(i.vt) : "—"}</td>
                        <td className="num hide-sm">{i.va ? brl(i.va) : "—"}</td>
                        <td>{i.pago ? <span className="badge novo">Pago</span> : <span className="badge media">Aberto</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="rh-total">
                      <td>Total</td>
                      <td className="hide-sm" />
                      <td className="num">{brl(historico.reduce((s, i) => s + i.salario, 0))}</td>
                      <td className="num">{brl(historico.reduce((s, i) => s + i.comissao, 0))}</td>
                      <td className="num">{brl(t.descontos)}</td>
                      <td className="num">{brl(t.liquido)}</td>
                      <td className="num hide-sm">{brl(t.vr)}</td>
                      <td className="num hide-sm">{brl(t.vt)}</td>
                      <td className="num hide-sm">{brl(t.va)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
