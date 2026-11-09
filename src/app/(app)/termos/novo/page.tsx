import { exigirAcesso } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { hojeISO } from "@/lib/formato";
import TermoEditor from "@/components/termos/TermoEditor";
import { clientesParaBusca, produtosParaBusca } from "../../orcamentos/dados";
import { orcamentosParaTermo } from "../dados";
import "../../financeiro/lancamentos.css";
import "../../orcamentos/orcamentos.css";
import "../termos.css";

export const dynamic = "force-dynamic";

export default async function NovoTermoPage() {
  await exigirAcesso("termos");
  const [{ atual, todas }, clientes, produtos, orcamentos] = await Promise.all([
    empresaAtual(),
    clientesParaBusca(),
    produtosParaBusca(false),
    orcamentosParaTermo(),
  ]);
  return (
    <TermoEditor
      termo={null}
      itens={[]}
      empresas={todas.map((e) => ({ id: e.id, nome: e.nome }))}
      empresaPadrao={atual?.id ?? null}
      clientes={clientes}
      produtos={produtos}
      orcamentos={orcamentos}
      hoje={hojeISO()}
    />
  );
}
