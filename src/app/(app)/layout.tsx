import { exigirSessao } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { MODULOS, podeAcessar } from "@/lib/modulos";
import { sair } from "../actions";
import MenuLateral from "@/components/MenuLateral";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();
  const { atual, todas } = await empresaAtual();
  const liberados = MODULOS.filter((m) => podeAcessar(sessao, m.chave)).map((m) => m.chave);

  return (
    <div className="shell">
      <MenuLateral
        usuario={sessao.nome ?? sessao.email}
        admin={sessao.admin}
        liberados={liberados}
        empresas={todas.map((e) => ({ id: e.id, nome: e.nome }))}
        empresaId={atual?.id ?? null}
        sair={sair}
      />
      <main className="container">{children}</main>
    </div>
  );
}
