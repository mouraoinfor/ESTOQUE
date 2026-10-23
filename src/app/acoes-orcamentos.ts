"use server";

import { revalidatePath } from "next/cache";
import type { NeonQueryPromise } from "@neondatabase/serverless";
import { db, query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { podeAcessar } from "@/lib/modulos";
import { soDigitos } from "@/lib/formato";
import {
  parcelar,
  totaisOrcamento,
  type ClienteBusca,
  type ContaReceberPedido,
  type DadosOrcamento,
  type ItemOrcamento,
  type StatusOrcamento,
} from "@/components/orcamentos/tipos";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cmd = NeonQueryPromise<false, false, Record<string, any>[]>;
type Resp<T = string> = { erro: string; faltando?: string[] } | { ok: T };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

function erroMsg(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  return m.replace(/^error:\s*/i, "");
}

function revalidar(id?: string) {
  revalidatePath("/orcamentos");
  if (id) revalidatePath(`/orcamentos/${id}`);
}

function revalidarEstoque(id: string) {
  revalidatePath("/", "layout");
  revalidar(id);
}

function textoOuNull(v: unknown) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function num(v: unknown) {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

async function cabecalho(id: string) {
  const [o] = await query<{ numero: number; titulo: string; status: StatusOrcamento; cliente_id: string | null; cliente_nome: string | null; empresa_id: string | null }>(
    "select numero, titulo, status, cliente_id, cliente_nome, empresa_id from orcamentos where id = $1",
    [id]
  );
  return o ?? null;
}

// ---------------------------------------------------------------------
// Salvar (cabeçalho + itens). Itens de orçamento baixado/cancelado não mudam.
// ---------------------------------------------------------------------

function validar(bruto: unknown): { erro: string } | { dados: DadosOrcamento } {
  if (!bruto || typeof bruto !== "object") return { erro: "Dados inválidos." };
  const b = bruto as Record<string, unknown>;
  const titulo = textoOuNull(b.titulo);
  if (!titulo) return { erro: "Informe o nome do projeto." };
  const validade = textoOuNull(b.validade);
  if (validade && !DATA.test(validade)) return { erro: "Validade inválida." };
  const desconto = b.desconto === "" || b.desconto === null || b.desconto === undefined ? 0 : num(b.desconto);
  if (!(desconto >= 0)) return { erro: "Desconto inválido." };
  const clienteId = textoOuNull(b.cliente_id);
  if (clienteId && !UUID.test(clienteId)) return { erro: "Cliente inválido." };
  const empresaId = textoOuNull(b.empresa_id);
  if (empresaId && !UUID.test(empresaId)) return { erro: "Empresa inválida." };
  if (!Array.isArray(b.itens)) return { erro: "Itens inválidos." };
  if (b.itens.length > 500) return { erro: "Itens demais (máx. 500)." };

  const itens: ItemOrcamento[] = [];
  for (const [k, x] of (b.itens as Record<string, unknown>[]).entries()) {
    const linha = `Linha ${k + 1}`;
    const descricao = textoOuNull(x?.descricao);
    if (!descricao) return { erro: `${linha}: informe a descrição.` };
    const produtoId = textoOuNull(x.produto_id);
    if (produtoId && !UUID.test(produtoId)) return { erro: `${linha}: produto inválido.` };
    const tipo = x.tipo === "servico" ? "servico" : "produto";
    const quantidade = num(x.quantidade);
    if (!(quantidade > 0)) return { erro: `${linha} (${descricao}): quantidade precisa ser maior que zero.` };
    if (produtoId && !Number.isInteger(quantidade)) return { erro: `${linha} (${descricao}): item do estoque precisa de quantidade inteira.` };
    const valor = x.valor_unitario === "" || x.valor_unitario === null ? 0 : num(x.valor_unitario);
    if (!(valor >= 0)) return { erro: `${linha} (${descricao}): valor inválido.` };
    const custo = x.custo_unitario === "" || x.custo_unitario === null || x.custo_unitario === undefined ? null : num(x.custo_unitario);
    if (custo !== null && !(custo >= 0)) return { erro: `${linha} (${descricao}): custo inválido.` };
    const id = textoOuNull(x.id);
    itens.push({
      id: id && UUID.test(id) ? id : undefined,
      produto_id: tipo === "servico" ? null : produtoId,
      tipo,
      descricao,
      quantidade,
      valor_unitario: valor,
      custo_unitario: custo,
    });
  }
  return {
    dados: {
      titulo,
      cliente_id: clienteId,
      cliente_nome: textoOuNull(b.cliente_nome),
      empresa_id: empresaId,
      validade,
      observacoes: textoOuNull(b.observacoes),
      condicoes: textoOuNull(b.condicoes),
      desconto,
      aos_cuidados: textoOuNull(b.aos_cuidados),
      descricao_servico: textoOuNull(b.descricao_servico),
      prazo_entrega: textoOuNull(b.prazo_entrega),
      garantia_fabricacao: textoOuNull(b.garantia_fabricacao),
      garantia_instalacao: textoOuNull(b.garantia_instalacao),
      exibir_valores: b.exibir_valores === "itens" ? "itens" : "total",
      itens,
    },
  };
}

export async function salvarOrcamento(id: string | null, _prev: unknown, fd: FormData): Promise<Resp> {
  const s = await exigirAcesso("orcamentos");
  const verCusto = podeAcessar(s, "itens");
  let bruto: unknown;
  try {
    bruto = JSON.parse(String(fd.get("dados") ?? ""));
  } catch {
    return { erro: "Dados inválidos." };
  }
  const v = validar(bruto);
  if ("erro" in v) return v;
  const d = v.dados;

  if (id) {
    if (!UUID.test(id)) return { erro: "Orçamento inválido." };
    const o = await cabecalho(id);
    if (!o) return { erro: "Orçamento não encontrado." };
    if (o.status === "baixado") return { erro: "Este orçamento já deu baixa no estoque. Estorne a baixa antes de editar." };
    if (o.status === "cancelado") return { erro: "Orçamento cancelado. Reabra como rascunho antes de editar." };
  }

  // Cliente do cadastro: guarda também o nome (aparece mesmo se o cadastro mudar)
  if (d.cliente_id) {
    const [c] = await query<{ nome: string }>("select nome from clientes where id = $1", [d.cliente_id]);
    if (!c) return { erro: "Cliente não encontrado no cadastro." };
    d.cliente_nome = c.nome;
  }
  if (d.empresa_id) {
    const [e] = await query("select 1 from empresas where id = $1", [d.empresa_id]);
    if (!e) return { erro: "Empresa não encontrada." };
  }

  // Custos: produto do estoque guarda o custo do momento em que entrou no orçamento
  const prodIds = [...new Set(d.itens.map((i) => i.produto_id).filter((x): x is string => !!x))];
  const produtos = prodIds.length
    ? await query<{ id: string; custo: number | null }>("select id, custo from produtos where id = any($1::uuid[])", [prodIds])
    : [];
  const custoProduto = new Map(produtos.map((p) => [p.id, p.custo]));
  for (const i of d.itens) if (i.produto_id && !custoProduto.has(i.produto_id)) return { erro: `Produto não encontrado: ${i.descricao}` };

  const antigos = id
    ? await query<{ id: string; produto_id: string | null; custo_unitario: number | null }>(
        "select id, produto_id, custo_unitario from orcamento_itens where orcamento_id = $1",
        [id]
      )
    : [];
  const antigo = new Map(antigos.map((a) => [a.id, a]));

  const linhas = d.itens.map((i, ordem) => {
    const a = i.id ? antigo.get(i.id) : undefined;
    let custo: number | null;
    if (i.produto_id) custo = a && a.produto_id === i.produto_id ? a.custo_unitario : custoProduto.get(i.produto_id) ?? null;
    else custo = verCusto ? i.custo_unitario : a?.custo_unitario ?? null;
    return {
      ordem,
      produto_id: i.produto_id,
      descricao: i.descricao,
      quantidade: i.quantidade,
      valor_unitario: i.valor_unitario,
      custo_unitario: custo,
      tipo: i.tipo,
    };
  });

  const desconto = Math.min(d.desconto, totaisOrcamento(d.itens, 0).subtotal);
  const oid = id ?? crypto.randomUUID();
  const sql = db();
  const cab = [
    d.titulo, d.cliente_id, d.cliente_nome, d.empresa_id, d.validade, d.observacoes, d.condicoes, desconto,
    d.aos_cuidados, d.descricao_servico, d.prazo_entrega, d.garantia_fabricacao, d.garantia_instalacao, d.exibir_valores,
  ];
  const editavel = "exists (select 1 from orcamentos where id = $1 and status in ('rascunho', 'aprovado'))";
  try {
    await sql.transaction([
      id
        ? sql.query(
            `update orcamentos set titulo = $2, cliente_id = $3, cliente_nome = $4, empresa_id = $5, validade = $6,
                    observacoes = $7, condicoes = $8, desconto = $9, aos_cuidados = $10, descricao_servico = $11,
                    prazo_entrega = $12, garantia_fabricacao = $13, garantia_instalacao = $14, exibir_valores = $15
              where id = $1 and status in ('rascunho', 'aprovado')`,
            [oid, ...cab]
          )
        : sql.query(
            `insert into orcamentos (id, titulo, cliente_id, cliente_nome, empresa_id, validade, observacoes, condicoes, desconto,
                                     aos_cuidados, descricao_servico, prazo_entrega, garantia_fabricacao, garantia_instalacao, exibir_valores, usuario)
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [oid, ...cab, s.email]
          ),
      sql.query(`delete from orcamento_itens where orcamento_id = $1 and ${editavel}`, [oid]),
      sql.query(
        `insert into orcamento_itens (orcamento_id, ordem, produto_id, descricao, quantidade, valor_unitario, custo_unitario, tipo)
         select $1, x.ordem, x.produto_id, x.descricao, x.quantidade, x.valor_unitario, x.custo_unitario, x.tipo
           from jsonb_to_recordset($2::jsonb) as x(ordem int, produto_id uuid, descricao text, quantidade double precision,
                                                   valor_unitario double precision, custo_unitario double precision, tipo text)
          where ${editavel}`,
        [oid, JSON.stringify(linhas)]
      ),
    ]);
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  revalidar(oid);
  return { ok: oid };
}

// ---------------------------------------------------------------------
// Contas a receber ligadas ao orçamento
// ---------------------------------------------------------------------

async function comandosContas(
  orcamentoId: string,
  o: { numero: number; titulo: string; cliente_id: string | null; cliente_nome: string | null },
  c: ContaReceberPedido
): Promise<{ erro: string } | { cmds: Cmd[] }> {
  if (!UUID.test(String(c.empresa_id))) return { erro: "Escolha a empresa da conta a receber." };
  const [e] = await query("select 1 from empresas where id = $1", [c.empresa_id]);
  if (!e) return { erro: "Empresa não encontrada." };
  const valor = num(c.valor);
  if (!(valor > 0)) return { erro: "Valor da conta a receber precisa ser maior que zero." };
  if (!DATA.test(String(c.vencimento))) return { erro: "Informe o vencimento da 1ª parcela." };
  const n = Math.trunc(num(c.parcelas));
  if (!(n >= 1 && n <= 60)) return { erro: "Parcelas: de 1 a 60." };
  const sql = db();
  const partes = parcelar(valor, n, c.vencimento);
  if (partes.some((p) => p.valor <= 0)) return { erro: "Valor pequeno demais para esse número de parcelas." };
  const obs = !o.cliente_id && o.cliente_nome ? `Cliente: ${o.cliente_nome}` : null;
  const cmds = partes.map((p, k) =>
    sql.query(
      `insert into lancamentos (empresa_id, tipo, descricao, cliente_id, vencimento, valor, observacoes, orcamento_id)
       values ($1, 'receber', $2, $3, $4, $5, $6, $7)`,
      [c.empresa_id, `Orçamento #${o.numero} - ${o.titulo}${n > 1 ? ` (${k + 1}/${n})` : ""}`, o.cliente_id, p.vencimento, p.valor, obs, orcamentoId]
    )
  );
  cmds.push(sql.query("update orcamentos set empresa_id = $2 where id = $1", [orcamentoId, c.empresa_id]));
  return { cmds };
}

export async function gerarContaReceber(id: string, conta: ContaReceberPedido): Promise<Resp<number>> {
  const s = await exigirAcesso("orcamentos");
  if (!podeAcessar(s, "receber")) return { erro: "Você não tem acesso ao contas a receber." };
  if (!UUID.test(id)) return { erro: "Orçamento inválido." };
  const o = await cabecalho(id);
  if (!o) return { erro: "Orçamento não encontrado." };
  if (o.status !== "aprovado" && o.status !== "baixado") return { erro: "Aprove o orçamento antes de gerar a conta a receber." };
  const r = await comandosContas(id, o, conta);
  if ("erro" in r) return r;
  try {
    await db().transaction(r.cmds);
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  revalidar(id);
  revalidatePath("/financeiro", "layout");
  return { ok: Math.trunc(num(conta.parcelas)) };
}

// ---------------------------------------------------------------------
// Status: aprovar, cancelar, voltar para rascunho
// ---------------------------------------------------------------------

const TRANSICOES: Record<"aprovar" | "cancelar" | "reabrir", { de: StatusOrcamento[]; para: StatusOrcamento }> = {
  aprovar: { de: ["rascunho"], para: "aprovado" },
  cancelar: { de: ["rascunho", "aprovado"], para: "cancelado" },
  reabrir: { de: ["aprovado", "cancelado"], para: "rascunho" },
};

export async function mudarStatusOrcamento(
  id: string,
  acao: "aprovar" | "cancelar" | "reabrir",
  conta?: ContaReceberPedido | null
): Promise<Resp> {
  const s = await exigirAcesso("orcamentos");
  if (!UUID.test(id)) return { erro: "Orçamento inválido." };
  const t = TRANSICOES[acao];
  if (!t) return { erro: "Ação inválida." };
  const o = await cabecalho(id);
  if (!o) return { erro: "Orçamento não encontrado." };
  if (!t.de.includes(o.status)) return { erro: `Não dá para ${acao} um orçamento ${o.status}.` };
  const [{ n }] = await query<{ n: number }>("select count(*)::int as n from orcamento_itens where orcamento_id = $1", [id]);
  if (acao === "aprovar" && n === 0) return { erro: "Adicione itens antes de aprovar." };

  const sql = db();
  const cmds: Cmd[] = [
    sql.query(
      `update orcamentos set status = $2, aprovado_em = case when $2 = 'aprovado' then now() when $2 = 'rascunho' then null else aprovado_em end
        where id = $1 and status = any($3::text[])`,
      [id, t.para, t.de]
    ),
  ];
  if (conta && acao === "aprovar") {
    if (!podeAcessar(s, "receber")) return { erro: "Você não tem acesso ao contas a receber." };
    const r = await comandosContas(id, o, conta);
    if ("erro" in r) return r;
    cmds.push(...r.cmds);
  }
  try {
    await sql.transaction(cmds);
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  revalidar(id);
  if (conta) revalidatePath("/financeiro", "layout");
  return { ok: t.para };
}

// ---------------------------------------------------------------------
// Baixa no estoque e estorno
// ---------------------------------------------------------------------

// Produtos sem saldo para o orçamento (soma linhas repetidas do mesmo produto)
async function faltasDeSaldo(id: string) {
  const r = await query<{ codigo: number; nome: string; pedido: number; estoque: number }>(
    `select p.codigo, p.nome, t.q as pedido, p.quantidade as estoque
       from (select produto_id, sum(quantidade)::int as q from orcamento_itens
              where orcamento_id = $1 and produto_id is not null group by produto_id) t
       join produtos p on p.id = t.produto_id
      where t.q > p.quantidade
      order by p.codigo`,
    [id]
  );
  return r.map((f) => `#${f.codigo} ${f.nome}: pedido ${f.pedido}, em estoque ${f.estoque}`);
}

export async function darBaixaOrcamento(id: string, conta?: ContaReceberPedido | null): Promise<Resp<number>> {
  const s = await exigirAcesso("orcamentos");
  if (!UUID.test(id)) return { erro: "Orçamento inválido." };
  const o = await cabecalho(id);
  if (!o) return { erro: "Orçamento não encontrado." };
  if (o.status === "baixado") return { erro: "Este orçamento já deu baixa no estoque." };
  if (o.status === "cancelado") return { erro: "Orçamento cancelado não dá baixa." };
  const [{ n }] = await query<{ n: number }>(
    "select count(*)::int as n from orcamento_itens where orcamento_id = $1 and produto_id is not null",
    [id]
  );
  if (n === 0) return { erro: "O orçamento não tem itens do estoque para dar baixa." };
  const faltando = await faltasDeSaldo(id);
  if (faltando.length) return { erro: "Saldo insuficiente no estoque. Nada foi baixado.", faltando };

  const sql = db();
  const cmds: Cmd[] = [sql.query("select baixar_orcamento($1, $2)", [id, s.email])];
  if (conta) {
    if (!podeAcessar(s, "receber")) return { erro: "Você não tem acesso ao contas a receber." };
    const r = await comandosContas(id, o, conta);
    if ("erro" in r) return r;
    cmds.push(...r.cmds);
  }
  try {
    await sql.transaction(cmds);
  } catch (e) {
    // Alguém mexeu no estoque entre a conferência e a baixa: a função recusa e nada é gravado
    return { erro: erroMsg(e) };
  }
  revalidarEstoque(id);
  if (conta) revalidatePath("/financeiro", "layout");
  return { ok: n };
}

export async function estornarBaixaOrcamento(id: string): Promise<Resp<number>> {
  const s = await exigirAcesso("orcamentos");
  if (!UUID.test(id)) return { erro: "Orçamento inválido." };
  try {
    const [r] = await query<{ n: number }>("select estornar_orcamento($1, $2) as n", [id, s.email]);
    revalidarEstoque(id);
    return { ok: r.n };
  } catch (e) {
    return { erro: erroMsg(e) };
  }
}

// ---------------------------------------------------------------------
// Duplicar e excluir
// ---------------------------------------------------------------------

export async function duplicarOrcamento(id: string): Promise<Resp> {
  const s = await exigirAcesso("orcamentos");
  if (!UUID.test(id)) return { erro: "Orçamento inválido." };
  const novo = crypto.randomUUID();
  const sql = db();
  try {
    const [r] = await sql.transaction([
      sql.query(
        `insert into orcamentos (id, titulo, cliente_id, cliente_nome, empresa_id, validade, observacoes, condicoes, desconto,
                                 aos_cuidados, descricao_servico, prazo_entrega, garantia_fabricacao, garantia_instalacao, exibir_valores, usuario)
         select $2, titulo || ' (cópia)', cliente_id, cliente_nome, empresa_id,
                case when validade is null then null else current_date + greatest(validade - created_at::date, 0) end,
                observacoes, condicoes, desconto,
                aos_cuidados, descricao_servico, prazo_entrega, garantia_fabricacao, garantia_instalacao, exibir_valores, $3
           from orcamentos where id = $1
         returning id`,
        [id, novo, s.email]
      ),
      // Custo atualizado pelo cadastro do produto (o preço fica o do orçamento original)
      sql.query(
        `insert into orcamento_itens (orcamento_id, ordem, produto_id, descricao, quantidade, valor_unitario, custo_unitario, tipo)
         select $2, i.ordem, i.produto_id, i.descricao, i.quantidade, i.valor_unitario,
                case when i.produto_id is not null then coalesce(p.custo, i.custo_unitario) else i.custo_unitario end, i.tipo
           from orcamento_itens i left join produtos p on p.id = i.produto_id
          where i.orcamento_id = $1 and exists (select 1 from orcamentos where id = $2)`,
        [id, novo]
      ),
    ]);
    if (!r.length) return { erro: "Orçamento não encontrado." };
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  revalidar();
  return { ok: novo };
}

export async function excluirOrcamento(id: string, apagarContas: boolean): Promise<Resp> {
  const s = await exigirAcesso("orcamentos");
  if (!UUID.test(id)) return { erro: "Orçamento inválido." };
  const o = await cabecalho(id);
  if (!o) return { erro: "Orçamento não encontrado." };
  if (o.status === "baixado") return { erro: "Estorne a baixa no estoque antes de excluir." };
  if (apagarContas && !podeAcessar(s, "receber")) return { erro: "Você não tem acesso ao contas a receber para apagar as contas." };
  const sql = db();
  try {
    await sql.transaction([
      ...(apagarContas ? [sql.query("delete from lancamentos where orcamento_id = $1 and status = 'aberto'", [id])] : []),
      sql.query("delete from orcamentos where id = $1 and status <> 'baixado'", [id]),
    ]);
  } catch (e) {
    return { erro: erroMsg(e) };
  }
  revalidar();
  if (apagarContas) revalidatePath("/financeiro", "layout");
  return { ok: id };
}

// ---------------------------------------------------------------------
// Cadastro rápido de cliente (pelo editor do orçamento)
// ---------------------------------------------------------------------

export async function cadastrarClienteRapido(_prev: unknown, fd: FormData): Promise<Resp<ClienteBusca> | undefined> {
  await exigirAcesso("orcamentos");
  const nome = textoOuNull(fd.get("nome"));
  if (!nome) return { erro: "Informe o nome do cliente." };
  const doc = soDigitos(String(fd.get("documento") ?? "")) || null;
  if (doc && doc.length !== 11 && doc.length !== 14) return { erro: "CPF deve ter 11 dígitos e CNPJ 14." };
  const telefone = textoOuNull(fd.get("telefone"));
  const email = textoOuNull(fd.get("email"));
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "E-mail inválido." };
  if (doc) {
    const [outro] = await query<{ nome: string }>("select nome from clientes where documento = $1", [doc]);
    if (outro) return { erro: `Já existe um cliente com esse CPF/CNPJ: ${outro.nome}. Busque por ele.` };
  }
  try {
    const [c] = await query<ClienteBusca>(
      "insert into clientes (nome, documento, telefone, email) values ($1, $2, $3, $4) returning id, nome, documento, telefone, email",
      [nome, doc, telefone, email]
    );
    revalidatePath("/financeiro", "layout");
    return { ok: c };
  } catch (e) {
    return { erro: erroMsg(e) };
  }
}
