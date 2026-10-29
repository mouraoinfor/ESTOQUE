"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth";
import { MODULOS, TEMA_ROSA } from "@/lib/modulos";

type Estado = { erro?: string; ok?: string } | undefined;

const CHAVES = new Set([...MODULOS.map((m) => m.chave), TEMA_ROSA]);

function permissoesDo(fd: FormData) {
  return fd.getAll("permissoes").map(String).filter((k) => CHAVES.has(k));
}

export async function criarUsuario(_prev: Estado, fd: FormData): Promise<Estado> {
  await exigirAdmin();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const nome = String(fd.get("nome") ?? "").trim() || null;
  const senha = String(fd.get("senha") ?? "");
  const admin = fd.get("admin") === "on";
  if (!email.includes("@")) return { erro: "E-mail inválido." };
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  try {
    await query(
      "insert into usuarios (email, nome, senha_hash, admin, permissoes) values ($1, $2, $3, $4, $5::text[])",
      [email, nome, await bcrypt.hash(senha, 10), admin, permissoesDo(fd)]
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { erro: msg.includes("duplicate") ? "Já existe um usuário com esse e-mail." : msg };
  }
  revalidatePath("/usuarios");
  return { ok: "Usuário criado." };
}

export async function salvarAcessos(id: string, _prev: Estado, fd: FormData): Promise<Estado> {
  const eu = await exigirAdmin();
  const admin = fd.get("admin") === "on";
  const ativo = fd.get("ativo") === "on";
  // Não deixa o administrador se trancar para fora
  if (id === eu.id && (!admin || !ativo)) return { erro: "Você não pode tirar o seu próprio acesso de administrador." };
  const nome = String(fd.get("nome") ?? "").trim() || null;
  await query("update usuarios set nome = $2, admin = $3, ativo = $4, permissoes = $5::text[] where id = $1", [
    id, nome, admin, ativo, permissoesDo(fd),
  ]);
  revalidatePath("/usuarios");
  return { ok: "Acessos salvos." };
}

export async function redefinirSenha(id: string, _prev: Estado, fd: FormData): Promise<Estado> {
  await exigirAdmin();
  const senha = String(fd.get("senha") ?? "");
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  await query("update usuarios set senha_hash = $2 where id = $1", [id, await bcrypt.hash(senha, 10)]);
  return { ok: "Senha redefinida." };
}

export async function excluirUsuario(id: string) {
  const eu = await exigirAdmin();
  if (id === eu.id) return { erro: "Você não pode excluir o seu próprio usuário." };
  await query("delete from usuarios where id = $1", [id]);
  revalidatePath("/usuarios");
  return { ok: "Usuário excluído." };
}
