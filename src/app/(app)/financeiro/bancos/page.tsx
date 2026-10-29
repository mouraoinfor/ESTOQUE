import Link from "next/link";
import { query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { bancosComSaldo } from "@/lib/financeiro";
import { brl } from "@/lib/formato";
import { BancoCard, MovimentoForm, NovoBanco, TransferenciaForm, type BancoDestino } from "@/components/financeiro/BancosPainel";
import "../bancos.css";

export const dynamic = "force-dynamic";

export default async function Bancos() {
  await exigirAcesso("bancos");
  const { atual } = await empresaAtual();
  if (!atual) {
    return (
      <>
        <h1>Bancos e saldos</h1>
        <div className="alert warn">Nenhuma empresa cadastrada. <Link href="/financeiro/empresas">Cadastre a empresa</Link> para usar o financeiro.</div>
      </>
    );
  }
  const bancos = await bancosComSaldo(atual.id);
  const ativos = bancos.filter((b) => b.ativo);
  const destinos = await query<BancoDestino>(
    `select b.id, b.nome, b.empresa_id, e.nome as empresa_nome
       from bancos b join empresas e on e.id = b.empresa_id
      where b.ativo
      order by e.nome, b.nome`
  );
  const total = bancos.reduce((s, b) => s + b.saldo, 0);
  const limites = ativos.reduce((s, b) => s + b.limite, 0);

  return (
    <>
      <div className="fin-topo">
        <div>
          <h1>Bancos e saldos</h1>
          <div className="muted small">{atual.nome}</div>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><div className="label">Saldo total</div><div className={`value ${total < 0 ? "diff-neg" : ""}`}>{brl(total)}</div></div>
        {limites > 0 && (
          <div className="stat"><div className="label">Disponível com limites</div><div className="value">{brl(total + limites)}</div><div className="small muted">limites {brl(limites)}</div></div>
        )}
        <div className="stat"><div className="label">Contas ativas</div><div className="value">{ativos.length}</div></div>
      </div>

      {bancos.length ? (
        <div className="bancos-grade">
          {bancos.map((b) => <BancoCard key={b.id} b={b} />)}
        </div>
      ) : (
        <div className="alert warn">Nenhum banco cadastrado nesta empresa.</div>
      )}

      <NovoBanco />

      {ativos.length > 0 && (
        <div className="fin-paineis">
          <TransferenciaForm origens={ativos} destinos={destinos} empresaId={atual.id} />
          <MovimentoForm bancos={ativos} />
        </div>
      )}
    </>
  );
}
