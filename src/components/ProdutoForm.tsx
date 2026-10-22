"use client";

import { useState, useTransition } from "react";
import { CANAL_LABEL, CATEGORIAS, CONDICAO_LABEL, STATUS_LABEL, type Produto } from "@/lib/types";
import { criarProduto, salvarProduto } from "@/app/actions";

function fichaParaTexto(f: Record<string, string> | undefined) {
  if (!f) return "";
  return Object.entries(f).map(([k, v]) => `${k}: ${v}`).join("\n");
}

type Aba = "estoque" | "anuncio" | "envio";

export default function ProdutoForm({ produto }: { produto?: Produto }) {
  const novo = !produto;
  const [aba, setAba] = useState<Aba>("estoque");
  const [tituloMl, setTituloMl] = useState(produto?.titulo_ml ?? "");
  const [tituloOlx, setTituloOlx] = useState(produto?.titulo_olx ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [msg, setMsg] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [salvando, startTransition] = useTransition();

  function enviar(fd: FormData) {
    setMsg(null);
    startTransition(async () => {
      const res = novo ? await criarProduto(fd) : await salvarProduto(produto!.id, fd);
      if (res && "erro" in res && res.erro) setMsg({ tipo: "error", texto: res.erro });
      else setMsg({ tipo: "ok", texto: "Salvo!" });
    });
  }

  const sec = (a: Aba) => ({ display: aba === a ? "block" : "none" });

  return (
    <form action={enviar} className="card">
      <div className="tabs">
        <button type="button" className={aba === "estoque" ? "active" : ""} onClick={() => setAba("estoque")}>Estoque</button>
        <button type="button" className={aba === "anuncio" ? "active" : ""} onClick={() => setAba("anuncio")}>Anúncio</button>
        <button type="button" className={aba === "envio" ? "active" : ""} onClick={() => setAba("envio")}>Preço e envio</button>
      </div>

      {/* ESTOQUE */}
      <div style={sec("estoque")}>
        <label className="field"><span>Nome do produto *</span>
          <input type="text" name="nome" defaultValue={produto?.nome} required />
        </label>
        {produto?.nome_original && <p className="small muted" style={{ marginTop: "-.5rem" }}>Nome na lista original: {produto.nome_original}</p>}
        <div className="grid2">
          <label className="field"><span>Marca</span><input type="text" name="marca" defaultValue={produto?.marca ?? ""} /></label>
          <label className="field"><span>Modelo</span><input type="text" name="modelo" defaultValue={produto?.modelo ?? ""} /></label>
          <label className="field"><span>Categoria</span>
            <select name="categoria" defaultValue={produto?.categoria ?? ""}>
              <option value="">—</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="field"><span>Condição</span>
            <select name="condicao" defaultValue={produto?.condicao ?? "novo"}>
              {Object.entries(CONDICAO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {novo && (
            <label className="field"><span>Quantidade inicial</span><input type="number" name="quantidade" min={0} defaultValue={1} /></label>
          )}
          <label className="field"><span>Localização (prateleira, caixa...)</span><input type="text" name="localizacao" defaultValue={produto?.localizacao ?? ""} /></label>
          <label className="field"><span>Status</span>
            <select name="status" defaultValue={produto?.status ?? "a_revisar"}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="field"><span>Canal de venda</span>
            <select name="canal" defaultValue={produto?.canal ?? "mercado_livre"}>
              {Object.entries(CANAL_LABEL).map(([k, v]) => <option key={k} value={k}>{k === "nenhum" ? "Nenhum" : v}</option>)}
            </select>
          </label>
        </div>
        <input type="hidden" name="para_venda_presente" value="1" />
        <label className="field" style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
          <input type="checkbox" name="para_venda" defaultChecked={produto?.para_venda ?? true} />
          <strong>Disponível para venda</strong> <span className="muted small">(desmarque para itens só de estoque)</span>
        </label>
        <label className="field"><span>Observações internas</span><textarea name="observacoes" defaultValue={produto?.observacoes ?? ""} style={{ minHeight: 70 }} /></label>
        <label className="field"><span>Pendências (o que falta conferir)</span><textarea name="pendencias" defaultValue={produto?.pendencias ?? ""} style={{ minHeight: 70 }} /></label>
      </div>

      {/* ANÚNCIO */}
      <div style={sec("anuncio")}>
        <label className="field">
          <span>Título Mercado Livre <span className={`counter ${tituloMl.length > 60 ? "over" : ""}`}>{tituloMl.length}/60</span></span>
          <input type="text" name="titulo_ml" value={tituloMl} onChange={(e) => setTituloMl(e.target.value)} />
        </label>
        <label className="field">
          <span>Título OLX <span className={`counter ${tituloOlx.length > 70 ? "over" : ""}`}>{tituloOlx.length}/70</span></span>
          <input type="text" name="titulo_olx" value={tituloOlx} onChange={(e) => setTituloOlx(e.target.value)} />
        </label>
        <label className="field">
          <span>Descrição <span className="counter">{descricao.length} caracteres</span></span>
          <textarea className="tall" name="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </label>
        <label className="field"><span>Ficha técnica (uma por linha, no formato &quot;Atributo: Valor&quot;)</span>
          <textarea name="ficha_tecnica" defaultValue={fichaParaTexto(produto?.ficha_tecnica)} style={{ minHeight: 200, fontFamily: "ui-monospace, monospace", fontSize: ".85rem" }} />
        </label>
        <div className="grid2">
          <label className="field"><span>Categoria no Mercado Livre</span><input type="text" name="categoria_ml" defaultValue={produto?.categoria_ml ?? ""} /></label>
          <label className="field"><span>Categoria na OLX</span><input type="text" name="categoria_olx" defaultValue={produto?.categoria_olx ?? ""} /></label>
        </div>
        <label className="field"><span>Palavras-chave (separadas por vírgula)</span><input type="text" name="palavras_chave" defaultValue={produto?.palavras_chave?.join(", ") ?? ""} /></label>
        <label className="field"><span>Conteúdo da embalagem</span><input type="text" name="conteudo_embalagem" defaultValue={produto?.conteudo_embalagem ?? ""} /></label>
        <div className="grid2">
          <label className="field"><span>Garantia</span><input type="text" name="garantia" defaultValue={produto?.garantia ?? ""} /></label>
          <label className="field"><span>Código EAN/GTIN</span><input type="text" name="gtin" defaultValue={produto?.gtin ?? ""} /></label>
        </div>
        <label className="field"><span>Link do anúncio publicado</span><input type="url" name="link_anuncio" defaultValue={produto?.link_anuncio ?? ""} placeholder="https://..." /></label>
      </div>

      {/* PREÇO E ENVIO */}
      <div style={sec("envio")}>
        <div className="grid4">
          <label className="field"><span>Preço de venda (R$)</span><input type="number" step="0.01" name="preco_venda" defaultValue={produto?.preco_venda ?? ""} /></label>
          <label className="field"><span>Preço sugerido (R$)</span><input type="number" step="0.01" name="preco_sugerido" defaultValue={produto?.preco_sugerido ?? ""} /></label>
          <label className="field"><span>Mín. mercado (R$)</span><input type="number" step="0.01" name="preco_min" defaultValue={produto?.preco_min ?? ""} /></label>
          <label className="field"><span>Máx. mercado (R$)</span><input type="number" step="0.01" name="preco_max" defaultValue={produto?.preco_max ?? ""} /></label>
          <label className="field"><span>Custo (R$)</span><input type="number" step="0.01" name="custo" defaultValue={produto?.custo ?? ""} /></label>
        </div>
        <h3>Embalagem (para cálculo de frete)</h3>
        <div className="grid4">
          <label className="field"><span>Peso (kg)</span><input type="number" step="0.001" name="peso_kg" defaultValue={produto?.peso_kg ?? ""} /></label>
          <label className="field"><span>Altura (cm)</span><input type="number" step="0.1" name="altura_cm" defaultValue={produto?.altura_cm ?? ""} /></label>
          <label className="field"><span>Largura (cm)</span><input type="number" step="0.1" name="largura_cm" defaultValue={produto?.largura_cm ?? ""} /></label>
          <label className="field"><span>Comprimento (cm)</span><input type="number" step="0.1" name="comprimento_cm" defaultValue={produto?.comprimento_cm ?? ""} /></label>
        </div>
      </div>

      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}
      <div className="actions">
        <button className="btn primary" type="submit" disabled={salvando}>{salvando ? "Salvando..." : novo ? "Cadastrar item" : "Salvar alterações"}</button>
      </div>
    </form>
  );
}
