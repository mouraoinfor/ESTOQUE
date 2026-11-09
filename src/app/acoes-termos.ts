"use server";

import { revalidatePath } from "next/cache";
import { db, query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { soDigitos } from "@/lib/formato";
import type { DadosTermo, ItemTermo } from "@/components/termos/tipos";

type Resp<T = true> = { erro: string } | { ok: T };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const id = (v: unknown) => (typeof v === "string" && UUID.test(v) ? v : null);
const txt = (v: unknown, max = 500) => String(v ?? "").trim().slice(0, max);

function erroMsg(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  return m.replace(/^error:\s*/i, "");
}

// Cria ou atualiza o termo (cabeçalho + itens). Não mexe no estoque.
export async function salvarTermo(termoId: string | null, d: DadosTermo): Promise<Resp<string>> {
  const s = await exigirAcesso("termos");
  if (termoId && !UUID.test(termoId)) return { erro: "Termo inválido." };
  const recebedor = txt(d.recebedor_nome, 200);
  if (!recebedor) return { erro: "Informe quem recebe (empresa ou pessoa)." };
  if (!DATA.test(d.data ?? "")) return { erro: "Data inválida." };
  if (!Array.isArray(d.itens) || !d.itens.length) return { erro: "Adicione pelo menos um item." };
  if (d.itens.length > 300) return { erro: "Itens demais." };

  const itens: { produto_id: string | null; descricao: string; quantidade: number }[] = [];
  for (const [k, i] of (d.itens as ItemTermo[]).entries()) {
    const descricao = txt(i.descricao, 300);
    const q = Number(String(i.quantidade ?? "").replace(",", "."));
    if (!descricao) return { erro: `Item ${k + 1}: informe a descrição.` };
    if (!(q > 0) || !Number.isFinite(q)) return { erro: `Item ${k + 1} (${descricao}): quantidade inválida.` };
    itens.push({ produto_id: id(i.produto_id), descricao, quantidade: q });
  }

  const doc = soDigitos(d.recebedor_documento) || null;
  const novoId = termoId ?? crypto.randomUUID();
  const valores = [
    novoId, id(d.empresa_id), id(d.cliente_id), recebedor, doc, txt(d.recebedor_endereco) || null,
    txt(d.recebido_por, 200) || null, d.data, id(d.orcamento_id), txt(d.observacoes, 3000) || null, s.nome ?? s.email,
  ];
  const sql = db();
  try {
    if (termoId) {
      const [t] = await query("select 1 from termos_entrega where id = $1", [termoId]);
      if (!t) return { erro: "Termo não encontrado." };
    }
    await sql.transaction([
      termoId
        ? sql.query(
            `update termos_entrega set empresa_id = $2, cliente_id = $3, recebedor_nome = $4, recebedor_documento = $5,
                    recebedor_endereco = $6, recebido_por = $7, data = $8, orcamento_id = $9, observacoes = $10
              where id = $1`,
            valores.slice(0, 10)
          )
        : sql.query(
            `insert into termos_entrega (id, empresa_id, cliente_id, recebedor_nome, recebedor_documento, recebedor_endereco,
                                         recebido_por, data, orcamento_id, observacoes, usuario)
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            valores
          ),
      sql.query("delete from termo_entrega_itens where termo_id = $1", [novoId]),
      ...itens.map((i, k) =>
        sql.query(
          `insert into termo_entrega_itens (termo_id, ordem, produto_id, descricao, quantidade)
           values ($1, $2, (select id from produtos where id = $3), $4, $5)`,
          [novoId, k, i.produto_id, i.descricao, i.quantidade]
        )
      ),
    ]);
  } catch (e) {
    return { erro: `Não foi possível salvar: ${erroMsg(e)}` };
  }
  revalidatePath("/termos");
  revalidatePath(`/termos/${novoId}`);
  return { ok: novoId };
}

export async function excluirTermo(termoId: string): Promise<Resp> {
  await exigirAcesso("termos");
  if (!UUID.test(termoId)) return { erro: "Termo inválido." };
  try {
    await query("delete from termos_entrega where id = $1", [termoId]);
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  revalidatePath("/termos");
  return { ok: true };
}

// Itens de material de um orçamento/projeto (para puxar para o termo) e o cliente dele
export async function itensDoOrcamentoParaTermo(orcamentoId: string): Promise<Resp<{
  itens: ItemTermo[];
  cliente: { id: string | null; nome: string | null; documento: string | null };
}>> {
  await exigirAcesso("termos");
  if (!UUID.test(orcamentoId)) return { erro: "Orçamento inválido." };
  const [o] = await query<{ cliente_id: string | null; nome: string | null; documento: string | null }>(
    `select o.cliente_id, coalesce(c.nome, o.cliente_nome) as nome, c.documento
       from orcamentos o left join clientes c on c.id = o.cliente_id where o.id = $1`,
    [orcamentoId]
  );
  if (!o) return { erro: "Orçamento não encontrado." };
  const itens = await query<ItemTermo>(
    `select i.produto_id, p.codigo as produto_codigo, i.descricao, i.quantidade
       from orcamento_itens i left join produtos p on p.id = i.produto_id
      where i.orcamento_id = $1 and i.tipo = 'produto'
      order by i.ordem, i.id`,
    [orcamentoId]
  );
  return { ok: { itens, cliente: { id: o.cliente_id, nome: o.nome, documento: o.documento } } };
}
