import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { query } from "./db";

export const COOKIE_EMPRESA = "empresa_id";

export interface Empresa {
  id: string;
  nome: string;
  documento: string | null;
}

// Empresa (CNPJ) selecionada no menu; sem escolha válida, usa a primeira cadastrada.
// Retorna atual = null quando ainda não existe nenhuma empresa.
export const empresaAtual = cache(async () => {
  const todas = await query<Empresa>("select id, nome, documento from empresas order by nome");
  const escolhida = (await cookies()).get(COOKIE_EMPRESA)?.value;
  const atual = todas.find((e) => e.id === escolhida) ?? todas[0] ?? null;
  return { atual, todas };
});
