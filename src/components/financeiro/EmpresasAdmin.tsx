"use client";

import { useActionState, useState, useTransition } from "react";
import { excluirEmpresa, salvarEmpresa } from "@/app/acoes-cadastros";
import { escolherEmpresa } from "@/app/acoes-empresa";
import { formatarDocumento } from "@/lib/formato";
import Icone from "@/components/Icone";

export interface EmpresaLinha {
  id: string;
  nome: string;
  documento: string | null;
  inscricao_estadual: string | null;
  endereco: string | null;
  telefone: string | null;
  cidade: string | null;
  responsavel: string | null;
  responsavel_cargo: string | null;
  assinatura: string | null;
  n_bancos: number;
  n_lancamentos: number;
}

function Campos({ e }: { e?: EmpresaLinha }) {
  return (
    <>
      <div className="grid2">
        <label className="field"><span>Nome / razão social</span><input type="text" name="nome" required defaultValue={e?.nome ?? ""} /></label>
        <label className="field">
          <span>CNPJ ou CPF</span>
          <input type="text" name="documento" inputMode="numeric" placeholder="00.000.000/0000-00" defaultValue={formatarDocumento(e?.documento)} />
        </label>
      </div>
      <details className="empresa-proposta">
        <summary className="small">Dados da proposta comercial (cabeçalho e assinatura)</summary>
        <div className="grid2">
          <label className="field"><span>Inscrição estadual</span><input type="text" name="inscricao_estadual" defaultValue={e?.inscricao_estadual ?? ""} /></label>
          <label className="field"><span>Telefones</span><input type="text" name="telefone" placeholder="(61) 3358-6941 / 99248-0219" defaultValue={e?.telefone ?? ""} /></label>
        </div>
        <label className="field">
          <span>Endereço</span>
          <textarea name="endereco" rows={2} placeholder={"Quadra 01 Conjunto B Lote 08 Loja 03.\nSetor de Desenvolvimento de Taguatinga /DF - CEP: 72.145-102."} defaultValue={e?.endereco ?? ""} />
        </label>
        <div className="grid4">
          <label className="field"><span>Cidade (data da proposta)</span><input type="text" name="cidade" placeholder="Brasília" defaultValue={e?.cidade ?? ""} /></label>
          <label className="field"><span>Quem assina</span><input type="text" name="responsavel" placeholder="Darkson S. Mourão" defaultValue={e?.responsavel ?? ""} /></label>
          <label className="field"><span>Cargo</span><input type="text" name="responsavel_cargo" placeholder="Gerente Comercial" defaultValue={e?.responsavel_cargo ?? ""} /></label>
        </div>
        <div className="empresa-assinatura">
          {e?.assinatura && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.assinatura} alt="Assinatura atual" />
          )}
          <label className="field">
            <span>{e?.assinatura ? "Trocar imagem da assinatura" : "Imagem da assinatura (PNG ou JPG)"}</span>
            <input type="file" name="assinatura" accept="image/png,image/jpeg,image/webp" />
          </label>
          {e?.assinatura && <label className="check small"><input type="checkbox" name="remover_assinatura" /> Remover assinatura</label>}
          <span className="small muted">Com imagem, a proposta usa a assinatura escaneada no lugar da linha com nome e cargo.</span>
        </div>
      </details>
    </>
  );
}

export function NovaEmpresa({ primeira }: { primeira: boolean }) {
  const [estado, acao, enviando] = useActionState(salvarEmpresa.bind(null, null), undefined);
  return (
    <details className="card" open={primeira}>
      <summary className="btn primary"><Icone nome="novo" tamanho={16} /> Nova empresa</summary>
      <form action={acao} style={{ marginTop: "1rem" }}>
        {estado?.erro && <div className="alert error">{estado.erro}</div>}
        {estado?.ok && <div className="alert ok">{estado.ok}</div>}
        {primeira && <p className="muted small">A primeira empresa cadastrada passa a ser a empresa atual do financeiro.</p>}
        <Campos />
        <button className="btn primary" type="submit" disabled={enviando}>Cadastrar empresa</button>
      </form>
    </details>
  );
}

export function EmpresaCard({ e, atual }: { e: EmpresaLinha; atual: boolean }) {
  const [estado, acao, salvando] = useActionState(salvarEmpresa.bind(null, e.id), undefined);
  const [trocando, startTroca] = useTransition();
  const [excluindo, startExcluir] = useTransition();
  const [confirmacao, setConfirmacao] = useState("");
  const [erroExcluir, setErroExcluir] = useState<string>();
  const [abrirExcluir, setAbrirExcluir] = useState(false);

  return (
    <div className={`card empresa-card ${atual ? "atual" : ""}`}>
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: ".8rem" }}>
        <div>
          <strong>{e.nome}</strong>
          <div className="small muted">{e.documento ? formatarDocumento(e.documento) : "Sem CNPJ/CPF"}</div>
          <div className="small muted">{e.n_bancos} banco(s) · {e.n_lancamentos} lançamento(s)</div>
        </div>
        {atual ? (
          <span className="badge pronto">Empresa atual</span>
        ) : (
          <button className="btn small" type="button" disabled={trocando} onClick={() => startTroca(() => escolherEmpresa(e.id))}>
            Usar esta empresa
          </button>
        )}
      </div>

      <form action={acao}>
        {estado?.erro && <div className="alert error">{estado.erro}</div>}
        {estado?.ok && <div className="alert ok">{estado.ok}</div>}
        <Campos e={e} />
        <button className="btn primary small" type="submit" disabled={salvando}>Salvar</button>
      </form>

      <div className="empresa-zona-perigo">
        {!abrirExcluir ? (
          <button className="btn small danger" type="button" onClick={() => setAbrirExcluir(true)}>
            <Icone nome="lixo" tamanho={14} /> Excluir empresa
          </button>
        ) : (
          <div>
            <div className="alert warn small">
              Isto apaga a empresa e tudo dela: {e.n_bancos} banco(s), {e.n_lancamentos} lançamento(s), contas fixas e o extrato bancário.
              Transferências feitas para contas de outras empresas continuam no extrato da outra empresa. Não dá para desfazer.
            </div>
            <label className="field">
              <span>Para confirmar, digite o nome da empresa: <strong>{e.nome}</strong></span>
              <input type="text" value={confirmacao} onChange={(ev) => setConfirmacao(ev.target.value)} autoComplete="off" />
            </label>
            <div className="actions">
              <button
                className="btn small danger"
                type="button"
                disabled={excluindo || confirmacao.trim() !== e.nome.trim()}
                onClick={() => startExcluir(async () => setErroExcluir((await excluirEmpresa(e.id, confirmacao)).erro))}
              >
                Apagar definitivamente
              </button>
              <button className="btn small" type="button" onClick={() => { setAbrirExcluir(false); setConfirmacao(""); }}>Cancelar</button>
            </div>
            {erroExcluir && <div className="small" style={{ color: "var(--danger)", marginTop: ".4rem" }}>{erroExcluir}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
