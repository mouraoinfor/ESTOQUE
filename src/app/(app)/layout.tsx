import Link from "next/link";
import { exigirSessao } from "@/lib/auth";
import { sair } from "../actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-amais.png" alt="A+ Com" />
          <span>Estoque</span>
        </Link>
        <nav>
          <Link href="/">Itens</Link>
          <Link href="/anuncios">Anúncios</Link>
          <Link href="/conferencia">Conferência</Link>
          <Link href="/movimentacoes">Movimentações</Link>
          <Link href="/itens/novo">+ Novo item</Link>
        </nav>
        <div className="user">
          <Link href="/conta" className="hide-sm" style={{ color: "inherit" }}>{sessao.nome ?? sessao.email}</Link>
          <form action={sair}>
            <button className="btn small" type="submit">Sair</button>
          </form>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
