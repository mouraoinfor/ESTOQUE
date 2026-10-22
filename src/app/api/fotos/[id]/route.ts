import { query } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { podeAcessar } from "@/lib/modulos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Login já é exigido pelo middleware (rotas /api/*); fotos aparecem em itens e anúncios
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await sessaoAtual();
  if (!s || !(podeAcessar(s, "itens") || podeAcessar(s, "anuncios"))) return new Response("Sem acesso", { status: 403 });
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Não encontrado", { status: 404 });
  const [f] = await query<{ mime: string; b64: string }>(
    "select mime, encode(dados, 'base64') as b64 from fotos where id = $1",
    [id]
  );
  if (!f) return new Response("Não encontrado", { status: 404 });
  return new Response(Buffer.from(f.b64, "base64"), {
    headers: {
      "Content-Type": f.mime,
      // A foto de um id nunca muda
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
