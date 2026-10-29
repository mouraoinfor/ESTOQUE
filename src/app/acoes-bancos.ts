"use server";

import { revalidatePath } from "next/cache";
import { db, query } from "@/lib/db";
import { exigirAcesso, exigirSessao } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { estornarBaixa } from "@/lib/financeiro";
import { hojeISO } from "@/lib/formato";
import { podeAcessar } from "@/lib/modulos";
import { sugestoesDoPeriodo } from "@/app/(app)/financeiro/conciliacao/dados";

type Estado = { erro?: string; ok?: string } | undefined;

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

// "1.234,56" / "1234,56" / "1234.56" / "R$ -10" -> número com 2 casas (null se inválido)
function lerValor(v: unknown): number | null {
  let s = String(v ?? "").trim().replace(/R\$/gi, "").replace(/\s/g, "");
  if (!s) return null;
  let neg = false;
  if (s.startsWith("-")) { neg = true; s = s.slice(1); }
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Math.round(Number(s) * 100) / 100;
  return neg ? -n : n;
}

function lerData(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : null;
}

function txt(fd: FormData, nome: string) {
  return String(fd.get(nome) ?? "").trim();
}

function revalidar() {
  revalidatePath("/financeiro", "layout");
}

async function empresaId() {
  const { atual } = await empresaAtual();
  return atual?.id ?? null;
}

// Telas de bancos e de conciliação usam as mesmas ações de movimento avulso
async function exigirBancosOuConciliacao() {
  const u = await exigirSessao();
  if (!podeAcessar(u, "bancos") && !podeAcessar(u, "conciliacao")) return null;
  return u;
}

async function bancoDaEmpresa(bancoId: string, emp: string) {
  const [b] = await query<{ id: string; nome: string; ativo: boolean }>(
    "select id, nome, ativo from bancos where id = $1 and empresa_id = $2",
    [bancoId, emp]
  );
  return b ?? null;
}

const SEM_EMPRESA = { erro: "Cadastre ou escolha uma empresa primeiro." };

// Data do saldo inicial do banco ("AAAA-MM-DD")
async function saldoInicialEm(bancoId: string) {
  const [b] = await query<{ d: string }>("select saldo_inicial_em::text as d from bancos where id = $1", [bancoId]);
  return b?.d ?? "0000-00-00";
}

// ---------------------------------------------------------------------
// Bancos
// ---------------------------------------------------------------------

export async function salvarBanco(id: string | null, _prev: Estado, fd: FormData): Promise<Estado> {
  await exigirAcesso("bancos");
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  const nome = txt(fd, "nome");
  if (!nome) return { erro: "Informe o nome do banco." };
  const saldoTxt = txt(fd, "saldo_inicial");
  const saldo = saldoTxt ? lerValor(saldoTxt) : 0;
  if (saldo === null) return { erro: "Saldo inicial inválido. Use, por exemplo, 1.234,56." };
  const dataTxt = txt(fd, "saldo_inicial_em");
  const data = dataTxt ? lerData(dataTxt) : hojeISO();
  if (!data) return { erro: "Data do saldo inicial inválida." };
  const limiteTxt = txt(fd, "limite");
  const limite = limiteTxt ? lerValor(limiteTxt) : 0;
  if (limite === null || limite < 0) return { erro: "Limite inválido. Use, por exemplo, 10.000,00." };
  const agencia = txt(fd, "agencia") || null;
  const conta = txt(fd, "conta") || null;

  if (id) {
    if (!(await bancoDaEmpresa(id, emp))) return { erro: "Banco não encontrado nesta empresa." };
    const ativo = fd.get("ativo") === "on";
    await query(
      `update bancos set nome = $3, agencia = $4, conta = $5, saldo_inicial = $6, saldo_inicial_em = $7, ativo = $8, limite = $9
        where id = $1 and empresa_id = $2`,
      [id, emp, nome, agencia, conta, saldo, data, ativo, limite]
    );
    revalidar();
    return { ok: "Banco salvo." };
  }
  await query(
    `insert into bancos (empresa_id, nome, agencia, conta, saldo_inicial, saldo_inicial_em, ativo, limite)
     values ($1, $2, $3, $4, $5, $6, true, $7)`,
    [emp, nome, agencia, conta, saldo, data, limite]
  );
  revalidar();
  return { ok: "Banco cadastrado." };
}

