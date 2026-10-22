"use client";

import { useActionState } from "react";
import { trocarSenha } from "@/app/actions";

export default function ContaForms() {
  const [senhaEst, senhaAcao, trocando] = useActionState(trocarSenha, undefined);

  return (
    <form className="card" action={senhaAcao} style={{ maxWidth: 520 }}>
      <h3>Trocar senha</h3>
      {senhaEst?.erro && <div className="alert error">{senhaEst.erro}</div>}
      {senhaEst?.ok && <div className="alert ok">Senha alterada.</div>}
      <label className="field"><span>Senha atual</span><input type="password" name="atual" required autoComplete="current-password" /></label>
      <label className="field"><span>Nova senha (mín. 8)</span><input type="password" name="nova" required minLength={8} autoComplete="new-password" /></label>
      <button className="btn primary" type="submit" disabled={trocando}>Salvar senha</button>
    </form>
  );
}
