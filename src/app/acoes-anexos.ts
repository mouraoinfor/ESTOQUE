"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { MAX_ANEXO_BYTES, PARTE_BYTES } from "@/components/anexos/tipos";

type Resp<T = true> = { erro: string } | { ok: T };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function erroMsg(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  return m.replace(/^error:\s*/i, "");
}

function revalidar(orcamentoId: string) {
  revalidatePath(`/orcamentos/${orcamentoId}`);
  revalidatePath(`/projetos/${orcamentoId}`);
}

// 1) Cria o anexo (ainda incompleto) e diz em quantas partes o navegador deve mandar
export async function iniciarAnexo(orcamentoId: string, nome: string, mime: string, tamanho: number): Promise<Resp<{ id: string; partes: number }>> {
  const s = await exigirAcesso("orcamentos");
  if (!UUID.test(orcamentoId)) return { erro: "Orçamento inválido." };
  const n = String(nome ?? "").trim().slice(0, 200);
  if (!n) return { erro: "Arquivo sem nome." };
  if (!(tamanho > 0)) return { erro: `${n}: arquivo vazio.` };
  if (tamanho > MAX_ANEXO_BYTES) return { erro: `${n}: arquivo maior que ${MAX_ANEXO_BYTES / 1024 / 1024} MB.` };
  const [o] = await query<{ id: string }>("select id from orcamentos where id = $1", [orcamentoId]);
  if (!o) return { erro: "Orçamento não encontrado." };
  // Envios que travaram no meio há mais de um dia
  await query("delete from orcamento_anexos where not completo and created_at < now() - interval '1 day'");
  const partes = Math.ceil(tamanho / PARTE_BYTES);
  const [a] = await query<{ id: string }>(
    `insert into orcamento_anexos (orcamento_id, nome, mime, tamanho, partes, usuario)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [orcamentoId, n, String(mime || "application/octet-stream").slice(0, 120), tamanho, partes, s.nome ?? s.email]
  );
  return { ok: { id: a.id, partes } };
}

// 2) Uma parte do arquivo
export async function enviarParteAnexo(anexoId: string, ordem: number, fd: FormData): Promise<Resp> {
  await exigirAcesso("orcamentos");
  if (!UUID.test(anexoId) || !Number.isInteger(ordem) || ordem < 0) return { erro: "Parte inválida." };
  const parte = fd.get("parte");
  if (!(parte instanceof Blob) || parte.size === 0 || parte.size > PARTE_BYTES) return { erro: "Parte inválida." };
  try {
    const r = await query(
      `insert into orcamento_anexo_partes (anexo_id, ordem, dados)
       select id, $2, decode($3, 'base64') from orcamento_anexos where id = $1 and not completo and $2 < partes
       on conflict (anexo_id, ordem) do update set dados = excluded.dados
       returning ordem`,
      [anexoId, ordem, Buffer.from(await parte.arrayBuffer()).toString("base64")]
    );
    if (!r.length) return { erro: "Envio não encontrado ou já concluído." };
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  return { ok: true };
}

// 3) Confere se chegaram todas as partes com o tamanho certo e libera o anexo
export async function concluirAnexo(anexoId: string): Promise<Resp> {
  await exigirAcesso("orcamentos");
  if (!UUID.test(anexoId)) return { erro: "Anexo inválido." };
  const [a] = await query<{ orcamento_id: string }>(
    `update orcamento_anexos a set completo = true
      where a.id = $1 and not a.completo
        and (select count(*) from orcamento_anexo_partes p where p.anexo_id = a.id) = a.partes
        and (select sum(length(p.dados)) from orcamento_anexo_partes p where p.anexo_id = a.id) = a.tamanho
      returning a.orcamento_id`,
    [anexoId]
  );
  if (!a) {
    await query("delete from orcamento_anexos where id = $1 and not completo", [anexoId]);
    return { erro: "O arquivo não chegou inteiro. Tente enviar de novo." };
  }
  revalidar(a.orcamento_id);
  return { ok: true };
}

// Cancela um envio que deu erro no meio
export async function cancelarAnexo(anexoId: string): Promise<Resp> {
  await exigirAcesso("orcamentos");
  if (!UUID.test(anexoId)) return { erro: "Anexo inválido." };
  await query("delete from orcamento_anexos where id = $1 and not completo", [anexoId]);
  return { ok: true };
}

export async function excluirAnexo(anexoId: string): Promise<Resp> {
  await exigirAcesso("orcamentos");
  if (!UUID.test(anexoId)) return { erro: "Anexo inválido." };
  const [a] = await query<{ orcamento_id: string }>("delete from orcamento_anexos where id = $1 returning orcamento_id", [anexoId]);
  if (!a) return { erro: "Anexo não encontrado." };
  revalidar(a.orcamento_id);
  return { ok: true };
}

export async function renomearAnexo(anexoId: string, nome: string): Promise<Resp> {
  await exigirAcesso("orcamentos");
  const n = String(nome ?? "").trim().slice(0, 200);
  if (!UUID.test(anexoId) || !n) return { erro: "Nome inválido." };
  const [a] = await query<{ orcamento_id: string }>("update orcamento_anexos set nome = $2 where id = $1 returning orcamento_id", [anexoId, n]);
  if (!a) return { erro: "Anexo não encontrado." };
  revalidar(a.orcamento_id);
  return { ok: true };
}
