"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Icone from "@/components/Icone";
import { formatarDocumento } from "@/lib/formato";
import { cadastrarClienteRapido } from "@/app/acoes-orcamentos";
import Modal from "./Modal";
import { normalizar, type ClienteBusca } from "./tipos";

// Cliente do orçamento: busca no cadastro, nome livre ou cadastro rápido
export default function ClienteCampo({
  clientes,
  clienteId,
  clienteNome,
  desabilitado,
  onMudar,
  onNovoCliente,
}: {
  clientes: ClienteBusca[];
  clienteId: string | null;
  clienteNome: string;
  desabilitado?: boolean;
  onMudar: (id: string | null, nome: string) => void;
  onNovoCliente: (c: ClienteBusca) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [cadastrando, setCadastrando] = useState(false);
  const selecionado = clienteId ? clientes.find((c) => c.id === clienteId) : undefined;

  const sugestoes = useMemo(() => {
    const q = normalizar(clienteNome.trim());
    const digitos = clienteNome.replace(/\D/g, "");
    if (!q) return clientes.slice(0, 8);
    return clientes
      .filter((c) => normalizar(c.nome).includes(q) || (digitos.length >= 3 && (c.documento ?? "").includes(digitos)))
      .slice(0, 8);
  }, [clientes, clienteNome]);

  if (selecionado) {
    return (
      <div className="field orc-cliente-escolhido">
        <span>Cliente</span>
        <div className="orc-cliente-box">
          <div>
            <strong>{selecionado.nome}</strong>
            <div className="small muted">
              {[selecionado.documento && formatarDocumento(selecionado.documento), selecionado.telefone, selecionado.email].filter(Boolean).join(" · ") || "Cliente do cadastro"}
            </div>
          </div>
          {!desabilitado && (
            <button type="button" className="btn small" onClick={() => onMudar(null, "")}>Trocar</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="field orc-autocompletar">
      <span>Cliente (busque no cadastro ou digite o nome)</span>
      <div className="orc-cliente-linha">
        <input
          value={clienteNome}
          disabled={desabilitado}
          placeholder="Nome, CPF ou CNPJ"
          onChange={(e) => { onMudar(null, e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
        />
        {!desabilitado && (
          <button type="button" className="btn small" onClick={() => setCadastrando(true)} title="Cadastrar cliente">
            <Icone nome="novo" tamanho={14} /> Cadastrar
          </button>
        )}
      </div>
      {aberto && !desabilitado && sugestoes.length > 0 && (
        <ul className="orc-sugestoes">
          {sugestoes.map((c) => (
            <li key={c.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onMudar(c.id, c.nome); setAberto(false); }}>
                <strong>{c.nome}</strong>
                {c.documento && <span className="small muted"> · {formatarDocumento(c.documento)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {clienteNome.trim() && <span className="small muted orc-dica">Sem cadastro: o nome vai só no orçamento.</span>}
      {cadastrando && (
        <CadastroRapido
          nomeInicial={clienteNome}
          onFechar={() => setCadastrando(false)}
          onCriado={(c) => { onNovoCliente(c); onMudar(c.id, c.nome); setCadastrando(false); }}
        />
      )}
    </div>
  );
}

function CadastroRapido({ nomeInicial, onFechar, onCriado }: { nomeInicial: string; onFechar: () => void; onCriado: (c: ClienteBusca) => void }) {
  const [estado, acao, salvando] = useActionState(cadastrarClienteRapido, undefined);
  const tratado = useRef<unknown>(null);
  useEffect(() => {
    if (estado && "ok" in estado && tratado.current !== estado) {
      tratado.current = estado;
      onCriado(estado.ok);
    }
  }, [estado, onCriado]);

  return (
    <Modal titulo="Cadastrar cliente" onFechar={onFechar}>
      <form action={acao}>
        {estado && "erro" in estado && <div className="alert error">{estado.erro}</div>}
        <label className="field"><span>Nome</span><input name="nome" defaultValue={nomeInicial} required autoFocus /></label>
        <div className="grid2">
          <label className="field"><span>CPF / CNPJ (opcional)</span><input name="documento" inputMode="numeric" /></label>
          <label className="field"><span>Telefone</span><input name="telefone" /></label>
        </div>
        <label className="field"><span>E-mail</span><input name="email" type="email" /></label>
        <div className="actions">
          <button className="btn primary" type="submit" disabled={salvando}>Cadastrar</button>
          <button className="btn" type="button" onClick={onFechar}>Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}
