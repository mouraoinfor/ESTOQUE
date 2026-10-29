"use client";

import { useEffect, useRef, useState } from "react";
import { formatarDocumento } from "@/lib/formato";
import Icone from "@/components/Icone";
import CertificadoFolhas, { CERTIFICADO_PADRAO, certificadoParaUrl, type DadosCertificado } from "./CertificadoFolhas";

export interface FuncionarioCertificado {
  id: string;
  nome: string;
  documento: string | null;
}

// A4 paisagem (297mm) em pixels CSS
const LARGURA_FOLHA = 297 * (96 / 25.4);

export default function CertificadoForm({ funcionarios, hoje }: { funcionarios: FuncionarioCertificado[]; hoje: string }) {
  const [d, setD] = useState<DadosCertificado>({ ...CERTIFICADO_PADRAO, inicio: hoje, fim: hoje });
  const [funcionarioId, setFuncionarioId] = useState("");
  const previa = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0.5);

  // Prévia encolhida para caber na largura da coluna
  useEffect(() => {
    const el = previa.current;
    if (!el) return;
    const ajustar = () => setEscala(Math.min(1, (el.clientWidth - 24) / LARGURA_FOLHA));
    ajustar();
    const obs = new ResizeObserver(ajustar);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const muda = (campo: keyof DadosCertificado) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setD((v) => ({ ...v, [campo]: e.target.value }));

  function escolherFuncionario(id: string) {
    setFuncionarioId(id);
    const f = funcionarios.find((x) => x.id === id);
    if (f) setD((v) => ({ ...v, nome: f.nome, cpf: f.documento ? formatarDocumento(f.documento) : "" }));
  }

  return (
    <div className="cert-tela">
      <div className="card">
        <label className="field">
          <span>Funcionário cadastrado (preenche nome e CPF)</span>
          <select value={funcionarioId} onChange={(e) => escolherFuncionario(e.target.value)}>
            <option value="">Digitar manualmente</option>
            {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </label>
        <label className="field"><span>Nome do colaborador</span><input value={d.nome} onChange={muda("nome")} /></label>
        <div className="grid2">
          <label className="field"><span>CPF</span><input value={d.cpf} onChange={muda("cpf")} placeholder="000.000.000-00" /></label>
          <label className="field"><span>Carga horária (horas)</span><input value={d.horas} onChange={muda("horas")} /></label>
        </div>
        <label className="field"><span>Curso</span><input value={d.curso} onChange={muda("curso")} /></label>
        <div className="grid2">
          <label className="field"><span>Data de início</span><input type="date" value={d.inicio} onChange={muda("inicio")} /></label>
          <label className="field"><span>Data de conclusão</span><input type="date" value={d.fim} onChange={muda("fim")} /></label>
        </div>
        <label className="field"><span>Responsável técnico (quem assina)</span><input value={d.responsavel} onChange={muda("responsavel")} /></label>
        <div className="grid2">
          <label className="field"><span>Cargo</span><input value={d.cargo} onChange={muda("cargo")} /></label>
          <label className="field"><span>Registro MTE (conferido pelo QR code)</span><input value={d.registro} onChange={muda("registro")} /></label>
        </div>
        <label className="field"><span>Nº do certificado (opcional)</span><input value={d.numero} onChange={muda("numero")} placeholder="Ex.: 001/2026" /></label>
        <label className="field"><span>Texto de validade</span><input value={d.validade} onChange={muda("validade")} /></label>
        <label className="field">
          <span>Conteúdo programático (um tópico por linha)</span>
          <textarea value={d.topicos} onChange={muda("topicos")} />
        </label>
        <div className="actions">
          <a className="btn primary" href={`/certificado-impressao?${certificadoParaUrl(d)}`} target="_blank" rel="noopener">
            <Icone nome="imprimir" tamanho={16} /> Abrir para imprimir
          </a>
          <button
            type="button"
            className="btn"
            onClick={() => { setFuncionarioId(""); setD({ ...CERTIFICADO_PADRAO, inicio: hoje, fim: hoje }); }}
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="cert-previa" ref={previa} style={{ height: 2 * 210 * (96 / 25.4) * escala + 16 * escala + 24 }}>
        <div style={{ transform: `scale(${escala})`, transformOrigin: "top left" }}>
          <CertificadoFolhas d={d} />
        </div>
      </div>
    </div>
  );
}
