import Link from "next/link";
import { exigirSessao } from "@/lib/auth";
import { sair } from "../actions";
import MenuLateral from "@/components/MenuLateral";
import TemaBotao from "@/components/TemaBotao";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-amais.png" alt="A+ Com" />
          <span>Estoque</span>
        </Link>
        <MenuLateral />
        <div className="user">
          <TemaBotao />
          <Link href="/conta" className="user-nome">{sessao.nome ?? sessao.email}</Link>
          <form action={sair}>
            <button className="btn small ghost" type="submit">Sair</button>
          </form>
        </div>
      </aside>
      <main className="container">{children}</main>
    </div>
  );
}
