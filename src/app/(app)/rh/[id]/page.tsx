import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl, dataBR } from "@/lib/formato";
import { podeAcessar } from "@/lib/modulos";
import Icone from "@/components/Icone";
import FuncionarioForm from "@/components/rh/FuncionarioForm";
import { liquido, mesParam, nomeMes, totaisFolha, type Funcionario, type ItemFolha } from "@/components/rh/rh-util";
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

  const [historico, funcoes] = await Promise.all([
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
