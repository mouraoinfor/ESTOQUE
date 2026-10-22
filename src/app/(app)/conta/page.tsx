import { query } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import ContaForms from "@/components/ContaForms";

export const dynamic = "force-dynamic";

export default async function Conta() {
  const sessao = await exigirSessao();
  const usuarios = await query<{ id: string; email: string; nome: string | null }>(
    "select id, email, nome from usuarios order by created_at"
  );

  return (
    <>
      <h1>Minha conta</h1>
      <p className="muted">Logado como <strong>{sessao.email}</strong></p>
      <ContaForms />
      <div className="card" style={{ maxWidth: 520 }}>
        <h3>Usuários com acesso</h3>
        {usuarios.map((u) => (
          <div key={u.id} className="small" style={{ padding: ".3rem 0", borderBottom: "1px solid var(--border)" }}>
            {u.nome ? `${u.nome} · ` : ""}{u.email}
          </div>
        ))}
      </div>
    </>
  );
}
