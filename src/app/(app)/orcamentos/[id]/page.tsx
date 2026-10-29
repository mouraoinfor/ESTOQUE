import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/auth";
import { precificacao } from "@/lib/configuracoes";
import { query } from "@/lib/db";
import { empresaAtual } from "@/lib/empresa";
import { podeAcessar } from "@/lib/modulos";
import EditorOrcamento, { type ContaLigada } from "@/components/orcamentos/EditorOrcamento";
import AnexosOrcamento from "@/components/anexos/AnexosOrcamento";
import AbasDocumentos from "@/components/anexos/AbasDocumentos";
import NotasOrcamento, { type Nota } from "@/components/anexos/NotasOrcamento";
import type { Anexo } from "@/components/anexos/tipos";
import { carregarOrcamento, clientesParaBusca, empresasParaProposta, produtosParaBusca } from "../dados";
import "../orcamentos.css";

export const dynamic = "force-dynamic";

export default async function OrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigirAcesso("orcamentos");
  const { id } = await params;
  const verCusto = podeAcessar(s, "itens");
  const dados = await carregarOrcamento(id);
  if (!dados) notFound();
  const { orcamento, itens } = dados;
  const n = orcamento.numero;

  const [{ atual, todas }, produtos, clientes, contas, movs, [versao], empresasProposta, [gastosProjeto], anexos, notas] = await Promise.all([
    empresaAtual(),
    produtosParaBusca(verCusto),
    clientesParaBusca(),
    query<ContaLigada>(
      `select l.id, l.descricao, l.vencimento::text as vencimento, l.valor, l.status, e.nome as empresa_nome
         from lancamentos l join empresas e on e.id = l.empresa_id
        where l.orcamento_id = $1 order by l.vencimento, l.descricao`,
      [id]
    ),
    // Movimentações geradas por este orçamento (identificadas pelo motivo)
    query<{ id: string; produto_id: string; codigo: number; nome: string; tipo: string; quantidade: number; saldo_apos: number | null; motivo: string; usuario: string | null; created_at: string }>(
      `select m.id, m.produto_id, p.codigo, p.nome, m.tipo, m.quantidade, m.saldo_apos, m.motivo, m.usuario, m.created_at
         from movimentacoes m join produtos p on p.id = m.produto_id
        where m.motivo like $1 or m.motivo = $2
        order by m.created_at desc, p.nome
        limit 300`,
      [`Orçamento #${n} - %`, `Estorno orçamento #${n}`]
    ),
    query<{ v: string }>("select updated_at::text as v from orcamentos where id = $1", [id]),
    empresasParaProposta(),
    query<{ n: number; total: number }>(
      "select count(*)::int as n, coalesce(sum(quantidade * valor_unitario), 0) as total from projeto_gastos where orcamento_id = $1",
      [id]
    ),
    query<Anexo>(
      "select id, nome, mime, tamanho::float8 as tamanho, partes, usuario, created_at from orcamento_anexos where orcamento_id = $1 and completo order by created_at",
      [id]
    ),
    query<Nota>(
      "select id, texto, usuario, created_at from orcamento_notas where orcamento_id = $1 order by created_at desc",
      [id]
    ),
  ]);

  return (
    <>
      <EditorOrcamento
        orcamento={orcamento}
        versao={`${versao?.v}-${itens.length}-${contas.length}`}
        itens={verCusto ? itens : itens.map((i) => ({ ...i, custo_unitario: null }))}
        produtos={produtos}
        clientes={clientes}
        empresas={todas.map((e) => ({ id: e.id, nome: e.nome }))}
        empresasProposta={empresasProposta}
        empresaPadrao={atual?.id ?? null}
        validadePadrao=""
        verCusto={verCusto}
        podeReceber={podeAcessar(s, "receber")}
        precificacao={await precificacao()}
        contas={contas}
        gastosProjeto={gastosProjeto}
      />

      <AbasDocumentos
        nDocumentos={anexos.length}
        nObservacoes={notas.length}
        documentos={<AnexosOrcamento orcamentoId={id} anexos={anexos} podeEditar />}
        observacoes={<NotasOrcamento orcamentoId={id} notas={notas} podeEditar />}
      />

      <div className="card">
        <h3>Histórico no estoque</h3>
        {!movs.length && <p className="muted small">Nenhuma movimentação de estoque feita por este orçamento.</p>}
        {movs.map((m) => (
          <div key={m.id} className="small orc-mov">
            <strong className={m.quantidade >= 0 ? "diff-pos" : "diff-neg"}>{m.quantidade > 0 ? "+" : ""}{m.quantidade}</strong>{" "}
            <Link href={`/itens/${m.produto_id}`}>#{m.codigo} {m.nome}</Link>
            {" · "}{m.tipo} · saldo {m.saldo_apos} · {new Date(m.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            {" · "}{m.motivo}
            {m.usuario && <span className="muted"> · {m.usuario}</span>}
          </div>
        ))}
      </div>
    </>
  );
}
