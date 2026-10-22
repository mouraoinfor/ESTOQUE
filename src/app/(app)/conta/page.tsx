import Link from "next/link";
import { exigirSessao } from "@/lib/auth";
import { MODULOS, podeAcessar } from "@/lib/modulos";
import ContaForms from "@/components/ContaForms";

export const dynamic = "force-dynamic";

export default async function Conta() {
  const sessao = await exigirSessao();
  const meus = MODULOS.filter((m) => podeAcessar(sessao, m.chave));

  return (
    <>
      <h1>Minha conta</h1>
      <p className="muted">
        Logado como <strong>{sessao.email}</strong>
        {sessao.admin && <> · <span className="badge pronto">Administrador</span></>}
      </p>
      <ContaForms />
      <div className="card" style={{ maxWidth: 520 }}>
        <h3>Seus acessos</h3>
        <p className="small muted">{meus.length ? meus.map((m) => m.label).join(" · ") : "Nenhum módulo liberado ainda."}</p>
        {sessao.admin && <Link className="btn" href="/usuarios">Gerenciar usuários e acessos</Link>}
      </div>
    </>
  );
}
