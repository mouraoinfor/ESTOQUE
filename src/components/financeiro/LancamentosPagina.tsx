import Link from "next/link";
import { exigirAcesso } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import type { TipoLancamento } from "@/lib/financeiro";
import { hojeISO } from "@/lib/formato";
import { listarBancos, listarLancamentos, listarPartes, listarRecorrencias, prepararRecorrencias } from "./LancamentosDados";
import LancamentosTela, { type FiltroStatus } from "./LancamentosTela";

const STATUS: FiltroStatus[] = ["aberto", "vencidos", "pagos", "todos"];

// Tela de contas a pagar / a receber (server component; a interação fica em LancamentosTela)
export default async function LancamentosPagina({
  tipo,
  params,
}: {
  tipo: TipoLancamento;
  params: { status?: string; aba?: string; lancamento?: string };
}) {
  await exigirAcesso(tipo);
  const titulo = tipo === "pagar" ? "Contas a pagar" : "Contas a receber";
  const { atual } = await empresaAtual();
  if (!atual) {
    return (
      <>
        <h1>{titulo}</h1>
        <div className="alert warn">
          Nenhuma empresa cadastrada. <Link href="/financeiro/empresas">Cadastre a empresa (CNPJ)</Link> para usar o financeiro.
        </div>
      </>
    );
  }
  const hoje = hojeISO();
  await prepararRecorrencias(atual.id);
  const [lancamentos, bancos, partes, recorrencias] = await Promise.all([
    listarLancamentos(atual.id, tipo),
    listarBancos(atual.id),
    listarPartes(tipo, true),
    listarRecorrencias(atual.id, tipo, hoje),
  ]);
  const status = STATUS.find((s) => s === params.status) ?? "aberto";

  return (
    <LancamentosTela
      key={atual.id}
      tipo={tipo}
      lancamentos={lancamentos}
      bancos={bancos}
      partes={partes}
      recorrencias={recorrencias}
      hoje={hoje}
      statusInicial={status}
      abaInicial={params.aba === "fixas" ? "fixas" : "lancamentos"}
      destaque={params.lancamento}
    />
  );
}
