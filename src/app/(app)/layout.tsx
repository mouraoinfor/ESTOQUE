import { exigirSessao } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { MODULOS, podeAcessar, TEMA_ROSA } from "@/lib/modulos";
import { sair } from "../actions";
import MenuLateral from "@/components/MenuLateral";
import LinhasClicaveis from "@/components/LinhasClicaveis";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Em paralelo: a lista de empresas não depende do usuário
  const [sessao, { atual, todas }] = await Promise.all([exigirSessao(), empresaAtual()]);
  const liberados = MODULOS.filter((m) => podeAcessar(sessao, m.chave)).map((m) => m.chave);

  return (
    <div className="shell">
      <MenuLateral
        usuario={sessao.nome ?? sessao.email}
        admin={sessao.admin}
        temaRosa={sessao.permissoes.includes(TEMA_ROSA)}
        liberados={liberados}
        empresas={todas.map((e) => ({ id: e.id, nome: e.nome }))}
        empresaId={atual?.id ?? null}
        sair={sair}
      />
      <main className="container">{children}</main>
      <LinhasClicaveis />
    </div>
  );
}
