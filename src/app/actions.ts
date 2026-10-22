"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, query } from "@/lib/db";
import { exigirAcesso, exigirSessao } from "@/lib/auth";
import { assinarSessao, COOKIE_SESSAO, DURACAO_SESSAO_S } from "@/lib/sessao";

function erroMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

// ---------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------
export async function entrar(_prev: { erro?: string } | undefined, fd: FormData) {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const senha = String(fd.get("senha") ?? "");
  const [u] = await query<{ id: string; email: string; nome: string | null; senha_hash: string }>(
    "select id, email, nome, senha_hash from usuarios where email = $1 and ativo",
    [email]
  );
  if (!u || !(await bcrypt.compare(senha, u.senha_hash))) return { erro: "E-mail ou senha inválidos." };

  const token = await assinarSessao({ id: u.id, email: u.email, nome: u.nome });
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO_S,
  });
  redirect("/");
}

export async function sair() {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect("/login");
}

export async function trocarSenha(_prev: { erro?: string; ok?: boolean } | undefined, fd: FormData) {
  const s = await exigirSessao();
  const atual = String(fd.get("atual") ?? "");
  const nova = String(fd.get("nova") ?? "");
  if (nova.length < 8) return { erro: "A nova senha precisa ter pelo menos 8 caracteres." };
  const [u] = await query<{ senha_hash: string }>("select senha_hash from usuarios where id = $1", [s.id]);
  if (!u || !(await bcrypt.compare(atual, u.senha_hash))) return { erro: "Senha atual incorreta." };
  await query("update usuarios set senha_hash = $1 where id = $2", [await bcrypt.hash(nova, 10), s.id]);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------
const CAMPOS_TEXTO = [
  "nome", "marca", "modelo", "categoria", "condicao", "localizacao", "canal", "status", "observacoes",
  "titulo_ml", "titulo_olx", "descricao", "categoria_ml", "categoria_olx", "conteudo_embalagem",
  "garantia", "gtin", "link_anuncio", "pendencias",
];
const CAMPOS_NUMERO = [
  "custo", "peso_kg", "altura_cm", "largura_cm", "comprimento_cm",
  "preco_sugerido", "preco_min", "preco_max", "preco_venda",
];

function texto(fd: FormData, k: string) {
  const s = String(fd.get(k)).trim();
  return s === "" ? null : s;
}

function numero(fd: FormData, k: string) {
  const s = String(fd.get(k)).trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// "Chave: Valor" por linha -> objeto
function parseFicha(s: string | null) {
  const obj: Record<string, string> = {};
  if (!s) return obj;
  for (const linha of s.split(/\r?\n/)) {
    const i = linha.indexOf(":");
    if (i <= 0) continue;
    const k = linha.slice(0, i).trim();
    const v = linha.slice(i + 1).trim();
    if (k && v) obj[k] = v;
  }
  return obj;
}

// Lê só os campos presentes no formulário -> [coluna, valor, cast]
function lerCampos(fd: FormData) {
  const campos: [string, unknown, string][] = [];
  for (const k of CAMPOS_TEXTO) if (fd.has(k)) campos.push([k, texto(fd, k), ""]);
  for (const k of CAMPOS_NUMERO) if (fd.has(k)) campos.push([k, numero(fd, k), ""]);
  if (fd.has("para_venda_presente")) campos.push(["para_venda", fd.get("para_venda") === "on", ""]);
  if (fd.has("ficha_tecnica")) campos.push(["ficha_tecnica", JSON.stringify(parseFicha(texto(fd, "ficha_tecnica"))), "::jsonb"]);
  if (fd.has("palavras_chave")) {
    const lista = (texto(fd, "palavras_chave") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    campos.push(["palavras_chave", lista, "::text[]"]);
  }
  return campos;
}

export async function salvarProduto(id: string, fd: FormData) {
  await exigirAcesso("itens");
  const campos = lerCampos(fd);
  if (!campos.length) return { ok: true };
  const sets = campos.map(([c, , cast], i) => `${c} = $${i + 1}${cast}`).join(", ");
  try {
    await query(`update produtos set ${sets} where id = $${campos.length + 1}`, [...campos.map(([, v]) => v), id]);
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  revalidatePath("/", "layout");
  revalidatePath(`/itens/${id}`);
  return { ok: true };
}

export async function criarProduto(fd: FormData) {
  const s = await exigirAcesso("itens");
  const campos = lerCampos(fd);
  const quantidade = Math.max(0, Math.trunc(numero(fd, "quantidade") ?? 0));
  let id: string;
  try {
    const cols = campos.map(([c]) => c).join(", ");
    const vals = campos.map(([, , cast], i) => `$${i + 1}${cast}`).join(", ");
    const [row] = await query<{ id: string }>(
      `insert into produtos (${cols}) values (${vals}) returning id`,
      campos.map(([, v]) => v)
    );
    id = row.id;
    if (quantidade > 0) {
      await query("select movimentar_estoque($1, 'entrada', $2, 'Cadastro inicial', $3)", [id, quantidade, s.email]);
    }
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  revalidatePath("/", "layout");
  redirect(`/itens/${id}`);
}

export async function excluirProduto(id: string) {
  await exigirAcesso("itens");
  await query("delete from produtos where id = $1", [id]);
  revalidatePath("/", "layout");
  redirect("/itens");
}

// ---------------------------------------------------------------------
// Estoque
// ---------------------------------------------------------------------
export async function movimentar(produtoId: string, tipo: string, quantidade: number, motivo: string | null) {
  const s = await exigirAcesso("itens");
  try {
    const [r] = await query<{ saldo: number }>(
      "select movimentar_estoque($1, $2, $3, $4, $5) as saldo",
      [produtoId, tipo, Math.trunc(quantidade), motivo, s.email]
    );
    revalidatePath("/", "layout");
    revalidatePath(`/itens/${produtoId}`);
    revalidatePath("/movimentacoes");
    revalidatePath("/conferencia");
    return { ok: true, saldo: r.saldo };
  } catch (e) {
    return { erro: erroMsg(e) };
  }
}

export async function registrarConferencia(produtoId: string, contado: number) {
  await exigirAcesso("conferencia");
  await query("update produtos set quantidade_conferida = $1, conferido_em = now() where id = $2", [contado, produtoId]);
  revalidatePath("/conferencia");
  return { ok: true };
}

// Ajusta o estoque do sistema para bater com a contagem
export async function aplicarConferencia(produtoId: string) {
  await exigirAcesso("conferencia");
  const [p] = await query<{ quantidade: number; quantidade_conferida: number | null }>(
    "select quantidade, quantidade_conferida from produtos where id = $1",
    [produtoId]
  );
  if (!p) return { erro: "Produto não encontrado" };
  if (p.quantidade_conferida === null) return { erro: "Item ainda não foi conferido" };
  const delta = p.quantidade_conferida - p.quantidade;
  if (delta === 0) return { ok: true };
  return movimentar(produtoId, "ajuste", delta, "Ajuste por conferência");
}

export async function zerarConferencia() {
  await exigirAcesso("conferencia");
  await query("update produtos set quantidade_conferida = null, conferido_em = null");
  revalidatePath("/conferencia");
  return { ok: true };
}

// ---------------------------------------------------------------------
// Fotos (o navegador já manda redimensionada)
// ---------------------------------------------------------------------
const MIMES = ["image/jpeg", "image/png", "image/webp"];

export async function enviarFoto(produtoId: string, fd: FormData) {
  await exigirAcesso("itens");
  const arq = fd.get("foto");
  if (!(arq instanceof File)) return { erro: "Arquivo não enviado" };
  if (!MIMES.includes(arq.type)) return { erro: "Formato não suportado (use JPG, PNG ou WEBP)" };
  if (arq.size > 4 * 1024 * 1024) return { erro: "Foto muito grande (máx. 4 MB)" };
  const base64 = Buffer.from(await arq.arrayBuffer()).toString("base64");
  const [f] = await query<{ id: string }>(
    `insert into fotos (produto_id, mime, dados, ordem)
     values ($1, $2, decode($3, 'base64'), coalesce((select max(ordem) + 1 from fotos where produto_id = $1), 0))
     returning id`,
    [produtoId, arq.type, base64]
  );
  revalidatePath(`/itens/${produtoId}`);
  return { ok: true, id: f.id };
}

export async function removerFoto(fotoId: string) {
  await exigirAcesso("itens");
  await db()`delete from fotos where id = ${fotoId}`;
  return { ok: true };
}
