import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fonte = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--fonte" });

export const metadata: Metadata = {
  title: "A+ Com | Gestão",
  description: "Gestão A+ Com: estoque, orçamentos, projetos, financeiro e RH",
};

// Aplica tema e menu recolhido salvos antes da pintura, para a tela não piscar.
// Sem preferência salva, telas estreitas (monitor em pé, tela dividida) começam com o menu recolhido.
const temaInicial = `try{var d=document.documentElement,t=localStorage.getItem("tema");if(t)d.dataset.theme=t;var m=localStorage.getItem("menu");if(m==="mini"||(m===null&&innerWidth<1280))d.dataset.menu="mini"}catch(e){}`;

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
