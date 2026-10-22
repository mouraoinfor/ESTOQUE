// Regras de banco do módulo Notas fiscais (análise, importação e exclusão da NF-e).
// Recebe o acesso ao banco por parâmetro (ver acoes-notas.ts) para poder ser testado por script Node.
// Tudo é validado aqui de novo: o custo sai do XML parseado no servidor, nunca do que a tela mandou.
import { ErroNFe, lerNFe, margemDe, markupDe, type NFe } from "./nfe";
import { CATEGORIAS } from "./types";

export interface Comando {
  texto: string;
  params: unknown[];
}

export interface AcessoBanco {
  query<T = Record<string, unknown>>(texto: string, params?: unknown[]): Promise<T[]>;
  transacao(comandos: Comando[]): Promise<unknown>;
}

export type AcaoItem = "vincular" | "criar" | "ignorar";

export interface EscolhaItem {
  nItem: number;
  acao: AcaoItem;
  produtoId?: string | null; // vincular
  nome?: string | null; // criar
  categoria?: string | null; // criar
  quantidadeEstoque: number; // unidades que entram no estoque (inteiro)
  precoVenda: number | null;
  atualizarPreco: boolean;
}

export interface ParcelaEntrada {
  numero: string;
  vencimento: string; // AAAA-MM-DD
  valor: number;
}

export interface EntradaImportacao {
  xml: string;
  empresaId: string;
  itens: EscolhaItem[];
  lancarPagar: boolean;
  parcelas: ParcelaEntrada[];
  bancoId: string | null;
}

export interface Sugestao {
  produtoId: string;
  motivo: "codigo" | "gtin";
}

