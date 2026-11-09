import "server-only";
import { query } from "@/lib/db";
import { SELECT_TERMO, type ItemTermo, type OrcamentoOpcao, type Termo } from "@/components/termos/tipos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function carregarTermo(id: string) {
  if (!UUID.test(id)) return null;
  const [t] = await query<Termo>(`${SELECT_TERMO} where id = $1`, [id]);
  if (!t) return null;
  const itens = await query<ItemTermo>(
    `select i.produto_id, p.codigo as produto_codigo, i.descricao, i.quantidade
       from termo_entrega_itens i left join produtos p on p.id = i.produto_id
      where i.termo_id = $1 order by i.ordem, i.id`,
    [id]
  );
  return { termo: t, itens };
}

// Orçamentos/projetos para puxar itens: aprovados e baixados primeiro, depois os mais recentes
export async function orcamentosParaTermo() {
  return query<OrcamentoOpcao>(
    `select o.id, o.numero, o.titulo, coalesce(c.nome, o.cliente_nome) as cliente_nome
       from orcamentos o left join clientes c on c.id = o.cliente_id
      where o.status <> 'cancelado'
      order by (o.status in ('aprovado', 'baixado')) desc, o.numero desc
      limit 300`
  );
}
