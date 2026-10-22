import LancamentosPagina from "@/components/financeiro/LancamentosPagina";
import "../lancamentos.css";

export const dynamic = "force-dynamic";

export default async function ContasReceber({ searchParams }: { searchParams: Promise<{ status?: string; aba?: string; lancamento?: string }> }) {
  return <LancamentosPagina tipo="receber" params={await searchParams} />;
}
