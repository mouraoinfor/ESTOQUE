import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { hojeISO } from "@/lib/formato";
import TermoEditor from "@/components/termos/TermoEditor";
import { clientesParaBusca, produtosParaBusca } from "../../orcamentos/dados";
import { carregarTermo, orcamentosParaTermo } from "../dados";
import "../../financeiro/lancamentos.css";
import "../../orcamentos/orcamentos.css";
import "../termos.css";

export const dynamic = "force-dynamic";

export default async function TermoPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirAcesso("termos");
  const { id } = await params;
  const [dados, { atual, todas }, clientes, produtos, orcamentos] = await Promise.all([
    carregarTermo(id),
    empresaAtual(),
    clientesParaBusca(),
    produtosParaBusca(false),
    orcamentosParaTermo(),
  ]);
  if (!dados) notFound();
  return (
    <TermoEditor
      key={id}
      termo={dados.termo}
      itens={dados.itens}
      empresas={todas.map((e) => ({ id: e.id, nome: e.nome }))}
      empresaPadrao={atual?.id ?? null}
      clientes={clientes}
      produtos={produtos}
      orcamentos={orcamentos}
      hoje={hojeISO()}
    />
  );
}
