import { query } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { podeAcessar } from "@/lib/modulos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Download do XML original da NF-e importada
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await sessaoAtual();
  if (!s) return new Response("Não autorizado", { status: 401 });
  if (!podeAcessar(s, "notas")) return new Response("Sem acesso", { status: 403 });
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Não encontrado", { status: 404 });
  const [n] = await query<{ xml: string | null; chave: string | null; numero: string | null }>(
    "select xml, chave, numero from notas_fiscais where id = $1",
    [id]
  );
  if (!n || !n.xml) return new Response("Não encontrado", { status: 404 });
  const nome = `${(n.chave || `NF-${n.numero ?? id}`).replace(/[^\w.-]/g, "")}-nfe.xml`;
  return new Response(n.xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
