// Carrega .env.local / .env para os scripts (o Next faz isso sozinho no app)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const nome of [".env.local", ".env"]) {
  const p = path.join(raiz, nome);
  if (!fs.existsSync(p)) continue;
  for (const linha of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não encontrada no .env.local / .env (rode neon deploy ou neon env pull).");
  process.exit(1);
}