export async function excluirBanco(id: string): Promise<{ erro?: string; ok?: string }> {
  await exigirAcesso("bancos");
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  if (!(await bancoDaEmpresa(id, emp))) return { erro: "Banco não encontrado nesta empresa." };
  const [{ n }] = await query<{ n: number }>("select count(*)::int as n from movimentos_bancarios where banco_id = $1", [id]);
  if (n > 0) {
    return { erro: `Este banco tem ${n} movimento(s) no extrato e não pode ser excluído. Desative-o (editar > desmarcar "Ativo") para escondê-lo.` };
  }
  await query("delete from bancos where id = $1 and empresa_id = $2", [id, emp]);
  revalidar();
  return { ok: "Banco excluído." };
}

// ---------------------------------------------------------------------
// Transferência (TED) — 2 movimentos com o mesmo transferencia_id
// ---------------------------------------------------------------------

export async function transferir(_prev: Estado, fd: FormData): Promise<Estado> {
  const u = await exigirAcesso("bancos");
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  const origemId = txt(fd, "origem");
  const destinoId = txt(fd, "destino");
  const data = lerData(txt(fd, "data"));
  const valor = lerValor(txt(fd, "valor"));
  const obs = txt(fd, "descricao");
  if (!origemId || !destinoId) return { erro: "Escolha a conta de origem e a de destino." };
  if (origemId === destinoId) return { erro: "A conta de destino precisa ser diferente da origem." };
  if (!data) return { erro: "Data inválida." };
  if (valor === null || valor <= 0) return { erro: "Informe um valor maior que zero." };

  const origem = await bancoDaEmpresa(origemId, emp);
  if (!origem) return { erro: "A conta de origem não pertence à empresa atual." };
  // O destino pode ser de outra empresa (TED entre CNPJs)
  const [destino] = await query<{ id: string; nome: string; empresa_id: string; empresa_nome: string }>(
    "select b.id, b.nome, b.empresa_id, e.nome as empresa_nome from bancos b join empresas e on e.id = b.empresa_id where b.id = $1",
    [destinoId]
  );
  if (!destino) return { erro: "Conta de destino não encontrada." };
  const [orgEmp] = await query<{ nome: string }>("select nome from empresas where id = $1", [emp]);

  const outra = destino.empresa_id !== emp;
  const sufixo = obs ? ` — ${obs}` : "";
  const descOrigem = `Transferência para ${destino.nome}${outra ? ` (${destino.empresa_nome})` : ""}${sufixo}`;
  const descDestino = `Transferência de ${origem.nome}${outra ? ` (${orgEmp?.nome ?? ""})` : ""}${sufixo}`;
  const tid = crypto.randomUUID();
  const sql = db();
  const ins = `insert into movimentos_bancarios (empresa_id, banco_id, data, descricao, tipo, valor, transferencia_id, usuario, origem)
               values ($1, $2, $3, $4, $5, $6, $7, $8, 'transferencia')`;
  await sql.transaction([
    sql.query(ins, [emp, origem.id, data, descOrigem, "debito", valor, tid, u.email]),
    sql.query(ins, [destino.empresa_id, destino.id, data, descDestino, "credito", valor, tid, u.email]),
  ]);
  revalidar();
  return { ok: "Transferência registrada." };
}

export async function excluirTransferencia(transferenciaId: string): Promise<{ erro?: string; ok?: string }> {
  await exigirAcesso("bancos");
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  const [lado] = await query<{ id: string }>(
    "select id from movimentos_bancarios where transferencia_id = $1 and empresa_id = $2 and origem = 'transferencia' limit 1",
    [transferenciaId, emp]
  );
  if (!lado) return { erro: "Transferência não encontrada nesta empresa." };
  await query("delete from movimentos_bancarios where transferencia_id = $1 and origem = 'transferencia'", [transferenciaId]);
  revalidar();
  return { ok: "Transferência excluída (os dois lados)." };
}

// ---------------------------------------------------------------------
// Movimento avulso do extrato (tarifa, rendimento, linha digitada)
// ---------------------------------------------------------------------

