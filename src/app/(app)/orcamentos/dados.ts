import "server-only";
import { query } from "@/lib/db";
import type { EmpresaProposta } from "@/components/orcamentos/PropostaFolha";
import type { ClienteBusca, ItemOrcamento, Orcamento, ProdutoBusca } from "@/components/orcamentos/tipos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SELECT_ORCAMENTO = `
  select o.id, o.numero, o.titulo, o.cliente_id, coalesce(c.nome, o.cliente_nome) as cliente_nome, o.empresa_id,
         o.status, o.validade::text as validade, o.observacoes, o.condicoes, o.desconto,
         o.aos_cuidados, o.descricao_servico, o.prazo_entrega, o.garantia_fabricacao, o.garantia_instalacao, o.exibir_valores,
         to_json(o.aprovado_em) #>> '{}' as aprovado_em, to_json(o.baixado_em) #>> '{}' as baixado_em,
         o.baixado_por, to_json(o.created_at) #>> '{}' as created_at
    from orcamentos o
    left join clientes c on c.id = o.cliente_id`;

export async function carregarOrcamento(id: string) {
  if (!UUID.test(id)) return null;
  const [o] = await query<Orcamento>(`${SELECT_ORCAMENTO} where o.id = $1`, [id]);
  if (!o) return null;
  const itens = await query<ItemOrcamento>(
    `select id, produto_id, tipo, descricao, quantidade, valor_unitario, custo_unitario
       from orcamento_itens where orcamento_id = $1 order by ordem, id`,
    [id]
  );
  return { orcamento: o, itens };
}

// Produtos para a busca do editor (custo só para quem pode ver)
export async function produtosParaBusca(verCusto: boolean) {
  return query<ProdutoBusca>(
    `select id, codigo, nome, marca, modelo, quantidade,
            coalesce(preco_venda, preco_sugerido) as preco,
            ${verCusto ? "custo" : "null::double precision as custo"}
       from produtos
      order by nome`
  );
}

export async function clientesParaBusca() {
  return query<ClienteBusca>("select id, nome, documento, telefone, email from clientes order by nome");
}

// Dados da empresa que saem na proposta (cabeçalho e assinatura)
export const CAMPOS_EMPRESA_PROPOSTA =
  "id, nome, documento, inscricao_estadual, endereco, telefone, cidade, responsavel, responsavel_cargo, assinatura";

export async function empresasParaProposta() {
  return query<EmpresaProposta>(`select ${CAMPOS_EMPRESA_PROPOSTA} from empresas order by nome`);
}
