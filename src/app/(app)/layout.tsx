import { exigirSessao } from "@/lib/auth";
import { sair } from "../actions";
import MenuLateral from "@/components/MenuLateral";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();

  return (
    <div className="shell">
      <MenuLateral usuario={sessao.nome ?? sessao.email} sair={sair} />
      <main className="container">{children}</main>
    </div>
  );
}
