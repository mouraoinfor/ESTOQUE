// Gera db/seed.sql com todos os itens (aplicado por npm run db:setup, depois do schema.sql)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { montarProdutos } from "./montar-produtos.mjs";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function lit(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) return v.length ? `array[${v.map(lit).join(", ")}]::text[]` : "'{}'::text[]";
  if (typeof v === "object") return `${lit(JSON.stringify(v))}::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

const { produtos, avisos } = montarProdutos();
const colunas = Object.keys(produtos[0]);

const sql = [
  "-- Gerado por scripts/gerar-seed.mjs a partir de ESTOQUE ATUAL.txt + pesquisa",
  "-- Aplicado DEPOIS do schema.sql (só funciona com a tabela vazia).",
  "",
  "do $$ begin",
  "  if exists (select 1 from public.produtos) then",
  "    raise exception 'A tabela produtos já tem dados — seed não aplicado.';",
  "  end if;",
  "end $$;",
  "",
  `insert into public.produtos (${colunas.join(", ")}) values`,
  produtos.map((p) => `  (${colunas.map((c) => lit(p[c])).join(", ")})`).join(",\n") + ";",
  "",
  "select setval(pg_get_serial_sequence('public.produtos', 'codigo'), (select max(codigo) from public.produtos));",
  "",
  "insert into public.movimentacoes (produto_id, tipo, quantidade, saldo_apos, motivo, usuario)",
  "select id, 'entrada', quantidade, quantidade, 'Estoque inicial (ESTOQUE ATUAL.txt)', 'importação'",
  "from public.produtos where quantidade > 0;",
  "",
].join("\n");

fs.writeFileSync(path.join(raiz, "db", "seed.sql"), sql, "utf8");
console.log(`seed.sql gerado com ${produtos.length} produtos.`);
if (avisos.length) console.log("Avisos:\n - " + avisos.join("\n - "));
