"use client";

import { useActionState } from "react";
import { entrar } from "../actions";

export default function LoginPage() {
  const [estado, acao, carregando] = useActionState(entrar, undefined);

  return (
    <div className="login-wrap">
      <form className="card login-card" action={acao}>
        <div className="login-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-amais.png" alt="A+ Com Engenharia e Tecnologia" />
        </div>
        <h1 style={{ textAlign: "center" }}>Controle de Estoque</h1>
        {estado?.erro && <div className="alert error">{estado.erro}</div>}
        <label className="field">
          <span>E-mail</span>
          <input type="email" name="email" required autoFocus autoComplete="username" />
        </label>
        <label className="field">
          <span>Senha</span>
          <input type="password" name="senha" required autoComplete="current-password" />
        </label>
        <button className="btn primary" type="submit" disabled={carregando} style={{ width: "100%", justifyContent: "center" }}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
