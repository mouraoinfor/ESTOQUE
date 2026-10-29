import Link from "next/link";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl } from "@/lib/formato";
import { podeAcessar } from "@/lib/modulos";
import Icone from "@/components/Icone";
import FuncionariosLista from "@/components/rh/FuncionariosLista";
import { beneficiosMensais, type Funcionario } from "@/components/rh/rh-util";
import "./rh.css";

export const dynamic = "force-dynamic";

export default async function FuncionariosPagina() {
  const usuario = await exigirAcesso("rh");
  const funcionarios = await query<Funcionario & { ultimo_mes: string | null }>(
    `select f.id, f.nome, f.apelido, f.funcao, f.salario, f.admissao::text as admissao, f.demissao::text as demissao, f.ativo,
            f.vr_dia, f.vt_dia, f.va_mensal, f.documento, f.telefone, f.pix, f.observacoes,
            (select max(i.competencia)::text from folha_itens i where i.funcionario_id = f.id) as ultimo_mes
       from funcionarios f
      order by f.ativo desc, lower(f.nome)`
  );
  const ativos = funcionarios.filter((f) => f.ativo);
  const folhaMensal = ativos.reduce((s, f) => s + f.salario, 0);
  const beneficios = ativos.reduce((s, f) => s + beneficiosMensais(f), 0);

  return (
    <div className="rh">
      <div className="actions rh-topo">
        <h1>Funcionários</h1>
        <div className="actions">
          {podeAcessar(usuario, "folha") && (
            <Link className="btn" href="/rh/folha"><Icone nome="pessoas" tamanho={16} /> Folha de pagamento</Link>
          )}
          <Link className="btn primary" href="/rh/novo"><Icone nome="novo" tamanho={16} /> Novo funcionário</Link>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><div className="label">Ativos</div><div className="value">{ativos.length}</div></div>
        <div className="stat"><div className="label">Folha mensal (salários)</div><div className="value">{brl(folhaMensal)}</div></div>
        <div className="stat">
          <div className="label">Benefícios mensais estimados</div>
          <div className="value">{brl(beneficios)}</div>
        </div>
        <div className="stat"><div className="label">Custo mensal estimado</div><div className="value">{brl(folhaMensal + beneficios)}</div></div>
      </div>
      <p className="muted small rh-nota">Benefícios: (VR + VT por dia) x 22 dias + VA mensal de cada funcionário ativo.</p>

      <FuncionariosLista funcionarios={funcionarios} />
    </div>
  );
}
