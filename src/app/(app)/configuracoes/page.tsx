import { exigirAdmin } from "@/lib/auth";
import { precificacao } from "@/lib/configuracoes";
import ConfiguracoesForm from "@/components/ConfiguracoesForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPagina() {
  await exigirAdmin();
  return (
    <>
      <h1>Configurações</h1>
      <ConfiguracoesForm atual={await precificacao()} />
    </>
  );
}
