"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

type Estado = { erro?: string; ok?: string } | undefined;

export async function salvarPrecificacao(_prev: Estado, fd: FormData): Promise<Estado> {
  const u = await exigirAdmin();
  const modo = fd.get("modo") === "margem" ? "margem" : "markup";
  const percentual = Number(String(fd.get("percentual") ?? "").replace(",", "."));
  if (!Number.isFinite(percentual) || percentual < 0) return { erro: "Informe um percentual válido (ex.: 40)." };
  if (modo === "margem" && percentual >= 100) return { erro: "A margem precisa ser menor que 100%." };
  await query(
    `insert into configuracoes (chave, valor, usuario, updated_at) values ('precificacao', $1::jsonb, $2, now())
     on conflict (chave) do update set valor = excluded.valor, usuario = excluded.usuario, updated_at = now()`,
    [JSON.stringify({ modo, percentual }), u.nome ?? u.email]
  );
  revalidatePath("/configuracoes");
  return { ok: "Configuração salva." };
}