export async function lancarMovimento(_prev: Estado, fd: FormData): Promise<Estado> {
  const u = await exigirBancosOuConciliacao();
  if (!u) return { erro: "Sem acesso." };
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  const bancoId = txt(fd, "banco_id");
  const tipo = txt(fd, "tipo");
  const data = lerData(txt(fd, "data"));
  const valor = lerValor(txt(fd, "valor"));
  const descricao = txt(fd, "descricao");
  if (!(await bancoDaEmpresa(bancoId, emp))) return { erro: "Escolha uma conta da empresa atual." };
  if (tipo !== "credito" && tipo !== "debito") return { erro: "Escolha crédito ou débito." };
  if (!data) return { erro: "Data inválida." };
  if (valor === null || valor <= 0) return { erro: "Informe um valor maior que zero." };
  if (!descricao) return { erro: "Informe a descrição." };
  await query(
    `insert into movimentos_bancarios (empresa_id, banco_id, data, descricao, tipo, valor, usuario, origem)
     values ($1, $2, $3, $4, $5, $6, $7, 'extrato')`,
    [emp, bancoId, data, descricao, tipo, valor, u.email]
  );
  revalidar();
  return { ok: "Movimento lançado." };
}

// Exclui uma linha do extrato. Se estava conciliada, reabre o lançamento.
// Movimentos de baixa são estornados pela tela de contas; transferências por excluirTransferencia.
export async function excluirMovimento(id: string): Promise<{ erro?: string; ok?: string }> {
  const u = await exigirBancosOuConciliacao();
  if (!u) return { erro: "Sem acesso." };
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  const [m] = await query<{ origem: string; lancamento_id: string | null }>(
    "select origem, lancamento_id from movimentos_bancarios where id = $1 and empresa_id = $2",
    [id, emp]
  );
  if (!m) return { erro: "Movimento não encontrado nesta empresa." };
  if (m.origem === "baixa") return { erro: "Este movimento veio da baixa de um lançamento. Estorne a baixa na tela de contas." };
  if (m.origem === "transferencia") return { erro: "Use \"Excluir transferência\" para apagar os dois lados." };
  const sql = db();
  await sql.transaction([
    sql.query(
      "update lancamentos set status = 'aberto', pago_em = null where id = (select lancamento_id from movimentos_bancarios where id = $1)",
      [id]
    ),
    sql.query("delete from movimentos_bancarios where id = $1 and empresa_id = $2", [id, emp]),
  ]);
  revalidar();
  return { ok: m.lancamento_id ? "Movimento excluído e lançamento reaberto." : "Movimento excluído." };
}

// ---------------------------------------------------------------------
// Importação de extrato (OFX lido no navegador)
// ---------------------------------------------------------------------

export interface LinhaExtrato {
  data: string;
  tipo: "credito" | "debito";
  valor: number;
  descricao: string;
  fitid: string | null;
}

function linhasValidas(linhas: LinhaExtrato[]) {
  if (!Array.isArray(linhas) || linhas.length === 0) return { erro: "Nenhuma linha para importar." };
  if (linhas.length > 3000) return { erro: "Arquivo grande demais (máx. 3000 linhas por vez)." };
  const ok: LinhaExtrato[] = [];
  for (const [i, l] of linhas.entries()) {
    const data = lerData(l?.data);
    const valor = typeof l?.valor === "number" ? Math.round(l.valor * 100) / 100 : NaN;
    const descricao = String(l?.descricao ?? "").trim().slice(0, 500);
    const fitid = l?.fitid ? String(l.fitid).trim().slice(0, 255) || null : null;
    if (!data || (l.tipo !== "credito" && l.tipo !== "debito") || !(valor > 0)) {
      return { erro: `Linha ${i + 1} inválida (data, tipo ou valor).` };
    }
    ok.push({ data, tipo: l.tipo, valor, descricao: descricao || "(sem descrição)", fitid });
  }
  return { ok };
}

