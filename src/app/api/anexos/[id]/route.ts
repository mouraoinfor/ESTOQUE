import { query } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { podeAcessar } from "@/lib/modulos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Login já é exigido pelo middleware (rotas /api/*). Devolve UMA parte do anexo (?parte=n);
// o navegador junta as partes (a resposta de uma função da Vercel tem limite de 4,5 MB).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await sessaoAtual();
  if (!s || !(podeAcessar(s, "orcamentos") || podeAcessar(s, "projetos"))) return new Response("Sem acesso", { status: 403 });
  const { id } = await params;
  const parte = Number(new URL(req.url).searchParams.get("parte") ?? "0");
  if (!UUID.test(id) || !Number.isInteger(parte) || parte < 0) return new Response("Não encontrado", { status: 404 });
  const [p] = await query<{ b64: string }>(
    `select encode(p.dados, 'base64') as b64
       from orcamento_anexo_partes p join orcamento_anexos a on a.id = p.anexo_id
      where p.anexo_id = $1 and p.ordem = $2 and a.completo`,
    [id, parte]
  );
  if (!p) return new Response("Não encontrado", { status: 404 });
  return new Response(Buffer.from(p.b64, "base64"), {
    headers: { "Content-Type": "application/octet-stream", "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
