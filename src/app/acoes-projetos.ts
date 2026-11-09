"use server";

import { revalidatePath } from "next/cache";
import type { NeonQueryPromise } from "@neondatabase/serverless";
import { db, query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { podeAcessar } from "@/lib/modulos";
import { CATEGORIAS_GASTO, type CategoriaGasto } from "@/components/projetos/tipos";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cmd = NeonQueryPromise<false, false, Record<string, any>[]>;
type Resp = { erro: string } | { ok: true };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

function erroMsg(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  return m.replace(/^error:\s*/i, "");
}

function num(v: unknown) {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function revalidar(id: string) {
  revalidatePath("/projetos");
  revalidatePath(`/projetos/${id}`);
}

// Confere se o item é deste orçamento: id, null (sem item) ou false (inválido)
async function itemDoOrcamento(orcamentoId: string, itemId: string | null | undefined): Promise<string | null | false> {
  if (!itemId) return null;
  if (!UUID.test(itemId)) return false;
  const [i] = await query("select 1 from orcamento_itens where id = $1 and orcamento_id = $2", [itemId, orcamentoId]);
  return i ? itemId : false;
}

export interface NovoGasto {
  data: string;
  categoria: CategoriaGasto;
  descricao: string;
  produto_id: string | null;
  quantidade: number | string;
  valor_unitario: number | string;
  baixar_estoque: boolean;
  // Item avulso sem NF (não está no estoque); só vale sem produto_id
  sem_nf?: boolean;
  // Item do orçamento a que o gasto pertence (ex.: pacote "Materiais de Infraestrutura"); null = geral
  orcamento_item_id?: string | null;
  // Lança também em contas a pagar (na empresa atual)
  gerar_conta: boolean;
  vencimento: string;
  pago: boolean;
}

// Lança um gasto no projeto (abate do valor do contrato)
export async function adicionarGasto(orcamentoId: string, g: NovoGasto): Promise<Resp> {
  const s = await exigirAcesso("projetos");
  if (!UUID.test(orcamentoId)) return { erro: "Projeto inválido." };
  const [o] = await query<{ numero: number; titulo: string; tipo: string; status: string }>(
    "select numero, titulo, tipo, status from orcamentos where id = $1",
    [orcamentoId]
  );
  if (!o || o.tipo !== "projeto") return { erro: "Projeto não encontrado." };
  if (o.status !== "aprovado" && o.status !== "baixado") return { erro: "Feche o contrato (aprovar o orçamento) antes de lançar gastos." };

  const descricao = String(g.descricao ?? "").trim();
  const qtd = num(g.quantidade);
  const vu = num(g.valor_unitario);
  if (!descricao) return { erro: "Informe a descrição do gasto." };
  if (!DATA.test(g.data)) return { erro: "Data inválida." };
  if (!(g.categoria in CATEGORIAS_GASTO)) return { erro: "Categoria inválida." };
  if (!(qtd > 0)) return { erro: "Quantidade precisa ser maior que zero." };
  if (!(vu >= 0)) return { erro: "Valor inválido." };
  const produtoId = g.produto_id && UUID.test(g.produto_id) ? g.produto_id : null;
  const itemId = await itemDoOrcamento(orcamentoId, g.orcamento_item_id);
  if (itemId === false) return { erro: "Item do orçamento não encontrado." };
  const baixar = !!(produtoId && g.baixar_estoque);
  const semNf = !produtoId && !!g.sem_nf;
  if (baixar) {
    if (qtd !== Math.trunc(qtd)) return { erro: "Para tirar do estoque a quantidade precisa ser inteira." };
    const [p] = await query<{ quantidade: number; nome: string }>("select quantidade, nome from produtos where id = $1", [produtoId]);
    if (!p) return { erro: "Produto não encontrado." };
    if (p.quantidade < qtd) return { erro: `Saldo insuficiente de ${p.nome}: em estoque ${p.quantidade}.` };
  }

  const sql = db();
  const id = crypto.randomUUID();
  const cmds: Cmd[] = [];
  let lancamentoId: string | null = null;
  const total = Math.round(qtd * vu * 100) / 100;
  if (g.gerar_conta) {
    if (!podeAcessar(s, "pagar")) return { erro: "Você não tem acesso ao contas a pagar." };
    if (!(total > 0)) return { erro: "Para lançar em contas a pagar o valor precisa ser maior que zero." };
    if (!DATA.test(g.vencimento)) return { erro: "Vencimento inválido." };
    const { atual } = await empresaAtual();
    if (!atual) return { erro: "Cadastre a empresa no financeiro antes de lançar contas a pagar." };
    lancamentoId = crypto.randomUUID();
    cmds.push(
      sql.query(
        `insert into lancamentos (id, empresa_id, tipo, descricao, vencimento, valor, status, pago_em, orcamento_id, observacoes)
         values ($1, $2, 'pagar', $3, $4, $5, $6, $7, $8, $9)`,
        [
          lancamentoId,
          atual.id,
          `Projeto #${o.numero} - ${descricao}${semNf ? " (sem NF)" : ""}`,
          g.vencimento,
          total,
          g.pago ? "pago" : "aberto",
          g.pago ? g.vencimento : null,
          orcamentoId,
          `Gasto do projeto ${o.titulo}`,
        ]
      )
    );
  }
  cmds.push(
    sql.query(
      `insert into projeto_gastos (id, orcamento_id, data, categoria, descricao, produto_id, quantidade, valor_unitario, baixou_estoque, lancamento_id, usuario, orcamento_item_id, sem_nf)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [id, orcamentoId, g.data, g.categoria, descricao, produtoId, qtd, vu, baixar, lancamentoId, s.nome ?? s.email, itemId, semNf]
    )
  );
  if (baixar) {
    cmds.push(
      sql.query("select movimentar_estoque($1, 'saida', $2, $3, $4)", [
        produtoId,
        qtd,
        `Projeto #${o.numero} - ${o.titulo}`,
        s.nome ?? s.email,
      ])
    );
  }
  try {
    await sql.transaction(cmds);
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  revalidar(orcamentoId);
  if (baixar) revalidatePath("/", "layout");
  if (lancamentoId) revalidatePath("/financeiro", "layout");
  return { ok: true };
}

// Exclui o gasto: devolve ao estoque o que ele tirou e apaga a conta a pagar em aberto gerada junto
export async function excluirGasto(id: string): Promise<Resp> {
  const s = await exigirAcesso("projetos");
  if (!UUID.test(id)) return { erro: "Gasto inválido." };
  const [g] = await query<{ orcamento_id: string; numero: number; titulo: string; produto_id: string | null; quantidade: number; baixou_estoque: boolean; lancamento_id: string | null; conta_status: string | null }>(
    `select g.orcamento_id, o.numero, o.titulo, g.produto_id, g.quantidade, g.baixou_estoque, g.lancamento_id, l.status as conta_status
       from projeto_gastos g join orcamentos o on o.id = g.orcamento_id
       left join lancamentos l on l.id = g.lancamento_id
      where g.id = $1`,
    [id]
  );
  if (!g) return { erro: "Gasto não encontrado." };
  if (g.conta_status === "pago") return { erro: "A conta a pagar deste gasto já foi paga. Estorne o pagamento no financeiro antes de excluir." };
  const sql = db();
  const cmds: Cmd[] = [sql.query("delete from projeto_gastos where id = $1", [id])];
  if (g.lancamento_id) cmds.push(sql.query("delete from lancamentos where id = $1 and status = 'aberto'", [g.lancamento_id]));
  if (g.baixou_estoque && g.produto_id) {
    cmds.push(
      sql.query("select movimentar_estoque($1, 'entrada', $2, $3, $4)", [
        g.produto_id,
        Math.trunc(g.quantidade),
        `Estorno projeto #${g.numero} - ${g.titulo}`,
        s.nome ?? s.email,
      ])
    );
  }
  try {
    await sql.transaction(cmds);
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  revalidar(g.orcamento_id);
  if (g.baixou_estoque) revalidatePath("/", "layout");
  if (g.lancamento_id) revalidatePath("/financeiro", "layout");
  return { ok: true };
}

// Liga (ou desliga) um gasto já lançado a um item do orçamento
export async function ligarGastoAoItem(id: string, itemId: string | null): Promise<Resp> {
  await exigirAcesso("projetos");
  if (!UUID.test(id)) return { erro: "Gasto inválido." };
  const [g] = await query<{ orcamento_id: string }>("select orcamento_id from projeto_gastos where id = $1", [id]);
  if (!g) return { erro: "Gasto não encontrado." };
  const item = await itemDoOrcamento(g.orcamento_id, itemId);
  if (item === false) return { erro: "Item do orçamento não encontrado." };
  try {
    await query("update projeto_gastos set orcamento_item_id = $2 where id = $1", [id, item]);
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  revalidar(g.orcamento_id);
  return { ok: true };
}
