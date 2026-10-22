import { query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import CadastrosAdmin, { type CadastroLinha } from "@/components/financeiro/CadastrosAdmin";
import "../bancos.css";

export const dynamic = "force-dynamic";

// Totais somam os lançamentos de todas as empresas (cadastros são compartilhados)
function sqlCadastros(tabela: "fornecedores" | "clientes") {
  const col = tabela === "fornecedores" ? "fornecedor_id" : "cliente_id";
  const notas = tabela === "fornecedores" ? "(select count(*)::int from notas_fiscais n where n.fornecedor_id = x.id)" : "0";
  return `
    select x.id, x.nome, x.documento, x.telefone, x.email, x.observacoes,
           coalesce(t.aberto, 0) as aberto, coalesce(t.pago, 0) as pago, coalesce(t.n, 0) as n_lancamentos,
           ${notas} as n_notas,
           (select count(*)::int from recorrencias r where r.${col} = x.id) as n_recorrencias
      from ${tabela} x
      left join (
        select ${col} as id,
               sum(valor) filter (where status = 'aberto') as aberto,
               sum(valor) filter (where status = 'pago') as pago,
               count(*)::int as n
          from lancamentos where ${col} is not null group by ${col}
      ) t on t.id = x.id
     order by x.nome`;
}

export default async function Cadastros({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  await exigirAcesso("cadastros");
  const sp = await searchParams;
  const [fornecedores, clientes] = await Promise.all([
    query<CadastroLinha>(sqlCadastros("fornecedores")),
    query<CadastroLinha>(sqlCadastros("clientes")),
  ]);
  return (
    <>
      <h1>Fornecedores e clientes</h1>
      <p className="muted">Cadastros compartilhados entre todas as empresas.</p>
      <CadastrosAdmin fornecedores={fornecedores} clientes={clientes} abaInicial={sp.aba === "clientes" ? "cliente" : "fornecedor"} />
    </>
  );
}
