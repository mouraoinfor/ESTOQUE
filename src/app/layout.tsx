import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estoque",
  description: "Controle de estoque e anúncios (Mercado Livre / OLX)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
