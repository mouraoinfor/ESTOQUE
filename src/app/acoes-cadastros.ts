"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { COOKIE_EMPRESA } from "@/lib/empresa";
import { soDigitos } from "@/lib/formato";

type Estado = { erro?: string; ok?: string } | undefined;

function txt(fd: FormData, nome: string) {
  return String(fd.get(nome) ?? "").trim();
}

function cpfValido(d: string) {
  if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false;
  for (const t of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(d[t])) return false;
  }
  return true;
}

function cnpjValido(d: string) {
  if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return false;
  const dv = (base: string) => {
    let soma = 0, peso = base.length - 7;
    for (const c of base) { soma += Number(c) * peso; peso = peso === 2 ? 9 : peso - 1; }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(d.slice(0, 12)) === Number(d[12]) && dv(d.slice(0, 13)) === Number(d[13]);
}

// Documento opcional: vazio -> null; senão só dígitos e com dígitos verificadores válidos
function lerDocumento(v: string): { doc: string | null; erro?: string } {
  const d = soDigitos(v);
  if (!d) return { doc: null };
  if (d.length === 11) return cpfValido(d) ? { doc: d } : { doc: null, erro: "CPF inválido (confira os dígitos)." };
  if (d.length === 14) return cnpjValido(d) ? { doc: d } : { doc: null, erro: "CNPJ inválido (confira os dígitos)." };
  return { doc: null, erro: "CNPJ deve ter 14 dígitos e CPF 11." };
}

function duplicado(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("duplicate") || msg.includes("unique");
}

// ---------------------------------------------------------------------
// Empresas
// ---------------------------------------------------------------------

export async function salvarEmpresa(id: string | null, _prev: Estado, fd: FormData): Promise<Estado> {
  await exigirAcesso("empresas");
  const nome = txt(fd, "nome");
  if (!nome) return { erro: "Informe o nome da empresa." };
  const { doc, erro } = lerDocumento(txt(fd, "documento"));
  if (erro) return { erro };
  // Dados que saem no cabeçalho e na assinatura da proposta comercial
  const extras = ["inscricao_estadual", "endereco", "telefone", "cidade", "responsavel", "responsavel_cargo"].map((c) => txt(fd, c) || null);
  // Assinatura (imagem): só muda se mandou arquivo novo ou marcou para remover
  const arquivo = fd.get("assinatura");
  let assinatura: string | null | undefined;
  if (arquivo instanceof File && arquivo.size > 0) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(arquivo.type)) return { erro: "A assinatura precisa ser PNG, JPG ou WEBP." };
    if (arquivo.size > 1024 * 1024) return { erro: "Imagem da assinatura muito grande (máx. 1 MB)." };
    assinatura = `data:${arquivo.type};base64,${Buffer.from(await arquivo.arrayBuffer()).toString("base64")}`;
  } else if (fd.get("remover_assinatura") === "on") assinatura = null;
  try {
    if (id) {
      const r = await query(
        `update empresas set nome = $2, documento = $3, inscricao_estadual = $4, endereco = $5, telefone = $6, cidade = $7,
                responsavel = $8, responsavel_cargo = $9
          where id = $1 returning id`,
        [id, nome, doc, ...extras]
      );
      if (!r.length) return { erro: "Empresa não encontrada." };
      if (assinatura !== undefined) await query("update empresas set assinatura = $2 where id = $1", [id, assinatura]);
    } else {
      const [{ n }] = await query<{ n: number }>("select count(*)::int as n from empresas");
      const [nova] = await query<{ id: string }>(
        `insert into empresas (nome, documento, inscricao_estadual, endereco, telefone, cidade, responsavel, responsavel_cargo, assinatura)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
        [nome, doc, ...extras, assinatura ?? null]
      );
      // A primeira empresa cadastrada vira a atual
      if (n === 0) {
        (await cookies()).set(COOKIE_EMPRESA, nova.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
      }
    }
  } catch (e) {
    if (duplicado(e)) return { erro: "Já existe uma empresa com esse CNPJ/CPF." };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: id ? "Empresa salva." : "Empresa cadastrada." };
}

// Apaga a empresa e, em cascata, bancos, lançamentos, recorrências e extrato dela.
// Exige o nome digitado igual ao cadastrado.
export async function excluirEmpresa(id: string, nomeDigitado: string): Promise<{ erro?: string; ok?: string }> {
  await exigirAcesso("empresas");
  const [e] = await query<{ nome: string }>("select nome from empresas where id = $1", [id]);
  if (!e) return { erro: "Empresa não encontrada." };
  if (String(nomeDigitado ?? "").trim() !== e.nome.trim()) return { erro: "O nome digitado não confere. Nada foi apagado." };
  await query("delete from empresas where id = $1", [id]);
  revalidatePath("/", "layout");
  return { ok: "Empresa excluída." };
}

// ---------------------------------------------------------------------
// Fornecedores e clientes (compartilhados entre as empresas)
// ---------------------------------------------------------------------

export type TipoCadastro = "fornecedor" | "cliente";
const TABELA: Record<TipoCadastro, "fornecedores" | "clientes"> = { fornecedor: "fornecedores", cliente: "clientes" };

export async function salvarCadastro(tipo: TipoCadastro, id: string | null, _prev: Estado, fd: FormData): Promise<Estado> {
  await exigirAcesso("cadastros");
  const tabela = TABELA[tipo];
  if (!tabela) return { erro: "Tipo de cadastro inválido." };
  const nome = txt(fd, "nome");
  if (!nome) return { erro: "Informe o nome." };
  const { doc, erro } = lerDocumento(txt(fd, "documento"));
  if (erro) return { erro };
  const telefone = txt(fd, "telefone") || null;
  const email = txt(fd, "email") || null;
  const observacoes = txt(fd, "observacoes") || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "E-mail inválido." };
  try {
    if (id) {
      const r = await query(
        `update ${tabela} set nome = $2, documento = $3, telefone = $4, email = $5, observacoes = $6 where id = $1 returning id`,
        [id, nome, doc, telefone, email, observacoes]
      );
      if (!r.length) return { erro: "Cadastro não encontrado." };
    } else {
      await query(
        `insert into ${tabela} (nome, documento, telefone, email, observacoes) values ($1, $2, $3, $4, $5)`,
        [nome, doc, telefone, email, observacoes]
      );
    }
  } catch (e) {
    if (duplicado(e)) {
      const [outro] = await query<{ nome: string }>(`select nome from ${tabela} where documento = $1`, [doc]);
      return { erro: `Já existe ${tipo === "fornecedor" ? "um fornecedor" : "um cliente"} com esse CNPJ/CPF${outro ? `: ${outro.nome}` : ""}.` };
    }
    throw e;
  }
  revalidatePath("/financeiro", "layout");
  return { ok: id ? "Cadastro salvo." : "Cadastro criado." };
}

export async function excluirCadastro(tipo: TipoCadastro, id: string): Promise<{ erro?: string; ok?: string }> {
  await exigirAcesso("cadastros");
  const tabela = TABELA[tipo];
  if (!tabela) return { erro: "Tipo de cadastro inválido." };
  const col = tipo === "fornecedor" ? "fornecedor_id" : "cliente_id";
  const [u] = await query<{ lanc: number; rec: number; notas: number }>(
    `select (select count(*)::int from lancamentos where ${col} = $1) as lanc,
            (select count(*)::int from recorrencias where ${col} = $1) as rec,
            ${tipo === "fornecedor" ? "(select count(*)::int from notas_fiscais where fornecedor_id = $1)" : "0"} as notas`,
    [id]
  );
  const motivos = [
    u.lanc && `${u.lanc} lançamento(s)`,
    u.notas && `${u.notas} nota(s) fiscal(is)`,
    u.rec && `${u.rec} conta(s) fixa(s)`,
  ].filter(Boolean);
  if (motivos.length) return { erro: `Não pode excluir: está ligado a ${motivos.join(", ")}.` };
  await query(`delete from ${tabela} where id = $1`, [id]);
  revalidatePath("/financeiro", "layout");
  return { ok: "Cadastro excluído." };
}
