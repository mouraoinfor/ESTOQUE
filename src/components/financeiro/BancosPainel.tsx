"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { excluirBanco, lancarMovimento, salvarBanco, transferir } from "@/app/acoes-bancos";
import { brl, hojeISO } from "@/lib/formato";
import type { BancoComSaldo } from "@/lib/financeiro";
import Icone from "@/components/Icone";

type Avisos = { erro?: string; ok?: string } | undefined;

function Avisos({ estado }: { estado: Avisos }) {
  return (
    <>
      {estado?.erro && <div className="alert error">{estado.erro}</div>}
      {estado?.ok && <div className="alert ok">{estado.ok}</div>}
    </>
  );
}

function CamposBanco({ b }: { b?: BancoComSaldo }) {
  return (
    <>
      <div className="grid2">
        <label className="field"><span>Nome do banco / conta</span><input type="text" name="nome" required defaultValue={b?.nome ?? ""} placeholder="Ex.: Itaú PJ" /></label>
        <div className="grid2" style={{ gap: "0 .6rem" }}>
          <label className="field"><span>Agência</span><input type="text" name="agencia" defaultValue={b?.agencia ?? ""} /></label>
          <label className="field"><span>Conta</span><input type="text" name="conta" defaultValue={b?.conta ?? ""} /></label>
        </div>
        <label className="field">
          <span>Saldo inicial (R$)</span>
          <input type="text" name="saldo_inicial" inputMode="decimal" placeholder="0,00"
            defaultValue={b ? b.saldo_inicial.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : ""} />
        </label>
        <label className="field"><span>Data do saldo inicial</span><input type="date" name="saldo_inicial_em" defaultValue={b?.saldo_inicial_em ?? hojeISO()} /></label>
        <label className="field">
          <span>Limite (cheque especial / conta garantida)</span>
          <input type="text" name="limite" inputMode="decimal" placeholder="0,00"
            defaultValue={b && b.limite ? b.limite.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : ""} />
        </label>
      </div>
      {b && (
        <label className="check" style={{ marginBottom: ".75rem" }}>
          <input type="checkbox" name="ativo" defaultChecked={b.ativo} /> Ativo (desmarque para esconder das listas)
        </label>
      )}
    </>
  );
}

export function NovoBanco() {
  const [estado, acao, enviando] = useActionState(salvarBanco.bind(null, null), undefined);
  return (
    <details className="card">
      <summary className="btn primary"><Icone nome="novo" tamanho={16} /> Novo banco</summary>
      <form action={acao} style={{ marginTop: "1rem" }}>
        <Avisos estado={estado} />
        <CamposBanco />
        <button className="btn primary" type="submit" disabled={enviando}>Cadastrar banco</button>
      </form>
    </details>
  );
}