export interface Analise {
  duplicada: { id: string; numero: string | null } | null;
  fornecedor: { id: string; nome: string } | null;
  empresaId: string | null; // empresa cujo CNPJ é o do destinatário
  sugestoes: Record<number, Sugestao>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

function dataValida(s: string) {
  if (!DATA.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function soDigitos(s: string | null | undefined) {
  return (s ?? "").replace(/\D/g, "");
}

function msg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export function lerNFeServidor(xml: string): { nfe: NFe } | { erro: string } {
  try {
    return { nfe: lerNFe(xml) };
  } catch (e) {
    return { erro: e instanceof ErroNFe ? e.message : `Não consegui ler o XML: ${msg(e)}` };
  }
}

// ---------------------------------------------------------------------
// Análise (o que já existe no banco para esta nota)
// ---------------------------------------------------------------------
export async function analisarNota(b: AcessoBanco, nfe: NFe): Promise<Analise> {
  const docEmit = soDigitos(nfe.emitente.documento);
  const docDest = soDigitos(nfe.destinatario.documento);
  const codigos = [...new Set(nfe.itens.map((i) => i.codigo).filter(Boolean))];
  const gtins = [...new Set(nfe.itens.map((i) => i.gtin).filter(Boolean))];

  const [dup, forn, emp, porCodigo, porGtin] = await Promise.all([
    b.query<{ id: string; numero: string | null }>("select id, numero from notas_fiscais where chave = $1", [nfe.chave]),
    b.query<{ id: string; nome: string }>("select id, nome from fornecedores where documento = $1", [docEmit]),
    docDest ? b.query<{ id: string }>("select id from empresas where documento = $1", [docDest]) : Promise.resolve([]),
    codigos.length
      ? b.query<{ codigo: string; produto_id: string }>(
          `select distinct on (ni.codigo_fornecedor) ni.codigo_fornecedor as codigo, ni.produto_id
             from nota_itens ni
             join notas_fiscais nf on nf.id = ni.nota_id
             join fornecedores f on f.id = nf.fornecedor_id
             join produtos p on p.id = ni.produto_id
            where f.documento = $1 and ni.codigo_fornecedor = any($2::text[])
            order by ni.codigo_fornecedor, nf.created_at desc`,
          [docEmit, codigos]
        )
      : Promise.resolve([]),
    gtins.length
      ? b.query<{ id: string; gtin: string }>(
          "select id, gtin from produtos where gtin = any($1::text[]) order by quantidade desc, created_at",
          [gtins]
        )
      : Promise.resolve([]),
  ]);

  const sugestoes: Record<number, Sugestao> = {};
  for (const it of nfe.itens) {
    const c = porCodigo.find((r) => r.codigo === it.codigo);
    if (c) {
      sugestoes[it.nItem] = { produtoId: c.produto_id, motivo: "codigo" };
      continue;
    }
    const g = it.gtin ? porGtin.find((r) => r.gtin === it.gtin) : undefined;
    if (g) sugestoes[it.nItem] = { produtoId: g.id, motivo: "gtin" };
  }

  return { duplicada: dup[0] ?? null, fornecedor: forn[0] ?? null, empresaId: emp[0]?.id ?? null, sugestoes };
}

// ---------------------------------------------------------------------
// Importação (uma transação)
// ---------------------------------------------------------------------
export async function importarNota(
  b: AcessoBanco,
  e: EntradaImportacao,
  usuario: { email: string; podePagar: boolean }
): Promise<{ erro: string } | { ok: { id: string } }> {
  const lido = lerNFeServidor(String(e?.xml ?? ""));
  if ("erro" in lido) return { erro: lido.erro };
  const nfe = lido.nfe;

  if (!UUID.test(String(e.empresaId ?? ""))) return { erro: "Escolha a empresa da nota." };
  const docEmit = soDigitos(nfe.emitente.documento);

  const [dup, emp, forn] = await Promise.all([
    b.query<{ id: string }>("select id from notas_fiscais where chave = $1", [nfe.chave]),
    b.query<{ id: string }>("select id from empresas where id = $1", [e.empresaId]),
    b.query<{ id: string; nome: string }>("select id, nome from fornecedores where documento = $1", [docEmit]),
  ]);
  if (dup[0]) return { erro: "Esta nota já foi importada." };
  if (!emp[0]) return { erro: "Empresa não encontrada." };
  const nomeFornecedor = forn[0]?.nome ?? nfe.emitente.nome;

  // Escolhas por item
  const escolhas = new Map<number, EscolhaItem>();
  for (const x of Array.isArray(e.itens) ? e.itens : []) escolhas.set(Number(x?.nItem), x);
  const vinculados = [...escolhas.values()].filter((x) => x.acao === "vincular").map((x) => String(x.produtoId ?? ""));
  if (vinculados.some((id) => !UUID.test(id))) return { erro: "Há item marcado para vincular sem produto escolhido." };
  const existentes = vinculados.length
    ? await b.query<{ id: string }>("select id from produtos where id = any($1::uuid[])", [vinculados])
    : [];
  const idsExistentes = new Set(existentes.map((p) => p.id));

  const notaId = crypto.randomUUID();
  const motivo = `NF ${nfe.numero} - ${nomeFornecedor}`.slice(0, 200);
  const cmds: Comando[] = [];
  const fornecedorSub = "(select id from fornecedores where documento = $1)";

  cmds.push({
    texto: "insert into fornecedores (nome, documento, telefone) values ($1, $2, $3) on conflict (documento) do nothing",
    params: [nfe.emitente.nome || docEmit, docEmit, nfe.emitente.telefone || null],
  });
  cmds.push({
    texto: `insert into notas_fiscais (id, empresa_id, fornecedor_id, chave, numero, serie, emissao, natureza,
              valor_produtos, valor_frete, valor_seguro, valor_desconto, valor_ipi, valor_st, valor_outros, valor_total,
              xml, usuario, forma_pagamento)
            values ($2, $3, ${fornecedorSub}, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
    params: [
      docEmit, notaId, e.empresaId, nfe.chave, nfe.numero, nfe.serie, nfe.emissao, nfe.natureza || null,
      nfe.totais.vProd, nfe.totais.vFrete, nfe.totais.vSeg, nfe.totais.vDesc, nfe.totais.vIPI,
      nfe.totais.vST + nfe.totais.vFCPST, nfe.totais.vOutro, nfe.totais.vNF,
      e.xml, usuario.email, nfe.formaPagamento || null,
    ],
  });

  for (const it of nfe.itens) {
    const x = escolhas.get(it.nItem);
    if (!x) return { erro: `Falta a escolha do item ${it.nItem} (${it.descricao}).` };
    if (!["vincular", "criar", "ignorar"].includes(x.acao)) return { erro: `Ação inválida no item ${it.nItem}.` };

    const qtd = x.acao === "ignorar" ? 0 : Number(x.quantidadeEstoque);
    if (!Number.isInteger(qtd) || qtd < 0 || qtd > 1_000_000) {
      return { erro: `Quantidade para o estoque do item ${it.nItem} precisa ser um número inteiro (0 ou mais).` };
    }
    const preco =
      x.acao === "ignorar" || x.precoVenda === null || x.precoVenda === undefined ? null : Math.round(Number(x.precoVenda) * 100) / 100;
    if (preco !== null && !(Number.isFinite(preco) && preco > 0)) return { erro: `Preço de venda inválido no item ${it.nItem}.` };

    // Custo por unidade de estoque: o custo total do item dividido pelo que entra no estoque
    // (igual ao custo unitário da nota quando a quantidade é a mesma)
    const custo = qtd > 0 ? it.custoTotal / qtd : it.custoUnitario;
    const markup = preco !== null ? markupDe(custo, preco) : null;
    const margem = preco !== null ? margemDe(custo, preco) : null;
    const atualizar = x.acao !== "ignorar" && preco !== null && !!x.atualizarPreco;

    let produtoId: string | null = null;
    if (x.acao === "vincular") {
      produtoId = String(x.produtoId);
      if (!idsExistentes.has(produtoId)) return { erro: `O produto escolhido no item ${it.nItem} não existe mais.` };
    } else if (x.acao === "criar") {
      const nome = String(x.nome ?? "").trim();
      if (!nome) return { erro: `Informe o nome do produto novo do item ${it.nItem}.` };
      const categoria = x.categoria ? String(x.categoria) : null;
      if (categoria && !CATEGORIAS.includes(categoria)) return { erro: `Categoria inválida no item ${it.nItem}.` };
      produtoId = crypto.randomUUID();
      cmds.push({
        texto: `insert into produtos (id, nome, nome_original, categoria, condicao, quantidade, custo, preco_venda, gtin, observacoes)
                values ($1, $2, $3, $4, 'novo', 0, $5, $6, $7, $8)`,
        params: [
          produtoId, nome.slice(0, 300), it.descricao, categoria, custo, atualizar ? preco : null, it.gtin || null,
          `Cadastrado pela importação da ${motivo} (código do fornecedor: ${it.codigo}).`,
        ],
      });
    }

    const criado = x.acao === "criar";
    cmds.push({
      texto: `insert into nota_itens (nota_id, numero_item, produto_id, codigo_fornecedor, gtin, descricao, ncm, cfop, unidade,
                quantidade, valor_unitario, valor_total, custo_unitario, markup, margem, preco_venda,
                quantidade_estoque, produto_criado, atualizou_preco, custo_anterior, preco_anterior)
              values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
                ${produtoId && !criado ? "(select custo from produtos where id = $3)" : "null"},
                ${produtoId && !criado ? "(select preco_venda from produtos where id = $3)" : "null"})`,
      params: [
        notaId, it.nItem, produtoId, it.codigo || null, it.gtin || null, it.descricao || "(sem descrição)", it.ncm || null,
        it.cfop || null, it.unidade || null, it.quantidade, it.valorUnitario, it.valorProdutos, custo,
        markup, margem, preco, qtd, criado, atualizar,
      ],
    });

    if (x.acao === "vincular") {
      cmds.push({
        texto: atualizar
          ? "update produtos set custo = $2, preco_venda = $3 where id = $1"
          : "update produtos set custo = $2 where id = $1",
        params: atualizar ? [produtoId, custo, preco] : [produtoId, custo],
      });
    }
    if (produtoId && qtd > 0) {
      cmds.push({ texto: "select movimentar_estoque($1, 'entrada', $2, $3, $4)", params: [produtoId, qtd, motivo, usuario.email] });
    }
  }

  // Contas a pagar
  if (e.lancarPagar) {
    if (!usuario.podePagar) return { erro: "Você não tem acesso ao contas a pagar. Desmarque o lançamento no financeiro." };
    const parcelas = Array.isArray(e.parcelas) ? e.parcelas : [];
    if (!parcelas.length) return { erro: "Informe ao menos uma parcela para o contas a pagar." };
    if (e.bancoId) {
      if (!UUID.test(e.bancoId)) return { erro: "Banco inválido." };
      const [bc] = await b.query("select id from bancos where id = $1 and empresa_id = $2", [e.bancoId, e.empresaId]);
      if (!bc) return { erro: "O banco escolhido não é desta empresa." };
    }
    parcelas.forEach((p, k) => {
      cmds.push({
        texto: `insert into lancamentos (empresa_id, tipo, descricao, fornecedor_id, vencimento, valor, banco_id, documento, nota_id)
                values ($2, 'pagar', $3, ${fornecedorSub}, $4, $5, $6, $7, $8)`,
        params: [
          docEmit, e.empresaId,
          parcelas.length > 1 ? `${motivo} (${k + 1}/${parcelas.length})` : motivo,
          p?.vencimento, Math.round(Number(p?.valor) * 100) / 100, e.bancoId || null,
          String(p?.numero ?? "").trim().slice(0, 60) || null, notaId,
        ],
      });
    });
    for (const [k, p] of parcelas.entries()) {
      if (!dataValida(String(p?.vencimento ?? ""))) return { erro: `Vencimento inválido na parcela ${k + 1}.` };
      const v = Number(p?.valor);
      if (!(Number.isFinite(v) && Math.round(v * 100) > 0)) return { erro: `Valor inválido na parcela ${k + 1}.` };
    }
  }

  try {
    await b.transacao(cmds);
  } catch (err) {
    const m = msg(err);
    if (m.includes("notas_fiscais_chave_key")) return { erro: "Esta nota já foi importada." };
    return { erro: `Não foi possível importar: ${m}` };
  }
  return { ok: { id: notaId } };
}

// ---------------------------------------------------------------------
// Exclusão: desfaz o estoque, apaga as parcelas em aberto, restaura custo/preço
// ---------------------------------------------------------------------
export interface ParcelaPaga {
  id: string;
  descricao: string;
  valor: number;
  pago_em: string | null;
}

export interface FaltaEstoque {
  nome: string;
  entrou: number;
  tem: number;
}

export type ResultadoExclusao =
  | { ok: true; parcial: FaltaEstoque[] }
  | { erro: string; pagas?: ParcelaPaga[]; faltas?: FaltaEstoque[] };

export interface OpcoesExclusao {
  // Estorna as baixas das parcelas pagas antes de excluir (a função vem de lib/financeiro.ts)
  estornarPagas?: boolean;
  estornar?: (lancamentoId: string) => Promise<void>;
  // Quando falta saldo: tira só o que houver (zera o produto no máximo)
  parcial?: boolean;
}

export async function excluirNota(
  b: AcessoBanco,
  notaId: string,
  email: string,
  op: OpcoesExclusao = {}
): Promise<ResultadoExclusao> {
  if (!UUID.test(notaId)) return { erro: "Nota não encontrada." };
  const [nota] = await b.query<{ id: string; numero: string | null }>("select id, numero from notas_fiscais where id = $1", [notaId]);
  if (!nota) return { erro: "Nota não encontrada." };

  const pagos = await b.query<ParcelaPaga>(
    "select id, descricao, valor, pago_em::text as pago_em from lancamentos where nota_id = $1 and status = 'pago' order by vencimento",
    [notaId]
  );
  if (pagos.length && !op.estornarPagas) {
    return {
      erro: `${pagos.length === 1 ? "Uma parcela desta nota já foi paga" : `${pagos.length} parcelas desta nota já foram pagas`}. Para excluir a nota é preciso estornar ${pagos.length === 1 ? "a baixa" : "as baixas"}.`,
      pagas: pagos,
    };
  }

  const itens = await b.query<{
    produto_id: string;
    quantidade_estoque: number;
    produto_criado: boolean;
    atualizou_preco: boolean;
    custo_unitario: number | null;
    preco_venda: number | null;
    custo_anterior: number | null;
    preco_anterior: number | null;
    nome: string;
    estoque: number;
    outras_notas: number;
    movs: number;
  }>(
    `select ni.produto_id, ni.quantidade_estoque, ni.produto_criado, ni.atualizou_preco, ni.custo_unitario, ni.preco_venda,
            ni.custo_anterior, ni.preco_anterior, p.nome, p.quantidade as estoque,
            (select count(*)::int from nota_itens o where o.produto_id = ni.produto_id and o.nota_id <> ni.nota_id) as outras_notas,
            (select count(*)::int from movimentacoes m where m.produto_id = ni.produto_id) as movs
       from nota_itens ni
       join produtos p on p.id = ni.produto_id
      where ni.nota_id = $1`,
    [notaId]
  );

  // Quanto cada produto precisa ter em estoque para desfazer (o mesmo produto pode aparecer em mais de um item)
  const precisa = new Map<string, { nome: string; estoque: number; qtd: number }>();
  for (const it of itens) {
    if (it.quantidade_estoque <= 0) continue;
    const atual = precisa.get(it.produto_id) ?? { nome: it.nome, estoque: it.estoque, qtd: 0 };
    atual.qtd += it.quantidade_estoque;
    precisa.set(it.produto_id, atual);
  }
  const faltas: FaltaEstoque[] = [...precisa.values()]
    .filter((p) => p.estoque < p.qtd)
    .map((p) => ({ nome: p.nome, entrou: p.qtd, tem: p.estoque }));
  if (faltas.length && !op.parcial) {
    return {
      erro: `Não há saldo para desfazer toda a entrada no estoque (parte já saiu ou foi vendida).`,
      faltas,
    };
  }

  // Estorno das baixas (antes de montar a transação, que exige todas as parcelas em aberto)
  if (pagos.length) {
    if (!op.estornar) return { erro: "Estorno de baixa indisponível." };
    try {
      for (const p of pagos) await op.estornar(p.id);
    } catch (err) {
      return { erro: `Não foi possível estornar as baixas: ${msg(err)}` };
    }
  }

  const cmds: Comando[] = [
    // Trava: se alguma parcela foi paga depois da conferência acima, a transação falha (divisão por zero)
    {
      texto: "select 1 / (case when exists (select 1 from lancamentos where nota_id = $1 and status = 'pago') then 0 else 1 end)",
      params: [notaId],
    },
  ];
  const motivo = `Exclusão NF ${nota.numero ?? ""}`.trim();
  const apagar = new Set<string>();
  const saldo = new Map<string, number>(itens.map((it) => [it.produto_id, it.estoque]));
  for (const it of itens) {
    // Produto cadastrado por esta nota e sem outro uso (só a movimentação de entrada dela): apaga o produto
    if (it.produto_criado && it.outras_notas === 0 && it.movs <= 1 && it.estoque === it.quantidade_estoque) {
      apagar.add(it.produto_id);
      continue;
    }
    // Sem saldo suficiente (modo parcial): tira só o que houver
    const tirar = Math.min(it.quantidade_estoque, saldo.get(it.produto_id) ?? 0);
    if (tirar > 0) {
      saldo.set(it.produto_id, (saldo.get(it.produto_id) ?? 0) - tirar);
      cmds.push({ texto: "select movimentar_estoque($1, 'saida', $2, $3, $4)", params: [it.produto_id, tirar, motivo, email] });
    }
    if (!it.produto_criado) {
      cmds.push({
        texto: "update produtos set custo = $2 where id = $1 and custo is not distinct from $3",
        params: [it.produto_id, it.custo_anterior, it.custo_unitario],
      });
      if (it.atualizou_preco) {
        cmds.push({
          texto: "update produtos set preco_venda = $2 where id = $1 and preco_venda is not distinct from $3",
          params: [it.produto_id, it.preco_anterior, it.preco_venda],
        });
      }
    }
  }
  for (const id of apagar) cmds.push({ texto: "delete from produtos where id = $1", params: [id] });
  cmds.push({ texto: "delete from lancamentos where nota_id = $1 and status = 'aberto'", params: [notaId] });
  cmds.push({ texto: "delete from notas_fiscais where id = $1", params: [notaId] });

  try {
    await b.transacao(cmds);
  } catch (err) {
    const m = msg(err);
    if (m.includes("division by zero")) return { erro: "Uma parcela desta nota acabou de ser paga. Estorne a baixa antes de excluir." };
    if (m.includes("quantidade_check")) return { erro: "O estoque mudou durante a exclusão. Tente de novo." };
    return { erro: `Não foi possível excluir: ${m}` };
  }
  return { ok: true, parcial: faltas };
}

// ---------------------------------------------------------------------
// Parcelas da nota (lançamentos a pagar ligados a ela) — só as em aberto
// ---------------------------------------------------------------------
async function parcelaAberta(b: AcessoBanco, id: string): Promise<{ erro: string } | { notaId: string }> {
  if (!UUID.test(id)) return { erro: "Parcela não encontrada." };
  const [l] = await b.query<{ id: string; status: string; nota_id: string | null }>(
    "select id, status, nota_id from lancamentos where id = $1 and tipo = 'pagar'",
    [id]
  );
  if (!l || !l.nota_id) return { erro: "Parcela não encontrada." };
  if (l.status !== "aberto") return { erro: "Esta parcela já foi paga. Estorne a baixa no contas a pagar para alterá-la." };
  return { notaId: l.nota_id };
}

export async function editarParcela(
  b: AcessoBanco,
  id: string,
  vencimento: string,
  valor: number,
  documento: string | null
): Promise<{ erro: string } | { ok: { notaId: string } }> {
  const p = await parcelaAberta(b, id);
  if ("erro" in p) return { erro: p.erro };
  if (!dataValida(vencimento)) return { erro: "Vencimento inválido." };
  const v = Math.round(Number(valor) * 100) / 100;
  if (!(Number.isFinite(v) && v > 0)) return { erro: "Valor inválido." };
  await b.query("update lancamentos set vencimento = $2, valor = $3, documento = $4 where id = $1 and status = 'aberto'", [
    id, vencimento, v, (documento ?? "").trim().slice(0, 60) || null,
  ]);
  return { ok: { notaId: p.notaId } };
}

export async function excluirParcela(b: AcessoBanco, id: string): Promise<{ erro: string } | { ok: { notaId: string } }> {
  const p = await parcelaAberta(b, id);
  if ("erro" in p) return { erro: p.erro };
  await b.query("delete from lancamentos where id = $1 and status = 'aberto'", [id]);
  return { ok: { notaId: p.notaId } };
}

export async function adicionarParcela(
  b: AcessoBanco,
  notaId: string,
  vencimento: string,
  valor: number,
  documento: string | null
): Promise<{ erro: string } | { ok: true }> {
  if (!UUID.test(notaId)) return { erro: "Nota não encontrada." };
  const [n] = await b.query<{ empresa_id: string | null; fornecedor_id: string | null; numero: string | null; forn: string | null }>(
    `select n.empresa_id, n.fornecedor_id, n.numero, f.nome as forn
       from notas_fiscais n left join fornecedores f on f.id = n.fornecedor_id where n.id = $1`,
    [notaId]
  );
  if (!n) return { erro: "Nota não encontrada." };
  if (!n.empresa_id) return { erro: "A nota não está ligada a uma empresa." };
  if (!dataValida(vencimento)) return { erro: "Vencimento inválido." };
  const v = Math.round(Number(valor) * 100) / 100;
  if (!(Number.isFinite(v) && v > 0)) return { erro: "Valor inválido." };
  await b.query(
    `insert into lancamentos (empresa_id, tipo, descricao, fornecedor_id, vencimento, valor, documento, nota_id)
     values ($1, 'pagar', $2, $3, $4, $5, $6, $7)`,
    [n.empresa_id, `NF ${n.numero ?? ""} - ${n.forn ?? "fornecedor"}`, n.fornecedor_id, vencimento, v, (documento ?? "").trim().slice(0, 60) || null, notaId]
  );
  return { ok: true };
}
