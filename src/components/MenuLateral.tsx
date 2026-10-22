"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/", label: "Itens", icone: "📦" },
  { href: "/graficos", label: "Gráficos", icone: "📊" },
  { href: "/anuncios", label: "Anúncios", icone: "🏷️" },
  { href: "/conferencia", label: "Conferência", icone: "✅" },
  { href: "/movimentacoes", label: "Movimentações", icone: "🔁" },
  { href: "/itens/novo", label: "Novo item", icone: "➕" },
  { href: "/conta", label: "Minha conta", icone: "👤" },
];

export default function MenuLateral() {
  const atual = usePathname();
  // "/" só fica ativo na própria lista; as páginas de item continuam marcando "Itens"
  const ativo = (href: string) =>
    href === "/" ? atual === "/" || (atual.startsWith("/itens/") && atual !== "/itens/novo") : atual.startsWith(href);

  return (
    <nav>
      {ITENS.map((i) => (
        <Link key={i.href} href={i.href} className={ativo(i.href) ? "active" : undefined}>
          <span aria-hidden>{i.icone}</span> {i.label}
        </Link>
      ))}
    </nav>
  );
}