export function BancoCard({ b }: { b: BancoComSaldo }) {
  const [estado, acao, salvando] = useActionState(salvarBanco.bind(null, b.id), undefined);
  const [excluindo, start] = useTransition();
  const [erro, setErro] = useState<string>();
  return (
    <div className={`card banco-card ${b.ativo ? "" : "inativo"}`}>
      <div className="banco-cab">
        <div>
          <div className="banco-nome"><Icone nome="banco" tamanho={16} /> {b.nome}</div>
          <div className="small muted">
            {[b.agencia && `Ag. ${b.agencia}`, b.conta && `C/C ${b.conta}`].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        {!b.ativo && <span className="badge">Inativo</span>}
      </div>
      <div className={`banco-saldo ${b.saldo < 0 ? "neg" : ""}`}>{brl(b.saldo)}</div>
      {b.limite > 0 && (
        <div className="small muted">Limite {brl(b.limite)} · disponível <strong className={b.saldo + b.limite < 0 ? "diff-neg" : ""}>{brl(b.saldo + b.limite)}</strong></div>
      )}
      <div className="actions">
        <Link className="btn small" href={`/financeiro/bancos/${b.id}`}>Extrato</Link>
        <Link className="btn small" href={`/financeiro/conciliacao?banco=${b.id}`}>Conciliar</Link>
      </div>
      <details>
        <summary className="small muted"><Icone nome="editar" tamanho={13} /> Editar ou excluir</summary>
        <form action={acao} style={{ marginTop: ".6rem" }}>
          <Avisos estado={estado} />
          <CamposBanco b={b} />
          <div className="actions">
            <button className="btn primary small" type="submit" disabled={salvando}>Salvar</button>
            <button
              className="btn small danger"
              type="button"
              disabled={excluindo}
              onClick={() => {
                if (!window.confirm(`Excluir o banco ${b.nome}?`)) return;
                start(async () => setErro((await excluirBanco(b.id)).erro));
              }}
            >
              Excluir
            </button>
          </div>
          {erro && <div className="alert warn small" style={{ marginTop: ".6rem" }}>{erro}</div>}
        </form>
      </details>
    </div>
  );
}

export interface BancoDestino {
  id: string;
  nome: string;
  empresa_id: string;
  empresa_nome: string;
}

export function TransferenciaForm({ origens, destinos, empresaId }: { origens: BancoComSaldo[]; destinos: BancoDestino[]; empresaId: string }) {
  const [estado, acao, enviando] = useActionState(transferir, undefined);
  const [origem, setOrigem] = useState(origens[0]?.id ?? "");
  // Destinos agrupados: primeiro a empresa atual, depois as outras
  const grupos = new Map<string, { nome: string; bancos: BancoDestino[] }>();
  for (const d of [...destinos].sort((a, b) => Number(b.empresa_id === empresaId) - Number(a.empresa_id === empresaId))) {
    if (d.id === origem) continue;
    const g = grupos.get(d.empresa_id) ?? { nome: d.empresa_id === empresaId ? `${d.empresa_nome} (esta empresa)` : d.empresa_nome, bancos: [] };
    g.bancos.push(d);
    grupos.set(d.empresa_id, g);
  }
  return (
    <div className="card">
      <h2>Transferência (TED) entre contas</h2>
      <p className="muted small">Lança um débito na conta de origem e um crédito na de destino. O destino pode ser uma conta de outra empresa.</p>
      <form action={acao}>
        <Avisos estado={estado} />
        <div className="grid2">
          <label className="field">
            <span>De (origem)</span>
            <select name="origem" value={origem} onChange={(e) => setOrigem(e.target.value)} required>
              {origens.map((b) => <option key={b.id} value={b.id}>{b.nome} — {brl(b.saldo)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Para (destino)</span>
            <select name="destino" required defaultValue="">
              <option value="" disabled>Escolha a conta</option>
              {[...grupos].map(([id, g]) => (
                <optgroup key={id} label={g.nome}>
                  {g.bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="field"><span>Data</span><input type="date" name="data" required defaultValue={hojeISO()} /></label>
          <label className="field"><span>Valor (R$)</span><input type="text" name="valor" inputMode="decimal" required placeholder="0,00" /></label>
        </div>
        <label className="field"><span>Observação (opcional)</span><input type="text" name="descricao" /></label>
        <button className="btn primary" type="submit" disabled={enviando || !origens.length}>Transferir</button>
      </form>
    </div>
  );
}

// Movimento avulso do extrato (tarifa, rendimento, linha digitada do extrato)
export function MovimentoForm({ bancos, bancoFixo, titulo = "Lançar movimento avulso" }: { bancos: { id: string; nome: string }[]; bancoFixo?: string; titulo?: string }) {
  const [estado, acao, enviando] = useActionState(lancarMovimento, undefined);
  return (
    <div className="card">
      <h2>{titulo}</h2>
      <p className="muted small">Tarifas, rendimentos e outras linhas do extrato que não vieram de uma conta a pagar/receber.</p>
      <form action={acao}>
        <Avisos estado={estado} />
        <div className="grid2">
          {bancoFixo ? (
            <input type="hidden" name="banco_id" value={bancoFixo} />
          ) : (
            <label className="field">
              <span>Conta</span>
              <select name="banco_id" required>
                {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </label>
          )}
          <label className="field">
            <span>Tipo</span>
            <select name="tipo" defaultValue="debito">
              <option value="debito">Débito (saída)</option>
              <option value="credito">Crédito (entrada)</option>
            </select>
          </label>
          <label className="field"><span>Data</span><input type="date" name="data" required defaultValue={hojeISO()} /></label>
          <label className="field"><span>Valor (R$)</span><input type="text" name="valor" inputMode="decimal" required placeholder="0,00" /></label>
        </div>
        <label className="field"><span>Descrição</span><input type="text" name="descricao" required placeholder="Ex.: Tarifa de manutenção" /></label>
        <button className="btn primary" type="submit" disabled={enviando}>Lançar</button>
      </form>
    </div>
  );
}
