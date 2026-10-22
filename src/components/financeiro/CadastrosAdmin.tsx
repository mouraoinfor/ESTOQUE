"use client";

import { Fragment, useActionState, useMemo, useState, useTransition } from "react";
import { excluirCadastro, salvarCadastro, type TipoCadastro } from "@/app/acoes-cadastros";
import { brl, formatarDocumento, soDigitos } from "@/lib/formato";
import Icone from "@/components/Icone";

export interface CadastroLinha {
  id: string;
  nome: string;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  observacoes: string | null;
  aberto: number;
  pago: number;
  n_lancamentos: number;
  n_notas: number;
  n_recorrencias: number;
}

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function Campos({ c }: { c?: CadastroLinha }) {
  return (
    <>
      <div className="grid2">
        <label className="field"><span>Nome / razão social</span><input type="text" name="nome" required defaultValue={c?.nome ?? ""} /></label>
        <label className="field"><span>CNPJ ou CPF</span><input type="text" name="documento" inputMode="numeric" defaultValue={formatarDocumento(c?.documento)} /></label>
        <label className="field"><span>Telefone</span><input type="tel" name="telefone" defaultValue={c?.telefone ?? ""} /></label>
        <label className="field"><span>E-mail</span><input type="email" name="email" defaultValue={c?.email ?? ""} /></label>
      </div>
      <label className="field"><span>Observações</span><textarea name="observacoes" rows={2} defaultValue={c?.observacoes ?? ""} /></label>
    </>
  );
}

function NovoCadastro({ tipo }: { tipo: TipoCadastro }) {
  const [estado, acao, enviando] = useActionState(salvarCadastro.bind(null, tipo, null), undefined);
  return (
    <details className="card">
      <summary className="btn primary"><Icone nome="novo" tamanho={16} /> {tipo === "fornecedor" ? "Novo fornecedor" : "Novo cliente"}</summary>
      <form action={acao} style={{ marginTop: "1rem" }}>
        {estado?.erro && <div className="alert error">{estado.erro}</div>}
        {estado?.ok && <div className="alert ok">{estado.ok}</div>}
        <Campos />
        <button className="btn primary" type="submit" disabled={enviando}>Cadastrar</button>
      </form>
    </details>
  );
}

function motivoBloqueio(c: CadastroLinha) {
  const m = [
    c.n_lancamentos && `${c.n_lancamentos} lançamento(s)`,
    c.n_notas && `${c.n_notas} nota(s) fiscal(is)`,
    c.n_recorrencias && `${c.n_recorrencias} conta(s) fixa(s)`,
  ].filter(Boolean);
  return m.length ? `Não pode excluir: ligado a ${m.join(", ")}.` : null;
}

function Edicao({ tipo, c, fechar }: { tipo: TipoCadastro; c: CadastroLinha; fechar: () => void }) {
  const [estado, acao, salvando] = useActionState(salvarCadastro.bind(null, tipo, c.id), undefined);
  const [excluindo, start] = useTransition();
  const [erro, setErro] = useState<string>();
  const bloqueio = motivoBloqueio(c);
  return (
    <form action={acao}>
      {estado?.erro && <div className="alert error">{estado.erro}</div>}
      {estado?.ok && <div className="alert ok">{estado.ok}</div>}
      <Campos c={c} />
      <div className="actions">
        <button className="btn primary small" type="submit" disabled={salvando}>Salvar</button>
        <button className="btn small" type="button" onClick={fechar}>Fechar</button>
        <button className="btn small danger" type="button" disabled={excluindo || !!bloqueio} title={bloqueio ?? undefined}
          onClick={() => {
            if (!window.confirm(`Excluir ${c.nome}?`)) return;
            start(async () => setErro((await excluirCadastro(tipo, c.id)).erro));
          }}>
          <Icone nome="lixo" tamanho={14} /> Excluir
        </button>
        {bloqueio && <span className="small muted">{bloqueio}</span>}
      </div>
      {erro && <div className="alert error small" style={{ marginTop: ".5rem" }}>{erro}</div>}
    </form>
  );
}

