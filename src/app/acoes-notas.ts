"use server";

import { revalidatePath } from "next/cache";
import { db, query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { estornarBaixa } from "@/lib/financeiro";
import { podeAcessar } from "@/lib/modulos";
import {
  adicionarParcela,
  analisarNota,
  editarParcela,
  excluirNota,
  excluirParcela,
  importarNota,
  lerNFeServidor,
  type AcessoBanco,
  type Analise,
  type EntradaImportacao,
  type ResultadoExclusao,
} from "@/lib/nfe-importar";

function banco(): AcessoBanco {
  const sql = db();
  return {
    query: (texto, params = []) => query(texto, params),
    transacao: (comandos) => sql.transaction(comandos.map((c) => sql.query(c.texto, c.params))),
  };
}

function erroMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

// Confere no banco o que já existe para a nota (duplicada, fornecedor, empresa, sugestões de produto)
export async function analisarNotaAcao(xml: string): Promise<{ erro: string } | { ok: Analise }> {
  await exigirAcesso("notas");
  const lido = lerNFeServidor(String(xml ?? ""));
  if ("erro" in lido) return { erro: lido.erro };
  try {
    return { ok: await analisarNota(banco(), lido.nfe) };
  } catch (e) {
    return { erro: erroMsg(e) };
  }
}

export async function importarNotaAcao(entrada: EntradaImportacao): Promise<{ erro: string } | { ok: { id: string } }> {
  const s = await exigirAcesso("notas");
  try {
    const r = await importarNota(banco(), entrada, { email: s.email, podePagar: podeAcessar(s, "pagar") });
    if ("ok" in r) revalidatePath("/", "layout");
    return r;
  } catch (e) {
    return { erro: erroMsg(e) };
  }
}

// Excluir a nota inteira. Sem opções, devolve as parcelas pagas / faltas de estoque para a tela perguntar.
export async function excluirNotaAcao(
  id: string,
  opcoes: { estornarPagas?: boolean; parcial?: boolean } = {}
): Promise<ResultadoExclusao> {
  const s = await exigirAcesso("notas");
  if (opcoes.estornarPagas && !podeAcessar(s, "pagar")) {
    return { erro: "Estornar baixas exige acesso ao contas a pagar. Peça a quem tem acesso." };
  }
  try {
    const r = await excluirNota(banco(), String(id ?? ""), s.email, {
      estornarPagas: !!opcoes.estornarPagas,
      parcial: !!opcoes.parcial,
      estornar: estornarBaixa,
    });
    revalidatePath("/", "layout");
    return r;
  } catch (e) {
    return { erro: erroMsg(e) };
  }
}

// Parcelas da nota (exigem também acesso ao contas a pagar)
async function exigirPagar() {
  const s = await exigirAcesso("notas");
  return podeAcessar(s, "pagar");
}

export async function editarParcelaAcao(id: string, vencimento: string, valor: number, documento: string | null) {
  if (!(await exigirPagar())) return { erro: "Sem acesso ao contas a pagar." };
  try {
    const r = await editarParcela(banco(), String(id), String(vencimento), Number(valor), documento);
    if ("ok" in r) revalidatePath(`/notas/${r.ok.notaId}`);
    return r;
  } catch (e) {
    return { erro: erroMsg(e) };
  }
}

export async function excluirParcelaAcao(id: string) {
  if (!(await exigirPagar())) return { erro: "Sem acesso ao contas a pagar." };
  try {
    const r = await excluirParcela(banco(), String(id));
    if ("ok" in r) revalidatePath(`/notas/${r.ok.notaId}`);
    return r;
  } catch (e) {
    return { erro: erroMsg(e) };
  }
}

export async function adicionarParcelaAcao(notaId: string, vencimento: string, valor: number, documento: string | null) {
  if (!(await exigirPagar())) return { erro: "Sem acesso ao contas a pagar." };
  try {
    const r = await adicionarParcela(banco(), String(notaId), String(vencimento), Number(valor), documento);
    if ("ok" in r) revalidatePath(`/notas/${notaId}`);
    return r;
  } catch (e) {
    return { erro: erroMsg(e) };
  }
}
