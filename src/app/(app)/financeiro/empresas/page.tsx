import { query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { EmpresaCard, NovaEmpresa, type EmpresaLinha } from "@/components/financeiro/EmpresasAdmin";
import "../bancos.css";

export const dynamic = "force-dynamic";

export default async function Empresas() {
  await exigirAcesso("empresas");
  const { atual } = await empresaAtual();
  const empresas = await query<EmpresaLinha>(
    `select e.id, e.nome, e.documento,
            (select count(*)::int from bancos b where b.empresa_id = e.id) as n_bancos,
            (select count(*)::int from lancamentos l where l.empresa_id = e.id) as n_lancamentos
       from empresas e
      order by e.nome`
  );

  return (
    <>
      <h1>Empresas</h1>
      <p className="muted">
        Cada empresa (CNPJ) tem seus próprios bancos, contas a pagar/receber e extrato. Fornecedores, clientes e o estoque são
        compartilhados. A empresa atual é escolhida no menu lateral.
      </p>
      {!empresas.length && <div className="alert warn">Nenhuma empresa cadastrada ainda. Cadastre a primeira para usar o financeiro.</div>}
      <NovaEmpresa primeira={!empresas.length} />
      <div className="empresas-lista">
        {empresas.map((e) => <EmpresaCard key={e.id} e={e} atual={e.id === atual?.id} />)}
      </div>
    </>
  );
}