function Lista({ tipo, itens }: { tipo: TipoCadastro; itens: CadastroLinha[] }) {
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const filtrados = useMemo(() => {
    const q = normalizar(busca.trim());
    const qd = soDigitos(busca);
    if (!q) return itens;
    return itens.filter((c) =>
      normalizar([c.nome, c.email, c.telefone, c.observacoes].filter(Boolean).join(" ")).includes(q) ||
      (qd.length >= 3 && (c.documento ?? "").includes(qd))
    );
  }, [itens, busca]);
  const totAberto = filtrados.reduce((s, c) => s + c.aberto, 0);
  const totPago = filtrados.reduce((s, c) => s + c.pago, 0);
  const rotuloAberto = tipo === "fornecedor" ? "A pagar (em aberto)" : "A receber (em aberto)";
  const rotuloPago = tipo === "fornecedor" ? "Total pago" : "Total recebido";

  return (
    <>
      <NovoCadastro tipo={tipo} />
      <div className="stats">
        <div className="stat"><div className="label">{tipo === "fornecedor" ? "Fornecedores" : "Clientes"}</div><div className="value">{itens.length}</div></div>
        <div className="stat"><div className="label">{rotuloAberto}</div><div className="value" style={{ fontSize: "1.15rem" }}>{brl(totAberto)}</div></div>
        <div className="stat"><div className="label">{rotuloPago}</div><div className="value" style={{ fontSize: "1.15rem" }}>{brl(totPago)}</div></div>
      </div>
      <div className="filters">
        <input type="search" placeholder="Buscar por nome, CNPJ/CPF, e-mail, telefone..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <p className="muted small">{filtrados.length} de {itens.length} · totais somam os lançamentos de todas as empresas</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th className="hide-sm">CNPJ/CPF</th>
              <th className="hide-sm">Contato</th>
              <th className="num">Em aberto</th>
              <th className="num">{tipo === "fornecedor" ? "Pago" : "Recebido"}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <Fragment key={c.id}>
                <tr>
                  <td>
                    <strong>{c.nome}</strong>
                    {c.observacoes && <div className="small muted">{c.observacoes.slice(0, 90)}{c.observacoes.length > 90 ? "…" : ""}</div>}
                  </td>
                  <td className="hide-sm small" style={{ whiteSpace: "nowrap" }}>{c.documento ? formatarDocumento(c.documento) : "—"}</td>
                  <td className="hide-sm small">{[c.telefone, c.email].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="num">{c.aberto ? brl(c.aberto) : <span className="muted">—</span>}</td>
                  <td className="num">{c.pago ? brl(c.pago) : <span className="muted">—</span>}</td>
                  <td className="num">
                    <button className="btn small" type="button" onClick={() => setEditando(editando === c.id ? null : c.id)} title="Editar">
                      <Icone nome="editar" tamanho={14} />
                    </button>
                  </td>
                </tr>
                {editando === c.id && (
                  <tr className="cad-edicao">
                    <td colSpan={6}><Edicao tipo={tipo} c={c} fechar={() => setEditando(null)} /></td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {!filtrados.length && <p className="muted small">Nenhum cadastro encontrado.</p>}
    </>
  );
}

export default function CadastrosAdmin({ fornecedores, clientes, abaInicial }: { fornecedores: CadastroLinha[]; clientes: CadastroLinha[]; abaInicial: TipoCadastro }) {
  const [aba, setAba] = useState<TipoCadastro>(abaInicial);
  return (
    <>
      <div className="tabs">
        <button type="button" className={aba === "fornecedor" ? "active" : ""} onClick={() => setAba("fornecedor")}>Fornecedores ({fornecedores.length})</button>
        <button type="button" className={aba === "cliente" ? "active" : ""} onClick={() => setAba("cliente")}>Clientes ({clientes.length})</button>
      </div>
      {aba === "fornecedor" ? <Lista key="f" tipo="fornecedor" itens={fornecedores} /> : <Lista key="c" tipo="cliente" itens={clientes} />}
    </>
  );
}
