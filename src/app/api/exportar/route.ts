import { query } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { podeAcessar } from "@/lib/modulos";

function csv(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const COLUNAS = [
  "codigo", "nome", "marca", "modelo", "categoria", "condicao", "quantidade", "localizacao", "para_venda", "canal",
  "status", "preco_venda", "preco_sugerido", "preco_min", "preco_max", "custo", "titulo_ml", "titulo_olx",
  "categoria_ml", "categoria_olx", "gtin", "garantia", "peso_kg", "altura_cm", "largura_cm", "comprimento_cm",
  "descricao", "ficha_tecnica", "palavras_chave", "pendencias", "observacoes", "link_anuncio",
];

// Login já é exigido pelo middleware (rotas /api/*); aqui confere o acesso ao módulo
export async function GET() {
  const s = await sessaoAtual();
  if (!s || !podeAcessar(s, "itens")) return new Response("Sem acesso", { status: 403 });
  const produtos = await query(`select ${COLUNAS.join(", ")} from produtos order by codigo`);
  const linhas = [COLUNAS.join(";"), ...produtos.map((p) => COLUNAS.map((c) => csv(p[c])).join(";"))];

  // BOM para o Excel abrir com acentos corretos
  return new Response("﻿" + linhas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="estoque-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
