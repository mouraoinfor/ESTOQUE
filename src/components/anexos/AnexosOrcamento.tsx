"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icone from "@/components/Icone";
import { cancelarAnexo, concluirAnexo, enviarParteAnexo, excluirAnexo, iniciarAnexo, renomearAnexo } from "@/app/acoes-anexos";
import { MAX_ANEXO_BYTES, PARTE_BYTES, tamanhoTexto, type Anexo } from "./tipos";

const FUSO = "America/Sao_Paulo";
// O navegador mostra esses tipos numa aba; os outros (DWG, planilha...) são baixados
const VISUALIZA = /^(application\/pdf|image\/|text\/)/;

// Baixa as partes do anexo e junta num arquivo no navegador
async function montarArquivo(a: Anexo) {
  const partes: Blob[] = [];
  for (let i = 0; i < a.partes; i++) {
    const r = await fetch(`/api/anexos/${a.id}?parte=${i}`);
    if (!r.ok) throw new Error("Não foi possível baixar o arquivo.");
    partes.push(await r.blob());
  }
  return new Blob(partes, { type: a.mime });
}

// Documentos do orçamento (planta, memorial, fotos do local...)
export default function AnexosOrcamento({ orcamentoId, anexos, podeEditar }: { orcamentoId: string; anexos: Anexo[]; podeEditar: boolean }) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [envio, setEnvio] = useState<{ nome: string; pct: number } | null>(null);
  const [erro, setErro] = useState("");
  const [sobre, setSobre] = useState(false);
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  async function enviar(arquivos: File[]) {
    setErro("");
    const erros: string[] = [];
    for (const f of arquivos) {
      if (f.size > MAX_ANEXO_BYTES) { erros.push(`${f.name}: maior que ${MAX_ANEXO_BYTES / 1024 / 1024} MB.`); continue; }
      setEnvio({ nome: f.name, pct: 0 });
      const r = await iniciarAnexo(orcamentoId, f.name, f.type, f.size);
      if ("erro" in r) { erros.push(r.erro); continue; }
      const { id, partes } = r.ok;
      let falhou = "";
      for (let i = 0; i < partes && !falhou; i++) {
        const fd = new FormData();
        fd.set("parte", f.slice(i * PARTE_BYTES, (i + 1) * PARTE_BYTES));
        const p = await enviarParteAnexo(id, i, fd).catch((e: unknown) => ({ erro: e instanceof Error ? e.message : "Falha no envio." }));
        if ("erro" in p) falhou = p.erro;
        else setEnvio({ nome: f.name, pct: Math.round(((i + 1) / partes) * 100) });
      }
      if (falhou) { await cancelarAnexo(id); erros.push(`${f.name}: ${falhou}`); continue; }
      const c = await concluirAnexo(id);
      if ("erro" in c) erros.push(`${f.name}: ${c.erro}`);
    }
    setEnvio(null);
    if (erros.length) setErro(erros.join(" "));
    router.refresh();
  }

  async function abrir(a: Anexo, baixar: boolean) {
    setErro("");
    const mostrar = !baixar && VISUALIZA.test(a.mime);
    // A aba é aberta já no clique (senão o navegador bloqueia como pop-up) e recebe o arquivo depois
    const aba = mostrar ? window.open("", "_blank") : null;
    setAbrindo(a.id);
    try {
      const url = URL.createObjectURL(await montarArquivo(a));
      if (aba) aba.location.href = url;
      else {
        const link = document.createElement("a");
        link.href = url;
        link.download = a.nome;
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      aba?.close();
      setErro(e instanceof Error ? e.message : "Não foi possível abrir o arquivo.");
    } finally {
      setAbrindo(null);
    }
  }

  function excluir(a: Anexo) {
    if (!window.confirm(`Excluir o anexo "${a.nome}"?`)) return;
    iniciar(async () => {
      const r = await excluirAnexo(a.id);
      if ("erro" in r) setErro(r.erro);
      router.refresh();
    });
  }

  function renomear(a: Anexo) {
    const nome = window.prompt("Novo nome do arquivo:", a.nome);
    if (!nome || nome.trim() === a.nome) return;
    iniciar(async () => {
      const r = await renomearAnexo(a.id, nome);
      if ("erro" in r) setErro(r.erro);
      router.refresh();
    });
  }

  const ocupado = !!envio || pendente;

  return (
    <div className="card">
      <h3><Icone nome="anexo" tamanho={16} /> Documentos e anexos</h3>
      <p className="small muted">Planta do projeto, memorial, fotos do local, proposta assinada... (até {MAX_ANEXO_BYTES / 1024 / 1024} MB por arquivo)</p>
      {erro && <div className="alert error">{erro}</div>}

      {podeEditar && (
        <div
          className={`anexo-soltar${sobre ? " sobre" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setSobre(true); }}
          onDragLeave={() => setSobre(false)}
          onDrop={(e) => { e.preventDefault(); setSobre(false); if (!ocupado && e.dataTransfer.files.length) enviar([...e.dataTransfer.files]); }}
        >
          {envio ? (
            <div className="anexo-progresso">
              <span className="small">Enviando {envio.nome}... {envio.pct}%</span>
              <div className="anexo-barra"><div style={{ width: `${envio.pct}%` }} /></div>
            </div>
          ) : (
            <>
              <span className="small muted">Arraste os arquivos para cá ou</span>
              <button type="button" className="btn small" disabled={ocupado} onClick={() => entrada.current?.click()}>
                <Icone nome="upload" tamanho={14} /> Escolher arquivos
              </button>
            </>
          )}
          <input ref={entrada} type="file" multiple hidden onChange={(e) => { const fs = [...(e.target.files ?? [])]; e.target.value = ""; if (fs.length) enviar(fs); }} />
        </div>
      )}

      {!anexos.length && <p className="small muted">Nenhum documento anexado.</p>}
      {anexos.map((a) => (
        <div key={a.id} className="anexo-linha">
          <button type="button" className="anexo-nome" onClick={() => abrir(a, false)} disabled={abrindo === a.id} title="Abrir">
            <Icone nome={a.mime.startsWith("image/") ? "camera" : "nota"} tamanho={16} />
            <span>
              <strong>{a.nome}</strong>
              <span className="small muted">
                {" "}· {tamanhoTexto(a.tamanho)} · {new Date(a.created_at).toLocaleDateString("pt-BR", { timeZone: FUSO })}
                {a.usuario && ` · ${a.usuario}`}
                {abrindo === a.id && " · abrindo..."}
              </span>
            </span>
          </button>
          <div className="actions">
            <button type="button" className="btn small" onClick={() => abrir(a, true)} disabled={abrindo === a.id} title="Baixar" aria-label="Baixar">
              <Icone nome="baixar" tamanho={14} />
            </button>
            {podeEditar && (
              <>
                <button type="button" className="btn small" onClick={() => renomear(a)} disabled={ocupado} title="Renomear" aria-label="Renomear"><Icone nome="editar" tamanho={14} /></button>
                <button type="button" className="btn small danger" onClick={() => excluir(a)} disabled={ocupado} title="Excluir" aria-label="Excluir"><Icone nome="lixo" tamanho={14} /></button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
