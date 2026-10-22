import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "./db";
import { COOKIE_SESSAO, lerSessao } from "./sessao";
import { podeAcessar } from "./modulos";

export interface Usuario {
  id: string;
  email: string;
  nome: string | null;
  admin: boolean;
  permissoes: string[];
}

// O middleware só confere a assinatura; aqui confirma que o usuário existe, está ativo
// e lê as permissões atuais (mudanças valem na hora, sem precisar sair e entrar)
export const sessaoAtual = cache(async (): Promise<Usuario | null> => {
  const c = await cookies();
  const s = await lerSessao(c.get(COOKIE_SESSAO)?.value);
  if (!s) return null;
  const [u] = await query<Usuario>(
    "select id, email, nome, admin, permissoes from usuarios where id = $1 and ativo",
    [s.id]
  );
  return u ?? null;
});

// Para server actions e páginas: garante usuário logado
export async function exigirSessao() {
  const s = await sessaoAtual();
  if (!s) redirect("/login?sair=1");
  return s;
}

// Garante acesso a um módulo (ver lib/modulos.ts); sem acesso volta para o início
export async function exigirAcesso(modulo: string) {
  const s = await exigirSessao();
  if (!podeAcessar(s, modulo)) redirect("/?sem-acesso=1");
  return s;
}

export async function exigirAdmin() {
  const s = await exigirSessao();
  if (!s.admin) redirect("/?sem-acesso=1");
  return s;
}