// Para a prévia: marca cada linha como "fitid" (já importada), "parecido" (mesma data, tipo e valor
// já lançados no extrato desta conta) ou null (nova)
export async function verificarExtrato(
  bancoId: string,
  linhas: LinhaExtrato[]
): Promise<{ erro?: string; ok?: ("fitid" | "parecido" | "anterior" | null)[] }> {
  await exigirAcesso("conciliacao");
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  if (!(await bancoDaEmpresa(bancoId, emp))) return { erro: "Escolha uma conta da empresa atual." };
  const v = linhasValidas(linhas);
  if (!v.ok) return { erro: v.erro };
  const inicio = await saldoInicialEm(bancoId);
  const fitids = v.ok.map((l) => l.fitid).filter((f): f is string => !!f);
  const existentes = new Set(
    (await query<{ fitid: string }>(
      "select fitid from movimentos_bancarios where banco_id = $1 and fitid = any($2::text[])",
      [bancoId, fitids]
    )).map((r) => r.fitid)
  );
  const datas = v.ok.map((l) => l.data).sort();
  const parecidos = await query<{ data: string; tipo: string; valor: number }>(
    `select data::text as data, tipo, valor from movimentos_bancarios
      where banco_id = $1 and origem = 'extrato' and data between $2 and $3`,
    [bancoId, datas[0], datas[datas.length - 1]]
  );
  // Conta quantas vezes cada (data, tipo, valor) já existe, para não marcar mais linhas do que há no banco
  const chave = (d: string, t: string, val: number) => `${d}|${t}|${val.toFixed(2)}`;
  const contagem = new Map<string, number>();
  for (const p of parecidos) contagem.set(chave(p.data, p.tipo, p.valor), (contagem.get(chave(p.data, p.tipo, p.valor)) ?? 0) + 1);
  const res = v.ok.map((l) => {
    if (l.fitid && existentes.has(l.fitid)) return "fitid" as const;
    if (l.data <= inicio) return "anterior" as const;
    const k = chave(l.data, l.tipo, l.valor);
    const n = contagem.get(k) ?? 0;
    if (!l.fitid && n > 0) { contagem.set(k, n - 1); return "parecido" as const; }
    return null;
  });
  return { ok: res };
}

export async function importarExtrato(
  bancoId: string,
  linhas: LinhaExtrato[]
): Promise<{ erro?: string; ok?: { inseridas: number; ignoradas: number } }> {
  const u = await exigirAcesso("conciliacao");
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  if (!(await bancoDaEmpresa(bancoId, emp))) return { erro: "Escolha uma conta da empresa atual." };
  const v = linhasValidas(linhas);
  if (!v.ok) return { erro: v.erro };
  // Movimentos até a data do saldo inicial já estão dentro dele: gravar somaria duas vezes
  const inicio = await saldoInicialEm(bancoId);
  const L = v.ok.filter((l) => l.data > inicio);
  if (!L.length) return { erro: "Todas as linhas são da data do saldo inicial ou de antes; nada foi gravado." };
  const r = await query<{ id: string }>(
    `insert into movimentos_bancarios (empresa_id, banco_id, data, descricao, tipo, valor, usuario, origem, fitid)
     select $1, $2, x.d, x.ds, x.t, x.v, $3, 'extrato', x.f
       from unnest($4::date[], $5::text[], $6::text[], $7::float8[], $8::text[]) as x(d, ds, t, v, f)
     on conflict (banco_id, fitid) where fitid is not null do nothing
     returning id`,
    [emp, bancoId, u.email, L.map((l) => l.data), L.map((l) => l.descricao), L.map((l) => l.tipo), L.map((l) => l.valor), L.map((l) => l.fitid)]
  );
  revalidar();
  return { ok: { inseridas: r.length, ignoradas: v.ok.length - r.length } };
}

// ---------------------------------------------------------------------
// Conciliação
// ---------------------------------------------------------------------

