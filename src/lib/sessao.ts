// Assinatura e leitura do cookie de sessão (funciona no middleware/edge e no servidor)
import { jwtVerify, SignJWT } from "jose";

export const COOKIE_SESSAO = "estoque_sessao";
export const DURACAO_SESSAO_S = 60 * 60 * 24 * 30; // 30 dias

export interface Sessao {
  id: string;
  email: string;
  nome: string | null;
}

function chave() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET ausente ou curta (mínimo 32 caracteres)");
  return new TextEncoder().encode(s);
}

export async function assinarSessao(s: Sessao) {
  return new SignJWT({ email: s.email, nome: s.nome })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.id)
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SESSAO_S}s`)
    .sign(chave());
}

export async function lerSessao(token: string | undefined): Promise<Sessao | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave());
    return { id: payload.sub!, email: String(payload.email), nome: (payload.nome as string) ?? null };
  } catch {
    return null;
  }
}
