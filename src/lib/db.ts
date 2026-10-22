import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Driver HTTP da Neon: ideal para funções serverless da Vercel (sem conexão persistente)
let cliente: NeonQueryFunction<false, false> | null = null;

export function db() {
  if (!cliente) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não configurada");
    cliente = neon(url);
  }
  return cliente;
}

// Consulta parametrizada com SQL montado no código ($1, $2...)
export async function query<T = Record<string, unknown>>(texto: string, params: unknown[] = []) {
  return (await db().query(texto, params)) as T[];
}
