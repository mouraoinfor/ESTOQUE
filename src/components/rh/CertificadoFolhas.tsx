// Certificado de treinamento (modelo A+ Com, A4 paisagem, 2 páginas).
// Usado na prévia de /rh/certificados e na folha de impressão /certificado-impressao.

export interface DadosCertificado {
  nome: string;
  cpf: string;
  curso: string;
  horas: string;
  inicio: string; // AAAA-MM-DD
  fim: string; // AAAA-MM-DD
  validade: string;
  numero: string;
  responsavel: string;
  registro: string;
  topicos: string; // um tópico por linha
}

export const TOPICOS_NR35 = [
  "Normas e regulamentos aplicáveis ao trabalho em altura",
  "Análise de Risco (AR) e condições impeditivas",
  "Riscos potenciais inerentes ao trabalho em altura e medidas de prevenção e controle",
  "Sistemas, equipamentos e procedimentos de proteção coletiva",
  "EPI para trabalho em altura: seleção, inspeção, conservação e limitação de uso",
  "Acidentes típicos em trabalhos em altura",
  "Condutas em situações de emergência, incluindo noções básicas de técnicas de resgate e de primeiros socorros",
].join("\n");

export const CERTIFICADO_PADRAO: DadosCertificado = {
  nome: "",
  cpf: "",
  curso: "NR-35 Trabalho em Altura – Capacitação Inicial",
  horas: "8",
  inicio: "",
  fim: "",
  validade: "Validade: 2 anos a partir da data de conclusão (NR-35, item 35.3.3).",
  numero: "",
  responsavel: "",
  registro: "",
  topicos: TOPICOS_NR35,
};

const CAMPOS = Object.keys(CERTIFICADO_PADRAO) as (keyof DadosCertificado)[];

// Lê os dados vindos da URL (campos ausentes ficam com o padrão)
export function certificadoDaUrl(p: Record<string, string | string[] | undefined>): DadosCertificado {
  const d = { ...CERTIFICADO_PADRAO };
  for (const c of CAMPOS) {
    const v = p[c];
    if (typeof v === "string") d[c] = v;
  }
  return d;
}

export function certificadoParaUrl(d: DadosCertificado) {
  return new URLSearchParams(CAMPOS.map((c) => [c, d[c]] as [string, string])).toString();
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function dataExtenso(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "____/____/________";
  return `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}`;
}

function dataCurta(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "—";
}

function Chevrons() {
  return (
    <svg className="cert-chevrons" viewBox="0 0 92 52" aria-hidden="true">
      <polyline points="4,4 26,26 4,48" fill="none" stroke="#a6c935" strokeWidth="7" />
      <polyline points="34,4 56,26 34,48" fill="none" stroke="#a6c935" strokeWidth="7" opacity=".55" />
      <polyline points="64,4 86,26 64,48" fill="none" stroke="#121828" strokeWidth="7" />
    </svg>
  );
}

const EMISSOR = "A+ Com · Engenharia e Tecnologia";

export default function CertificadoFolhas({ d }: { d: DadosCertificado }) {
  const nome = d.nome.trim() || "NOME DO COLABORADOR";
  const cpf = d.cpf.trim() || "000.000.000-00";
  const horas = d.horas.trim();
  const cargaHoraria = /^\d+([.,]\d+)?$/.test(horas) ? `${horas} ${horas === "1" ? "hora" : "horas"}` : horas;
  const topicos = d.topicos.split("\n").map((t) => t.trim()).filter(Boolean);
  const cursoCurto = d.curso.split(/\s[–-]\s/)[0];
  // "NR-35 Trabalho em Altura" -> "NR-35" (cita a norma no texto só quando o curso tem uma)
  const nr = /\bNR\s*-?\s*(\d+)/i.exec(d.curso);
  const norma = nr ? `NR‑${nr[1]}` : ""; // hífen que não quebra linha

  return (
    <div className="cert-folhas">
      <section className="cert-folha">
        <div className="cert-lateral" />
        <Chevrons />
        <div className="cert-conteudo">
          <div className="cert-emissor">{EMISSOR}</div>
          <h1 className="cert-titulo">Certificado</h1>
          <div className="cert-subtitulo">Treinamento de Segurança do Trabalho</div>
          <div className="cert-traco"><i /><b /></div>

          <div className="cert-corpo">
            Certificamos que o(a) colaborador(a)
            <span className="cert-nome">{nome}</span>
            portador(a) do CPF <strong>{cpf}</strong>, concluiu com aproveitamento satisfatório o curso<br />
            <strong className="cert-curso">{d.curso}</strong>
            {cargaHoraria && <>, com carga horária de <strong>{cargaHoraria}</strong></>}
            {norma ? `, em conformidade com a ${norma}.` : "."}
          </div>

          <div className="cert-datas">
            <div className="cert-data"><small>Data de início</small><span>{dataExtenso(d.inicio)}</span></div>
            <div className="cert-data"><small>Data de conclusão</small><span>{dataExtenso(d.fim)}</span></div>
          </div>

          <div className="cert-assinaturas">
            <div>
              <div className="cert-linha" />
              <strong>{d.responsavel.trim() || "Responsável técnico"}</strong>
              {d.registro.trim() && <span>{d.registro}</span>}
              {d.responsavel.trim() && <span>Responsável técnico</span>}
            </div>
            <div>
              <div className="cert-linha" />
              <strong>{nome}</strong>
              <span>Participante</span>
            </div>
          </div>

          {d.validade.trim() && <div className="cert-validade">{d.validade}</div>}
        </div>
        <div className="cert-rodape" />
      </section>

      <section className="cert-folha">
        <div className="cert-lateral" />
        <Chevrons />
        <div className="cert-conteudo">
          <div className="cert-emissor">{EMISSOR}</div>
          <h2 className="cert-titulo-2">Conteúdo Programático</h2>
          <div className="cert-traco"><i /><b /></div>

          <div className="cert-grade">
            <ul className="cert-topicos">
              {topicos.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <div className="cert-resumo">
              <div><small>Participante</small><span>{nome}</span></div>
              <div><small>Curso</small><span>{cursoCurto}</span></div>
              {cargaHoraria && <div><small>Carga horária</small><span>{cargaHoraria}</span></div>}
              <div><small>Conclusão</small><span>{dataCurta(d.fim)}</span></div>
            </div>
          </div>

          {d.numero.trim() && <div className="cert-codigo">Certificado nº {d.numero}</div>}
        </div>
        <div className="cert-rodape" />
      </section>
    </div>
  );
}
