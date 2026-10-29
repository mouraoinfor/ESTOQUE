"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";

type Resp = { erro: string } | { ok: true };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidar(orcamentoId: string) {
  revalidatePath(`/orcamentos/${orcamentoId}`);
  revalidatePath(`/projetos/${orcamentoId}`);
}

// Observação interna: vale em qualquer situação do orçamento (até depois da baixa)
export async function adicionarObservacao(orcamentoId: string, texto: string): Promise<Resp> {
  const s = await exigirAcesso("orcamentos");
  if (!UUID.test(orcamentoId)) return { erro: "Orçamento inválido." };
  const t = String(texto ?? "").trim();
  if (!t) return { erro: "Escreva a observação." };
  if (t.length > 5000) return { erro: "Observação muito longa (máx. 5000 caracteres)." };
  const r = await query<{ id: string }>(
    `insert into orcamento_notas (orcamento_id, texto, usuario)
     select id, $2, $3 from orcamentos where id = $1 returning id`,
    [orcamentoId, t, s.nome ?? s.email]
  );
  if (!r.length) return { erro: "Orçamento não encontrado." };
  revalidar(orcamentoId);
  return { ok: true };
}

export async function excluirObservacao(id: string): Promise<Resp> {
  await exigirAcesso("orcamentos");
  if (!UUID.test(id)) return { erro: "Observação inválida." };
  const [n] = await query<{ orcamento_id: string }>("delete from orcamento_notas where id = $1 returning orcamento_id", [id]);
  if (n) revalidar(n.orcamento_id);
  return { ok: true };
}
