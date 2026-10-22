"use client";

import { useActionState } from "react";
import { criarUsuario, trocarSenha } from "@/app/actions";

export default function ContaForms() {
  const [senhaEst, senhaAcao, trocando] = useActionState(trocarSenha, undefined);
  const [userEst, userAcao, criando] = useActionState(criarUsuario, undefined);

  return (
    <div className="grid2" style={{ gap: "1rem", alignItems: "start" }}>
      <form className="card" action={senhaAcao}>
        <h3>Trocar senha</h3>
        {senhaEst?.erro && <div className="alert error">{senhaEst.erro}</div>}
        {senhaEst?.ok && <div className="alert ok">Senha alterada.</div>}
        <label className="field"><span>Senha atual</span><input type="password" name="atual" required autoComplete="current-password" /></label>
        <label className="field"><span>Nova senha (mín. 8)</span><input type="password" name="nova" required minLength={8} autoComplete="new-password" /></label>
        <button className="btn primary" type="submit" disabled={trocando}>Salvar senha</button>
      </form>
      <form className="card" action={userAcao}>
        <h3>Adicionar usuário</h3>
        {userEst?.erro && <div className="alert error">{userEst.erro}</div>}
        {userEst?.ok && <div className="alert ok">Usuário criado.</div>}
        <label className="field"><span>Nome</span><input type="text" name="nome" /></label>
        <label className="field"><span>E-mail</span><input type="email" name="email" required /></label>
        <label className="field"><span>Senha (mín. 8)</span><input type="password" name="senha" required minLength={8} autoComplete="new-password" /></label>
        <button className="btn primary" type="submit" disabled={criando}>Criar usuário</button>
      </form>
    </div>
  );
}
