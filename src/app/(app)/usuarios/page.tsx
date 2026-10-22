import { query } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth";
import { NovoUsuario, UsuarioCard, type UsuarioLinha } from "@/components/UsuariosAdmin";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const eu = await exigirAdmin();
  const usuarios = await query<UsuarioLinha>(
    "select id, email, nome, admin, ativo, permissoes from usuarios order by admin desc, created_at"
  );

  return (
    <>
      <h1>Usuários e acessos</h1>
      <p className="muted">
        Só administradores veem esta tela. Marque em cada pessoa os módulos que ela pode abrir — quem é administrador acessa tudo.
      </p>
      <NovoUsuario />
      <div className="usuarios-lista">
        {usuarios.map((u) => <UsuarioCard key={u.id} u={u} souEu={u.id === eu.id} />)}
      </div>
    </>
  );
}
