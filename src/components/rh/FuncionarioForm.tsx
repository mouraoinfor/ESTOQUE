"use client";

import { useActionState, useState, useTransition } from "react";
import { desligarFuncionario, reativarFuncionario, salvarFuncionario } from "@/app/acoes-rh";
import { brl, dataBR, hojeISO } from "@/lib/formato";
import Icone from "@/components/Icone";
import { beneficiosMensais, type Funcionario } from "./rh-util";

export default function FuncionarioForm({ funcionario, funcoes }: { funcionario: Funcionario | null; funcoes: string[] }) {
  const f = funcionario;
  const [estado, acao, salvando] = useActionState(salvarFuncionario.bind(null, f?.id ?? null), undefined);
  const [pendente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [dataDesligar, setDataDesligar] = useState(hojeISO());
  const [beneficios, setBeneficios] = useState({ vr_dia: f?.vr_dia ?? 0, vt_dia: f?.vt_dia ?? 0, va_mensal: f?.va_mensal ?? 0 });

  const mudarBeneficio = (campo: keyof typeof beneficios) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBeneficios((b) => ({ ...b, [campo]: Number(e.target.value) || 0 }));

  function desligar() {
    if (!f || !confirm(`Desligar ${f.nome} em ${dataBR(dataDesligar)}? Ele sai da lista de ativos e das próximas folhas.`)) return;
    iniciar(async () => {
      const r = await desligarFuncionario(f.id, dataDesligar);
      setAviso("erro" in r ? { tipo: "error", texto: r.erro } : { tipo: "ok", texto: "Funcionário desligado." });
    });
  }

  function reativar() {
    if (!f || !confirm(`Reativar ${f.nome}?`)) return;
    iniciar(async () => {
      const r = await reativarFuncionario(f.id);
      setAviso("erro" in r ? { tipo: "error", texto: r.erro } : { tipo: "ok", texto: "Funcionário reativado." });
    });
  }

  return (
    <div className="rh-form-grid">
      <form className="card" action={acao}>
        <h2>Cadastro</h2>
        {estado?.erro && <div className="alert error">{estado.erro}</div>}
        {estado?.ok && <div className="alert ok">{estado.ok}</div>}

        <div className="grid2">
          <label className="field"><span>Nome completo *</span><input type="text" name="nome" required defaultValue={f?.nome ?? ""} /></label>
          <label className="field"><span>Apelido</span><input type="text" name="apelido" defaultValue={f?.apelido ?? ""} /></label>
        </div>
        <div className="grid2">
          <label className="field">
            <span>Função</span>
            <input type="text" name="funcao" list="rh-funcoes" defaultValue={f?.funcao ?? ""} />
            <datalist id="rh-funcoes">{funcoes.map((x) => <option key={x} value={x} />)}</datalist>
          </label>
          <label className="field"><span>Salário (R$)</span><input type="number" name="salario" min={0} step="0.01" defaultValue={f?.salario ?? ""} /></label>
        </div>
        <div className="grid2">
          <label className="field"><span>Admissão</span><input type="date" name="admissao" defaultValue={f?.admissao ?? ""} /></label>
          {f && !f.ativo && (
            <label className="field"><span>Desligamento</span><input type="date" name="demissao" defaultValue={f.demissao ?? ""} /></label>
          )}
        </div>

        <h3 className="rh-sub">Benefícios</h3>
        <div className="grid4">
          <label className="field"><span>VR por dia (R$)</span><input type="number" name="vr_dia" min={0} step="0.01" defaultValue={f?.vr_dia ?? ""} onChange={mudarBeneficio("vr_dia")} /></label>
          <label className="field"><span>VT por dia (R$)</span><input type="number" name="vt_dia" min={0} step="0.01" defaultValue={f?.vt_dia ?? ""} onChange={mudarBeneficio("vt_dia")} /></label>
          <label className="field"><span>VA mensal (R$)</span><input type="number" name="va_mensal" min={0} step="0.01" defaultValue={f?.va_mensal ?? ""} onChange={mudarBeneficio("va_mensal")} /></label>
        </div>
        <p className="muted small rh-nota">Estimativa por mês (22 dias): {brl(beneficiosMensais(beneficios))}</p>

        <h3 className="rh-sub">Contato e pagamento</h3>
        <div className="grid2">
          <label className="field"><span>CPF / documento</span><input type="text" name="documento" defaultValue={f?.documento ?? ""} /></label>
          <label className="field"><span>Telefone</span><input type="text" name="telefone" defaultValue={f?.telefone ?? ""} /></label>
        </div>
        <label className="field"><span>Chave PIX</span><input type="text" name="pix" defaultValue={f?.pix ?? ""} /></label>
        <label className="field"><span>Observações</span><textarea name="observacoes" defaultValue={f?.observacoes ?? ""} /></label>

        <div className="actions">
          <button className="btn primary" type="submit" disabled={salvando}>
            <Icone nome="ok" tamanho={16} /> {salvando ? "Salvando..." : f ? "Salvar alterações" : "Cadastrar funcionário"}
          </button>
        </div>
      </form>

      {f && (
        <aside className="card rh-situacao">
          <h2>Situação</h2>
          {aviso && <div className={`alert ${aviso.tipo}`}>{aviso.texto}</div>}
          {f.ativo ? (
            <>
              <p className="muted small">Ao desligar, o funcionário deixa de entrar nas novas folhas. O histórico continua guardado.</p>
              <label className="field"><span>Data do desligamento</span><input type="date" value={dataDesligar} onChange={(e) => setDataDesligar(e.target.value)} /></label>
              <button className="btn danger" type="button" disabled={pendente || !dataDesligar} onClick={desligar}>
                <Icone nome="sair" tamanho={16} /> Desligar funcionário
              </button>
            </>
          ) : (
            <>
              <p>Desligado{f.demissao ? ` em ${dataBR(f.demissao)}` : ""}.</p>
              <button className="btn" type="button" disabled={pendente} onClick={reativar}>
                <Icone nome="estorno" tamanho={16} /> Reativar funcionário
              </button>
            </>
          )}
        </aside>
      )}
    </div>
  );
}
