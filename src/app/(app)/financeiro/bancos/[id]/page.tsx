import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { bancosComSaldo } from "@/lib/financeiro";
import { brl, dataBR, hojeISO } from "@/lib/formato";
import { movimentosDoPeriodo, saldoAntesDe } from "../../conciliacao/dados";
import ExtratoTabela from "@/components/financeiro/ExtratoTabela";
import { MovimentoForm } from "@/components/financeiro/BancosPainel";
import "../../bancos.css";

export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f-]{36}$/i;

export default async function Extrato({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  await exigirAcesso("bancos");
  const { id } = await params;
  const sp = await searchParams;
  const { atual } = await empresaAtual();
  if (!atual) {
    return <div className="alert warn">Nenhuma empresa cadastrada. <Link href="/financeiro/empresas">Cadastre a empresa</Link>.</div>;
  }
  if (!UUID.test(id)) notFound();
  const banco = (await bancosComSaldo(atual.id)).find((b) => b.id === id);
  if (!banco) notFound();

  const hoje = hojeISO();
  let de = sp.de && ISO.test(sp.de) ? sp.de : hoje.slice(0, 8) + "01";
  let ate = sp.ate && ISO.test(sp.ate) ? sp.ate : hoje;
  if (de > ate) [de, ate] = [ate, de];

  const [movimentos, saldoAnterior] = await Promise.all([movimentosDoPeriodo(id, de, ate), saldoAntesDe(id, de)]);
  const creditos = movimentos.filter((m) => m.tipo === "credito").reduce((s, m) => s + m.valor, 0);
  const debitos = movimentos.filter((m) => m.tipo === "debito").reduce((s, m) => s + m.valor, 0);

  return (
    <>
      <div className="fin-topo">
        <div>
          <div className="small"><Link href="/financeiro/bancos">Bancos e saldos</Link></div>
          <h1>Extrato — {banco.nome}</h1>
          <div className="muted small">
            {atual.nome}
            {banco.agencia || banco.conta ? ` · Ag. ${banco.agencia ?? "—"} · C/C ${banco.conta ?? "—"}` : ""}
            {` · Saldo inicial ${brl(banco.saldo_inicial)} em ${dataBR(banco.saldo_inicial_em)}`}
          </div>
        </div>
        <Link className="btn" href={`/financeiro/conciliacao?banco=${id}&de=${de}&ate=${ate}`}>Conciliar este período</Link>
      </div>

      <form className="filters" method="get">
        <label className="field" style={{ margin: 0 }}><span>De</span><input type="date" name="de" defaultValue={de} /></label>
        <label className="field" style={{ margin: 0 }}><span>Até</span><input type="date" name="ate" defaultValue={ate} /></label>
        <button className="btn" type="submit" style={{ alignSelf: "flex-end" }}>Filtrar</button>
      </form>

      <div className="stats">
        <div className="stat"><div className="label">Saldo anterior</div><div className="value" style={{ fontSize: "1.15rem" }}>{brl(saldoAnterior)}</div></div>
        <div className="stat"><div className="label">Entradas</div><div className="value diff-pos" style={{ fontSize: "1.15rem" }}>{brl(creditos)}</div></div>
        <div className="stat"><div className="label">Saídas</div><div className="value diff-neg" style={{ fontSize: "1.15rem" }}>{brl(debitos)}</div></div>
        <div className="stat"><div className="label">Saldo no fim do período</div><div className="value" style={{ fontSize: "1.15rem" }}>{brl(saldoAnterior + creditos - debitos)}</div></div>
        <div className="stat"><div className="label">Saldo atual</div><div className="value" style={{ fontSize: "1.15rem" }}>{brl(banco.saldo)}</div></div>
      </div>

      <ExtratoTabela movimentos={movimentos} saldoAnterior={saldoAnterior} de={de} ate={ate} />

      <div style={{ marginTop: "1.25rem", maxWidth: 640 }}>
        <MovimentoForm bancos={[banco]} bancoFixo={banco.id} />
      </div>
    </>
  );
}
