import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "./db";
import { COOKIE_SESSAO, lerSessao } from "./sessao";

// O middleware só confere a assinatura; aqui confirma que o usuário ainda existe
export async function sessaoAtual() {
  const c = await cookies();
  const s = await lerSessao(c.get(COOKIE_SESSAO)?.value);
  if (!s) return null;
  const [u] = await query<{ id: string }>("select id from usuarios where id = $1", [s.id]);
  return u ? s : null;
}

// Para server actions e páginas: garante usuário logado
export async function exigirSessao() {
  const s = await sessaoAtual();
  if (!s) redirect("/login?sair=1");
  return s;
}
