import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fonte = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--fonte" });

export const metadata: Metadata = {
  title: "Estoque",
  description: "Controle de estoque e anúncios (Mercado Livre / OLX)",
};

// Aplica tema e menu recolhido salvos antes da pintura, para a tela não piscar
const temaInicial = `try{var d=document.documentElement,t=localStorage.getItem("tema");if(t)d.dataset.theme=t;if(localStorage.getItem("menu")==="mini")d.dataset.menu="mini"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fonte.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaInicial }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
