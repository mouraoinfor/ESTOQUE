// Cria as tabelas (db/schema.sql) e, se o banco estiver vazio, lança os itens (db/seed.sql).
// Uso: npm run db:setup
import fs from "node:fs";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";
import { raiz } from "./env.mjs";

// Pool (WebSocket) aceita vários comandos num só envio; o Node 22+ já tem WebSocket nativo
// Conexão direta (sem pooler) é a recomendada para migrações
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL });

try {
  await pool.query(fs.readFileSync(path.join(raiz, "db", "schema.sql"), "utf8"));
  console.log("Schema aplicado.");

  const { rows } = await pool.query("select count(*)::int as n from produtos");
  if (rows[0].n > 0) {
    console.log(`Tabela produtos já tem ${rows[0].n} itens — seed ignorado.`);
  } else {
    await pool.query(fs.readFileSync(path.join(raiz, "db", "seed.sql"), "utf8"));
    const r = await pool.query("select count(*)::int as n, coalesce(sum(quantidade), 0)::int as un from produtos");
    console.log(`Seed aplicado: ${r.rows[0].n} produtos, ${r.rows[0].un} unidades.`);
  }
} finally {
  await pool.end();
}