// Liga um movimento do extrato (sem lançamento) a um lançamento em aberto do mesmo tipo e
// marca o lançamento como pago na data do movimento, no banco do movimento. Um único comando
// (atômico): se qualquer condição falhar, nada muda e não retorna linha.
const SQL_CONCILIAR = `
  with mv as (
    select id, data, banco_id, tipo from movimentos_bancarios
     where id = $1 and empresa_id = $3 and origem = 'extrato' and lancamento_id is null
  ), l as (
    update lancamentos set status = 'pago', pago_em = mv.data, banco_id = mv.banco_id
      from mv
     where lancamentos.id = $2 and lancamentos.empresa_id = $3 and lancamentos.status = 'aberto'
       and lancamentos.tipo = case mv.tipo when 'debito' then 'pagar' else 'receber' end
    returning lancamentos.id
  )
  update movimentos_bancarios set lancamento_id = l.id
    from l
   where movimentos_bancarios.id = $1 and movimentos_bancarios.lancamento_id is null
  returning movimentos_bancarios.id`;

export async function conciliar(movimentoId: string, lancamentoId: string): Promise<{ erro?: string; ok?: string }> {
  await exigirAcesso("conciliacao");
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  const r = await query(SQL_CONCILIAR, [movimentoId, lancamentoId, emp]);
  if (!r.length) {
    return { erro: "Não foi possível conciliar: o movimento já está ligado, o lançamento não está em aberto, é de outro tipo ou de outra empresa." };
  }
  revalidar();
  return { ok: "Conciliado." };
}

// Liga os pendentes que têm exatamente UMA sugestão com o mesmo valor e até 3 dias de diferença.
// Se o mesmo lançamento for a única opção de dois movimentos, nenhum dos dois é ligado.
export async function conciliarAutomatico(bancoId: string, de: string, ate: string): Promise<{ erro?: string; ok?: string }> {
  await exigirAcesso("conciliacao");
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  if (!(await bancoDaEmpresa(bancoId, emp))) return { erro: "Escolha uma conta da empresa atual." };
  const d1 = lerData(de), d2 = lerData(ate);
  if (!d1 || !d2) return { erro: "Período inválido." };
  const sug = await sugestoesDoPeriodo(emp, bancoId, d1, d2);
  const movs = await query<{ id: string; valor: number }>(
    "select id, valor from movimentos_bancarios where id = any($1::uuid[])",
    [[...new Set(sug.map((s) => s.movimento_id))]]
  );
  const valorMov = new Map(movs.map((m) => [m.id, m.valor]));
  const porMov = new Map<string, string[]>();
  for (const s of sug) {
    if (s.dias > 3 || Math.abs(s.valor - (valorMov.get(s.movimento_id) ?? NaN)) >= 0.005) continue;
    porMov.set(s.movimento_id, [...(porMov.get(s.movimento_id) ?? []), s.id]);
  }
  const pares = [...porMov].filter(([, ls]) => ls.length === 1).map(([m, ls]) => [m, ls[0]] as const);
  const usoLanc = new Map<string, number>();
  for (const [, l] of pares) usoLanc.set(l, (usoLanc.get(l) ?? 0) + 1);
  const final = pares.filter(([, l]) => usoLanc.get(l) === 1);
  if (!final.length) return { ok: "Nenhum movimento com correspondência única para conciliar automaticamente." };
  const sql = db();
  const res = await sql.transaction(final.map(([m, l]) => sql.query(SQL_CONCILIAR, [m, l, emp])));
  const n = res.filter((r) => Array.isArray(r) && r.length > 0).length;
  revalidar();
  return { ok: `${n} movimento(s) conciliado(s) automaticamente.` };
}

// Desliga o movimento e reabre o lançamento (estornarBaixa só desliga quando veio do extrato)
export async function desfazerConciliacao(movimentoId: string): Promise<{ erro?: string; ok?: string }> {
  await exigirAcesso("conciliacao");
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  const [m] = await query<{ lancamento_id: string | null }>(
    "select lancamento_id from movimentos_bancarios where id = $1 and empresa_id = $2 and origem = 'extrato'",
    [movimentoId, emp]
  );
  if (!m?.lancamento_id) return { erro: "Movimento não está conciliado." };
  await estornarBaixa(m.lancamento_id);
  revalidar();
  return { ok: "Conciliação desfeita; o lançamento voltou a ficar em aberto." };
}

