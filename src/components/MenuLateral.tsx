"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icone, { type NomeIcone } from "./Icone";
import TemaBotao from "./TemaBotao";

const ITENS: { href: string; label: string; icone: NomeIcone }[] = [
  { href: "/", label: "Gráficos", icone: "graficos" },
  { href: "/itens", label: "Itens", icone: "itens" },
  { href: "/anuncios", label: "Anúncios", icone: "anuncios" },
  { href: "/conferencia", label: "Conferência", icone: "conferencia" },
  { href: "/movimentacoes", label: "Movimentações", icone: "movimentacoes" },
  { href: "/itens/novo", label: "Novo item", icone: "novo" },
  { href: "/conta", label: "Minha conta", icone: "conta" },
];

// Menu recolhido fica em <html data-menu="mini"> (aplicado antes da pintura pelo layout raiz)
function alternarMenu() {
  const html = document.documentElement;
  const mini = html.dataset.menu !== "mini";
  if (mini) html.dataset.menu = "mini";
  else delete html.dataset.menu;
  try { localStorage.setItem("menu", mini ? "mini" : ""); } catch {}
}

export default function MenuLateral({ usuario, sair }: { usuario: string; sair: () => Promise<void> }) {
  const atual = usePathname();
  const ativo = (href: string) => {
    if (href === "/") return atual === "/";
    if (href === "/itens") return atual === "/itens" || (atual.startsWith("/itens/") && atual !== "/itens/novo");
    return atual.startsWith(href);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-topo">
        <Link href="/" className="brand" title="A+ Com — Estoque">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-amais.png" alt="A+ Com" />
          <span>Estoque</span>
        </Link>
        <button type="button" className="menu-alternar" onClick={alternarMenu} aria-label="Recolher ou expandir o menu" title="Recolher / expandir menu">
          <Icone nome="recolher" className="so-aberto" />
          <Icone nome="expandir" className="so-mini" />
        </button>
      </div>

      <nav>
        {ITENS.map((i) => (
          <Link key={i.href} href={i.href} className={ativo(i.href) ? "active" : undefined} title={i.label}>
            <Icone nome={i.icone} />
            <span className="rotulo">{i.label}</span>
          </Link>
        ))}
      </nav>

      <div className="user">
        <TemaBotao />
        <Link href="/conta" className="user-nome" title={usuario}>{usuario}</Link>
        <form action={sair}>
          <button className="sair" type="submit" title="Sair">
            <Icone nome="sair" />
            <span className="rotulo">Sair</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
