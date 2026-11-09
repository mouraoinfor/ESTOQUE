import Link from "next/link";
import { query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { bancosComSaldo } from "@/lib/financeiro";
import BancosGrade from "@/components/financeiro/BancosGrade";
import { MovimentoForm, NovoBanco, TransferenciaForm, type BancoDestino } from "@/components/financeiro/BancosPainel";
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
  const [lista, ordem] = await Promise.all([
    bancosComSaldo(atual.id),
    query<{ valor: unknown }>("select valor from configuracoes where chave = $1", [`bancos_ordem:${atual.id}`]).catch(() => []),
  ]);
  // Ordem escolhida na tela (arrastar); bancos fora da lista vão para o fim, na ordem padrão
  const salva = Array.isArray(ordem[0]?.valor) ? (ordem[0].valor as unknown[]).map(String) : [];
  const pos = (id: string) => { const i = salva.indexOf(id); return i < 0 ? Infinity : i; };
  const bancos = [...lista].sort((a, b) => pos(a.id) - pos(b.id));
  const ativos = bancos.filter((b) => b.ativo);
  const destinos = await query<BancoDestino>(
    `select b.id, b.nome, b.empresa_id, e.nome as empresa_nome
       from bancos b join empresas e on e.id = b.empresa_id
      where b.ativo
      order by e.nome, b.nome`
  );

  return (
    <>
      <div className="fin-topo">
        <div>
          <h1>Bancos e saldos</h1>
          <div className="muted small">{atual.nome}</div>
        </div>
      </div>

      {bancos.length ? (
        <BancosGrade bancos={bancos} />
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
