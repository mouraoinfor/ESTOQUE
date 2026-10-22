"use client";

import { useActionState, useState, useTransition } from "react";
import { criarUsuario, excluirUsuario, redefinirSenha, salvarAcessos } from "@/app/acoes-usuarios";
import { GRUPOS, MODULOS } from "@/lib/modulos";

export interface UsuarioLinha {
  id: string;
  email: string;
  nome: string | null;
  admin: boolean;
  ativo: boolean;
  permissoes: string[];
}

function Permissoes({ marcadas, desativado }: { marcadas: string[]; desativado: boolean }) {
  return (
    <div className="permissoes">
      {GRUPOS.map((g) => (
        <fieldset key={g} disabled={desativado}>
          <legend>{g}</legend>
          {MODULOS.filter((m) => m.grupo === g).map((m) => (
            <label key={m.chave} className="check">
              <input type="checkbox" name="permissoes" value={m.chave} defaultChecked={marcadas.includes(m.chave)} />
              {m.label}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

export function NovoUsuario() {
  const [estado, acao, enviando] = useActionState(criarUsuario, undefined);
  const [admin, setAdmin] = useState(false);
  return (
    <details className="card">
      <summary className="btn primary">Adicionar usuário</summary>
      <form action={acao} style={{ marginTop: "1rem" }}>
        {estado?.erro && <div className="alert error">{estado.erro}</div>}
        {estado?.ok && <div className="alert ok">{estado.ok}</div>}
        <div className="grid2">
          <label className="field"><span>Nome</span><input type="text" name="nome" /></label>
          <label className="field"><span>E-mail (login)</span><input type="email" name="email" required /></label>
          <label className="field"><span>Senha inicial (mín. 8)</span><input type="password" name="senha" required minLength={8} autoComplete="new-password" /></label>
        </div>
        <label className="check" style={{ marginBottom: ".75rem" }}>
          <input type="checkbox" name="admin" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />
          Administrador (acessa tudo e gerencia usuários)
        </label>
        <Permissoes marcadas={[]} desativado={admin} />
        <button className="btn primary" type="submit" disabled={enviando}>Criar usuário</button>
      </form>
    </details>
  );
}

export function UsuarioCard({ u, souEu }: { u: UsuarioLinha; souEu: boolean }) {
  const [estado, acao, salvando] = useActionState(salvarAcessos.bind(null, u.id), undefined);
  const [senhaEst, senhaAcao, trocando] = useActionState(redefinirSenha.bind(null, u.id), undefined);
  const [admin, setAdmin] = useState(u.admin);
  const [excluindo, startExcluir] = useTransition();
  const [erroExcluir, setErroExcluir] = useState<string>();

  return (
    <div className={`card usuario ${u.ativo ? "" : "inativo"}`}>
      <div className="usuario-topo">
        <div>
          <strong>{u.nome || u.email}</strong>
          <div className="small muted">{u.email}</div>
        </div>
        <div className="actions">
          {u.admin && <span className="badge pronto">Administrador</span>}
          {!u.ativo && <span className="badge baixa">Bloqueado</span>}
          {souEu && <span className="badge">Você</span>}
        </div>
      </div>

      <form action={acao}>
        {estado?.erro && <div className="alert error">{estado.erro}</div>}
        {estado?.ok && <div className="alert ok">{estado.ok}</div>}
        <label className="field"><span>Nome</span><input type="text" name="nome" defaultValue={u.nome ?? ""} /></label>
        <div className="actions" style={{ marginBottom: ".75rem" }}>
          <label className="check">
            <input type="checkbox" name="admin" checked={admin} onChange={(e) => setAdmin(e.target.checked)} disabled={souEu} />
            Administrador
          </label>
          <label className="check">
            <input type="checkbox" name="ativo" defaultChecked={u.ativo} disabled={souEu} />
            Acesso liberado
          </label>
          {/* checkbox desabilitado não vai no formulário: mantém o valor atual do próprio admin */}
          {souEu && <><input type="hidden" name="admin" value="on" /><input type="hidden" name="ativo" value="on" /></>}
        </div>
        <Permissoes marcadas={u.permissoes} desativado={admin} />
        <button className="btn primary small" type="submit" disabled={salvando}>Salvar acessos</button>
      </form>

      <div className="usuario-rodape">
        <form action={senhaAcao} className="actions">
          <input type="password" name="senha" placeholder="Nova senha (mín. 8)" minLength={8} required autoComplete="new-password" style={{ maxWidth: 220 }} />
          <button className="btn small" type="submit" disabled={trocando}>Redefinir senha</button>
          {senhaEst?.erro && <span className="small" style={{ color: "var(--danger)" }}>{senhaEst.erro}</span>}
          {senhaEst?.ok && <span className="small" style={{ color: "var(--ok)" }}>{senhaEst.ok}</span>}
        </form>
        {!souEu && (
          <button
            className="btn small danger"
            type="button"
            disabled={excluindo}
            onClick={() => {
              if (!window.confirm(`Excluir o usuário ${u.email}?`)) return;
              startExcluir(async () => setErroExcluir((await excluirUsuario(u.id)).erro));
            }}
          >
            Excluir usuário
          </button>
        )}
        {erroExcluir && <span className="small" style={{ color: "var(--danger)" }}>{erroExcluir}</span>}
      </div>
    </div>
  );
}