// Cria um lançamento já pago a partir do movimento e liga os dois
export async function criarLancamentoDoMovimento(movimentoId: string, _prev: Estado, fd: FormData): Promise<Estado> {
  await exigirAcesso("conciliacao");
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  const descricao = txt(fd, "descricao");
  const parteId = txt(fd, "parte_id") || null;
  if (!descricao) return { erro: "Informe a descrição do lançamento." };
  const [m] = await query<{ tipo: string; lancamento_id: string | null; origem: string }>(
    "select tipo, lancamento_id, origem from movimentos_bancarios where id = $1 and empresa_id = $2",
    [movimentoId, emp]
  );
  if (!m || m.origem !== "extrato") return { erro: "Movimento do extrato não encontrado nesta empresa." };
  if (m.lancamento_id) return { erro: "Este movimento já está conciliado." };
  let fornecedor: string | null = null, cliente: string | null = null;
  if (parteId) {
    const tabela = m.tipo === "debito" ? "fornecedores" : "clientes";
    const [p] = await query(`select id from ${tabela} where id = $1`, [parteId]);
    if (!p) return { erro: m.tipo === "debito" ? "Fornecedor não encontrado." : "Cliente não encontrado." };
    if (m.tipo === "debito") fornecedor = parteId; else cliente = parteId;
  }
  const novo = crypto.randomUUID();
  const sql = db();
  const [, lig] = await sql.transaction([
    sql.query(
      `insert into lancamentos (id, empresa_id, tipo, descricao, fornecedor_id, cliente_id, vencimento, valor, banco_id, status, pago_em, observacoes)
       select $2::uuid, m.empresa_id, case m.tipo when 'debito' then 'pagar' else 'receber' end, $3::text, $4::uuid, $5::uuid,
              m.data, m.valor, m.banco_id, 'pago', m.data, 'Criado a partir do extrato (conciliação)'
         from movimentos_bancarios m
        where m.id = $1 and m.empresa_id = $6 and m.origem = 'extrato' and m.lancamento_id is null`,
      [movimentoId, novo, descricao, fornecedor, cliente, emp]
    ),
    sql.query(
      `update movimentos_bancarios set lancamento_id = $2
        where id = $1 and lancamento_id is null and exists (select 1 from lancamentos where id = $2)
       returning id`,
      [movimentoId, novo]
    ),
  ]);
  if (!Array.isArray(lig) || !lig.length) return { erro: "Não foi possível criar o lançamento (o movimento mudou)." };
  revalidar();
  return { ok: "Lançamento criado e conciliado." };
}

export interface LancamentoAberto {
  id: string;
  descricao: string;
  parte_nome: string | null;
  vencimento: string;
  valor: number;
  documento: string | null;
}

// Busca manual de lançamentos em aberto do mesmo tipo do movimento (descrição, parte, documento ou valor)
export async function buscarAbertos(movimentoId: string, texto: string): Promise<{ erro?: string; ok?: LancamentoAberto[] }> {
  await exigirAcesso("conciliacao");
  const emp = await empresaId();
  if (!emp) return SEM_EMPRESA;
  const [m] = await query<{ tipo: string; valor: number; data: string }>(
    "select tipo, valor, data::text as data from movimentos_bancarios where id = $1 and empresa_id = $2",
    [movimentoId, emp]
  );
  if (!m) return { erro: "Movimento não encontrado." };
  const t = String(texto ?? "").trim();
  const valor = lerValor(t);
  const r = await query<LancamentoAberto>(
    `select l.id, l.descricao, coalesce(f.nome, c.nome) as parte_nome, l.vencimento::text as vencimento, l.valor, l.documento
       from lancamentos l
       left join fornecedores f on f.id = l.fornecedor_id
       left join clientes c on c.id = l.cliente_id
      where l.empresa_id = $1 and l.status = 'aberto' and l.tipo = $2
        and ($3 = '' or l.descricao ilike '%' || $3 || '%' or coalesce(f.nome, c.nome, '') ilike '%' || $3 || '%'
             or coalesce(l.documento, '') ilike '%' || $3 || '%'
             or ($4::float8 is not null and abs(l.valor - $4::float8) <= 0.0100001))
      order by abs(l.valor - $5), abs(l.vencimento - $6::date), l.vencimento
      limit 30`,
    [emp, m.tipo === "debito" ? "pagar" : "receber", t, valor !== null && valor > 0 ? valor : null, m.valor, m.data]
  );
  return { ok: r };
}
