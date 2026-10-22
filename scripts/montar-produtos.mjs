// Junta data/itens-base.json (lista do TXT) com data/pesquisa/lote-*.json (pesquisa)
// e devolve as linhas prontas para a tabela produtos.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function montarProdutos() {
  const base = JSON.parse(fs.readFileSync(path.join(raiz, "data", "itens-base.json"), "utf8"));
  const dirPesquisa = path.join(raiz, "data", "pesquisa");
  const pesquisa = new Map();
  if (fs.existsSync(dirPesquisa)) {
    for (const arq of fs.readdirSync(dirPesquisa).filter((f) => f.endsWith(".json")).sort()) {
      for (const r of JSON.parse(fs.readFileSync(path.join(dirPesquisa, arq), "utf8"))) pesquisa.set(r.id, r);
    }
  }

  const avisos = [];
  const produtos = base.map((b) => {
    const r = pesquisa.get(b.id);
    if (!r) avisos.push(`item ${b.id} sem pesquisa`);
    // A obs do dono só entra se a pesquisa não tiver tratado o mesmo alerta
    const obsAlerta = /^(PENDENTE|ATENÇÃO)/.test(b.obs ?? "") && !/PENDENTE|ATENÇÃO/.test(r?.pendencias ?? "");
    const pendencias = [obsAlerta ? b.obs : null, r?.pendencias || null]
      .filter(Boolean)
      .join(" | ") || (r ? null : "Item sem pesquisa — preencher dados do anúncio");

    const canal = !b.para_venda ? "nenhum" : b.condicao === "usado" ? "olx" : "mercado_livre";
    let status = "a_revisar";
    if (!b.para_venda) status = "somente_estoque";
    else if (r?.confianca === "alta" && !r?.pendencias && r?.preco_sugerido) status = "pronto";

    return {
      codigo: b.id,
      nome: r?.nome || b.nome_original,
      nome_original: b.nome_original,
      marca: r?.marca ?? null,
      modelo: r?.modelo ?? null,
      categoria: r?.categoria ?? null,
      condicao: b.condicao,
      quantidade: b.quantidade,
      para_venda: b.para_venda,
      canal,
      status,
      observacoes: b.obs || null,
      titulo_ml: r?.titulo_ml ?? null,
      titulo_olx: r?.titulo_olx ?? null,
      descricao: r?.descricao ?? null,
      ficha_tecnica: r?.ficha_tecnica ?? {},
      palavras_chave: r?.palavras_chave ?? [],
      categoria_ml: r?.categoria_ml ?? null,
      categoria_olx: r?.categoria_olx ?? null,
      conteudo_embalagem: r?.conteudo_embalagem ?? null,
      garantia: r?.garantia ?? null,
      gtin: r?.gtin ?? null,
      peso_kg: r?.peso_kg ?? null,
      altura_cm: r?.dimensoes_cm?.altura ?? null,
      largura_cm: r?.dimensoes_cm?.largura ?? null,
      comprimento_cm: r?.dimensoes_cm?.comprimento ?? null,
      preco_sugerido: b.para_venda ? r?.preco_sugerido ?? null : null,
      preco_min: r?.preco_min ?? null,
      preco_max: r?.preco_max ?? null,
      fontes: r?.fontes ?? [],
      confianca: r?.confianca ?? null,
      pendencias,
    };
  });
  return { produtos, avisos };
}
