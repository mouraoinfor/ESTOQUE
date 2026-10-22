import Link from "next/link";
import { query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { bancosComSaldo } from "@/lib/financeiro";
import { brl, dataBR, hojeISO } from "@/lib/formato";
import { conciliadosDoPeriodo, pendentesDoPeriodo, saldoAte, sugestoesDoPeriodo } from "./dados";
import { Conciliados, ImportarOFX, Pendentes } from "@/components/financeiro/ConciliacaoPainel";
import { MovimentoForm } from "@/components/financeiro/BancosPainel";
import "../bancos.css";

export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function Conciliacao({ searchParams }: { searchParams: Promise<{ banco?: string; de?: string; ate?: string }> }) {
  await exigirAcesso("conciliacao");
  const sp = await searchParams;
  const { atual } = await empresaAtual();
  if (!atual) {
    return (
      <>
        <h1>Conciliação bancária</h1>
        <div className="alert warn">Nenhuma empresa cadastrada. <Link href="/financeiro/empresas">Cadastre a empresa</Link> para usar o financeiro.</div>
      </>
    );
  }
  const bancos = await bancosComSaldo(atual.id);
  if (!bancos.length) {
    return (
      <>
        <h1>Conciliação bancária</h1>
        <div className="alert warn">Nenhum banco cadastrado em {atual.nome}. <Link href="/financeiro/bancos">Cadastre um banco</Link> primeiro.</div>
      </>
    );
  }
  const banco = bancos.find((b) => b.id === sp.banco) ?? bancos.find((b) => b.ativo) ?? bancos[0];
  const hoje = hojeISO();
  let de = sp.de && ISO.test(sp.de) ? sp.de : hoje.slice(0, 8) + "01";
  let ate = sp.ate && ISO.test(sp.ate) ? sp.ate : hoje;
  if (de > ate) [de, ate] = [ate, de];

  const [pendentes, sugestoes, conciliados, saldoFinal, fornecedores, clientes] = await Promise.all([
    pendentesDoPeriodo(banco.id, de, ate),
    sugestoesDoPeriodo(atual.id, banco.id, de, ate),
    conciliadosDoPeriodo(banco.id, de, ate),
    saldoAte(banco.id, ate),
    query<{ id: string; nome: string }>("select id, nome from fornecedores order by nome"),
    query<{ id: string; nome: string }>("select id, nome from clientes order by nome"),
  ]);
  const valorPendente = pendentes.reduce((s, m) => s + (m.tipo === "credito" ? m.valor : -m.valor), 0);

  return (
    <>
      <div className="fin-topo">
        <div>
          <h1>Conciliação bancária</h1>
          <div className="muted small">{atual.nome}</div>
        </div>
        <Link className="btn" href={`/financeiro/bancos/${banco.id}?de=${de}&ate=${ate}`}>Ver extrato completo</Link>
      </div>

      <form className="filters" method="get">
        <label className="field" style={{ margin: 0 }}>
          <span>Banco</span>
          <select name="banco" defaultValue={banco.id}>
            {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}{b.ativo ? "" : " (inativo)"}</option>)}
          </select>
        </label>
        <label className="field" style={{ margin: 0 }}><span>De</span><input type="date" name="de" defaultValue={de} /></label>
        <label className="field" style={{ margin: 0 }}><span>Até</span><input type="date" name="ate" defaultValue={ate} /></label>
        <button className="btn" type="submit" style={{ alignSelf: "flex-end" }}>Abrir</button>
      </form>

      <div className="stats">
        <div className="stat">
          <div className="label">Saldo do sistema em {dataBR(ate)}</div>
          <div className={`value ${saldoFinal < 0 ? "diff-neg" : ""}`} style={{ fontSize: "1.15rem" }}>{brl(saldoFinal)}</div>
        </div>
        <div className="stat"><div className="label">Pendentes de conciliar</div><div className="value">{pendentes.length}</div></div>
        <div className="stat">
          <div className="label">Valor pendente (líquido)</div>
          <div className={`value ${valorPendente < 0 ? "diff-neg" : valorPendente > 0 ? "diff-pos" : ""}`} style={{ fontSize: "1.15rem" }}>{brl(valorPendente)}</div>
        </div>
        <div className="stat"><div className="label">Conciliados no período</div><div className="value">{conciliados.length}</div></div>
      </div>
      <p className="muted small" style={{ marginTop: "-.6rem" }}>
        Compare o saldo do sistema com o saldo do extrato do banco na mesma data. Diferença indica linha faltando ou lançada em dobro.
      </p>

      <div className="fin-paineis" style={{ marginBottom: "1rem" }}>
        <ImportarOFX key={banco.id} bancoId={banco.id} />
        <MovimentoForm bancos={[banco]} bancoFixo={banco.id} titulo="Digitar linha do extrato" />
      </div>

      <Pendentes bancoId={banco.id} de={de} ate={ate} pendentes={pendentes} sugestoes={sugestoes} fornecedores={fornecedores} clientes={clientes} />
      <Conciliados movimentos={conciliados} />
    </>
  );
}
