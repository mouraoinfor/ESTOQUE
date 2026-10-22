"use client";

import { useState } from "react";
import { enviarFoto, removerFoto } from "@/app/actions";
import Icone from "./Icone";

const LADO_MAX = 1600;

// Redimensiona no navegador para JPEG (economiza banco e deixa no padrão do ML)
async function reduzir(arq: File): Promise<Blob> {
  const bmp = await createImageBitmap(arq);
  const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * escala);
  canvas.height = Math.round(bmp.height * escala);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // PNG transparente vira fundo branco
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error("Falha ao converter imagem"))), "image/jpeg", 0.85));
}

export default function Fotos({ produtoId, fotos: iniciais }: { produtoId: string; fotos: string[] }) {
  const [fotos, setFotos] = useState(iniciais);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const arquivos = Array.from(input.files ?? []);
    if (!arquivos.length) return;
    setErro(null);
    setEnviando(true);
    for (const arq of arquivos) {
      try {
        const fd = new FormData();
        fd.append("foto", new File([await reduzir(arq)], "foto.jpg", { type: "image/jpeg" }));
        const r = await enviarFoto(produtoId, fd);
        if ("erro" in r && r.erro) setErro(r.erro);
        else if ("id" in r && r.id) setFotos((l) => [...l, r.id!]);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao enviar foto");
      }
    }
    setEnviando(false);
    input.value = "";
  }

  async function remover(id: string) {
    await removerFoto(id);
    setFotos((l) => l.filter((f) => f !== id));
  }

  return (
    <div className="card">
      <h3>Fotos</h3>
      <p className="small muted">Mercado Livre: fundo branco, sem logos/textos, mínimo 500px. A primeira foto é a capa.</p>
      <div className="photos" style={{ marginBottom: ".75rem" }}>
        {fotos.map((id) => (
          <div className="ph" key={id}>
            <a href={`/api/fotos/${id}`} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/fotos/${id}`} alt="" />
            </a>
            <button type="button" className="btn small danger" onClick={() => remover(id)} aria-label="Remover foto"><Icone nome="fechar" tamanho={14} /></button>
          </div>
        ))}
        {!fotos.length && <span className="muted small">Nenhuma foto ainda.</span>}
      </div>
      {erro && <div className="alert error">{erro}</div>}
      <label className="btn">
        {enviando ? "Enviando..." : <><Icone nome="camera" tamanho={16} /> Adicionar fotos</>}
        <input type="file" accept="image/*" multiple onChange={enviar} disabled={enviando} style={{ display: "none" }} />
      </label>
    </div>
  );
}
