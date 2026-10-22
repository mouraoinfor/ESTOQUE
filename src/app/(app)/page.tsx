import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Tela inicial: só a imagem da marca; o usuário escolhe o módulo pelo menu lateral
export default async function Inicio({ searchParams }: { searchParams: Promise<{ "sem-acesso"?: string }> }) {
  await exigirSessao();
  const semAcesso = (await searchParams)["sem-acesso"] !== undefined;

  return (
    <div className="inicio" role="img" aria-label="FiberNet, A+ Energy e A+ Com Engenharia e Tecnologia">
      {semAcesso && <div className="alert warn inicio-aviso">Você não tem acesso a essa parte do sistema. Fale com o administrador.</div>}
    </div>
  );
}
