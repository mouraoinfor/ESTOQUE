// Cria (ou redefine a senha de) um usuário do sistema.
// Uso: npm run criar-usuario -- email@exemplo.com "Nome" [senha]
// Sem senha, gera uma aleatória e mostra no terminal.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import "./env.mjs";

const [email, nome, senhaArg] = process.argv.slice(2);
if (!email?.includes("@")) {
  console.error('Uso: npm run criar-usuario -- email@exemplo.com "Nome" [senha]');
  process.exit(1);
}
const senha = senhaArg || crypto.randomBytes(9).toString("base64url");
if (senha.length < 8) {
  console.error("A senha precisa ter pelo menos 8 caracteres.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
await sql.query(
  `insert into usuarios (email, nome, senha_hash) values ($1, $2, $3)
   on conflict (email) do update set senha_hash = excluded.senha_hash, nome = coalesce(excluded.nome, usuarios.nome)`,
  [email.trim().toLowerCase(), nome || null, await bcrypt.hash(senha, 10)]
);
console.log(`Usuário pronto: ${email}`);
if (!senhaArg) console.log(`Senha gerada: ${senha}  (troque em "Minha conta" depois de entrar)`);
