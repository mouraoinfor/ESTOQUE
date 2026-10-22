import { exigirAcesso } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { hojeISO } from "@/lib/formato";
import { podeAcessar } from "@/lib/modulos";
import EditorOrcamento from "@/components/orcamentos/EditorOrcamento";
import { clientesParaBusca, produtosParaBusca } from "../dados";
import "../orcamentos.css";

export const dynamic = "force-dynamic";

function somarDias(iso: string, dias: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export default async function NovoOrcamentoPage() {
  const s = await exigirAcesso("orcamentos");
  const verCusto = podeAcessar(s, "itens");
  const [{ atual, todas }, produtos, clientes] = await Promise.all([empresaAtual(), produtosParaBusca(verCusto), clientesParaBusca()]);
  return (
    <EditorOrcamento
      orcamento={null}
      versao="novo"
      itens={[]}
      produtos={produtos}
      clientes={clientes}
      empresas={todas.map((e) => ({ id: e.id, nome: e.nome }))}
      empresaPadrao={atual?.id ?? null}
      validadePadrao={somarDias(hojeISO(), 15)}
      verCusto={verCusto}
      podeReceber={podeAcessar(s, "receber")}
      contas={[]}
    />
  );
}
