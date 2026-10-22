"use server";

import { revalidatePath } from "next/cache";
import { db, query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { empresaAtual } from "@/lib/empresa";
import { darBaixa, estornarBaixa, type TipoLancamento } from "@/lib/financeiro";
import { hojeISO } from "@/lib/formato";
import { prepararRecorrencias, tabelaParte } from "@/components/financeiro/LancamentosDados";
import { dataValida, lerValor, parcelar } from "@/components/financeiro/LancamentosUtil";

type Estado = { erro?: string; ok?: string } | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ehId = (s: unknown): s is string => typeof s === "string" && UUID.test(s);
const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();
const textoOuNulo = (fd: FormData, campo: string) => texto(fd, campo) || null;

function mensagem(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

// Confere o módulo (pagar/receber) e devolve usuário e empresa atual
async function contexto(tipo: TipoLancamento) {
  if (tipo !== "pagar" && tipo !== "receber") throw new Error("Tipo inválido");
  const usuario = await exigirAcesso(tipo);
  const { atual } = await empresaAtual();
  return { usuario, empresaId: atual?.id ?? null };
}

function revalidar() {
  for (const p of ["/financeiro", "/financeiro/pagar", "/financeiro/receber", "/financeiro/bancos", "/financeiro/conciliacao"]) {
    revalidatePath(p);
  }
}

async function bancoDaEmpresa(bancoId: string, empresaId: string, soAtivo: boolean) {
  if (!ehId(bancoId)) return null;
  const [b] = await query<{ id: string; ativo: boolean }>("select id, ativo from bancos where id = $1 and empresa_id = $2", [bancoId, empresaId]);
  if (!b || (soAtivo && !b.ativo)) return null;
  return b.id;
}

// Fornecedor (pagar) ou cliente (receber): usa o escolhido na lista ou cria pelo nome digitado
async function resolverParte(tipo: TipoLancamento, fd: FormData): Promise<{ id: string | null } | { erro: string }> {
  const tabela = tabelaParte(tipo);
  const id = texto(fd, "parte_id");
  const nome = texto(fd, "parte_nome");
  if (id) {
    if (!ehId(id)) return { erro: "Cadastro inválido." };
    const [p] = await query<{ id: string }>(`select id from ${tabela} where id = $1`, [id]);
    if (!p) return { erro: tipo === "pagar" ? "Fornecedor não encontrado." : "Cliente não encontrado." };
    return { id: p.id };
  }
  if (!nome) return { id: null };
  const [existente] = await query<{ id: string }>(`select id from ${tabela} where lower(nome) = lower($1) order by created_at limit 1`, [nome]);
  if (existente) return { id: existente.id };
  const [novo] = await query<{ id: string }>(`insert into ${tabela} (nome) values ($1) returning id`, [nome]);
  return { id: novo.id };
}

async function lancamentoDaEmpresa(id: string, tipo: TipoLancamento, empresaId: string) {
  if (!ehId(id)) return null;
  const [l] = await query<{ id: string; status: string; valor: number; banco_id: string | null; recorrencia_id: string | null; competencia: string | null }>(
    `select id, status, valor, banco_id, recorrencia_id, competencia::text as competencia
       from lancamentos where id = $1 and empresa_id = $2 and tipo = $3`,
    [id, empresaId, tipo]
  );
  return l ?? null;
}

// ---------------------------------------------------------------------
// Lançamentos
// ---------------------------------------------------------------------

export async function criarLancamento(tipo: TipoLancamento, _prev: Estado, fd: FormData): Promise<Estado> {
  const { empresaId } = await contexto(tipo);
  if (!empresaId) return { erro: "Cadastre uma empresa antes." };
  const descricao = texto(fd, "descricao");
  const valor = lerValor(fd.get("valor"));
  const vencimento = texto(fd, "vencimento");
  const parcelas = Number(texto(fd, "parcelas") || "1");
  const bancoTxt = texto(fd, "banco_id");
  if (!descricao) return { erro: "Informe a descrição." };
  if (valor == null || valor <= 0) return { erro: "Valor inválido." };
  if (!dataValida(vencimento)) return { erro: "Informe o vencimento." };
  if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 120) return { erro: "Número de parcelas inválido (1 a 120)." };
  if (valor / parcelas < 0.01) return { erro: "Valor pequeno demais para tantas parcelas." };
  const bancoId = bancoTxt ? await bancoDaEmpresa(bancoTxt, empresaId, false) : null;
  if (bancoTxt && !bancoId) return { erro: "Banco inválido." };
  try {
    const parte = await resolverParte(tipo, fd);
    if ("erro" in parte) return parte;
    const sql = db();
    await sql.transaction(
      parcelar(descricao, valor, parcelas, vencimento).map((p) =>
        sql.query(
          `insert into lancamentos (empresa_id, tipo, descricao, fornecedor_id, cliente_id, vencimento, valor, banco_id, documento, observacoes)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            empresaId, tipo, p.descricao,
            tipo === "pagar" ? parte.id : null, tipo === "receber" ? parte.id : null,
            p.vencimento, p.valor, bancoId, textoOuNulo(fd, "documento"), textoOuNulo(fd, "observacoes"),
          ]
        )
      )
    );
  } catch (e) {
    return { erro: mensagem(e) };
  }
  revalidar();
  return { ok: parcelas > 1 ? `${parcelas} parcelas criadas.` : "Lançamento criado." };
}

export async function editarLancamento(tipo: TipoLancamento, id: string, _prev: Estado, fd: FormData): Promise<Estado> {
  const { empresaId } = await contexto(tipo);
  if (!empresaId) return { erro: "Cadastre uma empresa antes." };
  const l = await lancamentoDaEmpresa(id, tipo, empresaId);
  if (!l) return { erro: "Lançamento não encontrado nesta empresa." };
  const descricao = texto(fd, "descricao");
  const vencimento = texto(fd, "vencimento");
  if (!descricao) return { erro: "Informe a descrição." };
  if (!dataValida(vencimento)) return { erro: "Informe o vencimento." };
  // Já pago: valor e banco ficam como na baixa (o movimento bancário foi lançado com eles)
  let valor = l.valor;
  let bancoId = l.banco_id;
  if (l.status !== "pago") {
    const v = lerValor(fd.get("valor"));
    if (v == null || v <= 0) return { erro: "Valor inválido." };
    valor = v;
    const bancoTxt = texto(fd, "banco_id");
    bancoId = bancoTxt ? await bancoDaEmpresa(bancoTxt, empresaId, false) : null;
    if (bancoTxt && !bancoId) return { erro: "Banco inválido." };
  }
  try {
    const parte = await resolverParte(tipo, fd);
    if ("erro" in parte) return parte;
    await query(
      `update lancamentos set descricao = $3, fornecedor_id = $4, cliente_id = $5, vencimento = $6, valor = $7,
              banco_id = $8, documento = $9, observacoes = $10
        where id = $1 and empresa_id = $2`,
      [
        id, empresaId, descricao,
        tipo === "pagar" ? parte.id : null, tipo === "receber" ? parte.id : null,
        vencimento, valor, bancoId, textoOuNulo(fd, "documento"), textoOuNulo(fd, "observacoes"),
      ]
    );
  } catch (e) {
    return { erro: mensagem(e) };
  }
  revalidar();
  return { ok: "Lançamento salvo." };
}

export async function excluirLancamento(tipo: TipoLancamento, id: string) {
  const { empresaId } = await contexto(tipo);
  if (!empresaId) return { erro: "Cadastre uma empresa antes." };
  const l = await lancamentoDaEmpresa(id, tipo, empresaId);
  if (!l) return { erro: "Lançamento não encontrado nesta empresa." };
  try {
    if (l.status === "pago") await estornarBaixa(id);
    const sql = db();
    await sql.transaction([
      // Mês gerado por conta fixa: guarda para não ser gerado de novo
      ...(l.recorrencia_id && l.competencia
        ? [sql.query(
            "update recorrencias set pular = array_append(pular, $2::date) where id = $1 and not ($2::date = any(pular))",
            [l.recorrencia_id, l.competencia]
          )]
        : []),
      sql.query("delete from lancamentos where id = $1 and empresa_id = $2", [id, empresaId]),
    ]);
  } catch (e) {
    return { erro: mensagem(e) };
  }
  revalidar();
  return { ok: "Lançamento excluído." };
}

// Baixa de um ou vários lançamentos (mesma data e banco para todos)
export async function darBaixaLancamentos(tipo: TipoLancamento, _prev: Estado, fd: FormData): Promise<Estado> {
  const { usuario, empresaId } = await contexto(tipo);
  if (!empresaId) return { erro: "Cadastre uma empresa antes." };
  const ids = [...new Set(fd.getAll("ids").map(String))].filter(ehId);
  const data = texto(fd, "data");
  if (!ids.length) return { erro: "Nenhum lançamento selecionado." };
  if (!dataValida(data)) return { erro: "Informe a data do pagamento." };
  const bancoId = await bancoDaEmpresa(texto(fd, "banco_id"), empresaId, true);
  if (!bancoId) return { erro: "Escolha o banco (ativo) em que o valor saiu/entrou." };
  const abertos = await query<{ id: string }>(
    "select id from lancamentos where id = any($1::uuid[]) and empresa_id = $2 and tipo = $3 and status = 'aberto'",
    [ids, empresaId, tipo]
  );
  if (!abertos.length) return { erro: "Nenhum dos lançamentos está em aberto nesta empresa." };
  const erros: string[] = [];
  for (const a of abertos) {
    try {
      await darBaixa(a.id, data, bancoId, usuario.nome || usuario.email);
    } catch (e) {
      erros.push(mensagem(e));
    }
  }
  revalidar();
  const feitas = abertos.length - erros.length;
  if (erros.length) return { erro: `${feitas} baixa(s) feita(s); ${erros.length} com erro: ${erros[0]}` };
  const ignorados = ids.length - abertos.length;
  return { ok: `${feitas} baixa(s) registrada(s).${ignorados ? ` ${ignorados} ignorado(s) (já pagos ou de outra empresa).` : ""}` };
}

export async function estornarLancamento(tipo: TipoLancamento, id: string) {
  const { empresaId } = await contexto(tipo);
  if (!empresaId) return { erro: "Cadastre uma empresa antes." };
  const l = await lancamentoDaEmpresa(id, tipo, empresaId);
  if (!l) return { erro: "Lançamento não encontrado nesta empresa." };
  if (l.status !== "pago") return { erro: "Este lançamento não está pago." };
  try {
    await estornarBaixa(id);
  } catch (e) {
    return { erro: mensagem(e) };
  }
  revalidar();
  return { ok: "Baixa estornada." };
}

// ---------------------------------------------------------------------
// Contas fixas (recorrências)
// ---------------------------------------------------------------------

// Vencimento de uma competência (1º dia do mês) para um dia; dia 31 em mês curto cai no último dia
const VENC_DA_COMPETENCIA = (comp: string, dia: string) =>
  `least(${comp} + (${dia} - 1) * interval '1 day', ${comp} + interval '1 month' - interval '1 day')::date`;

export async function salvarRecorrencia(tipo: TipoLancamento, id: string | null, _prev: Estado, fd: FormData): Promise<Estado> {
  const { empresaId } = await contexto(tipo);
  if (!empresaId) return { erro: "Cadastre uma empresa antes." };
  const descricao = texto(fd, "descricao");
  const dia = Number(texto(fd, "dia_vencimento"));
  const valor = lerValor(fd.get("valor"));
  const inicio = texto(fd, "inicio");
  const fim = texto(fd, "fim") || null;
  const ativo = fd.get("ativo") === "on";
  const bancoTxt = texto(fd, "banco_id");
  if (!descricao) return { erro: "Informe a descrição." };
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) return { erro: "Dia do vencimento deve ser de 1 a 31." };
  if (valor == null || valor <= 0) return { erro: "Valor inválido." };
  if (!dataValida(inicio)) return { erro: "Informe o início." };
  if (fim && !dataValida(fim)) return { erro: "Data de fim inválida." };
  if (fim && fim < inicio) return { erro: "O fim não pode ser antes do início." };
  const bancoId = bancoTxt ? await bancoDaEmpresa(bancoTxt, empresaId, false) : null;
  if (bancoTxt && !bancoId) return { erro: "Banco inválido." };
  if (id) {
    if (!ehId(id)) return { erro: "Conta fixa não encontrada." };
    const [r] = await query("select id from recorrencias where id = $1 and empresa_id = $2 and tipo = $3", [id, empresaId, tipo]);
    if (!r) return { erro: "Conta fixa não encontrada nesta empresa." };
  }
  try {
    const parte = await resolverParte(tipo, fd);
    if ("erro" in parte) return parte;
    const fornecedor = tipo === "pagar" ? parte.id : null;
    const cliente = tipo === "receber" ? parte.id : null;
    const sql = db();
    if (!id) {
      await query(
        `insert into recorrencias (empresa_id, tipo, descricao, fornecedor_id, cliente_id, dia_vencimento, valor, banco_id, inicio, fim, ativo)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [empresaId, tipo, descricao, fornecedor, cliente, dia, valor, bancoId, inicio, fim, ativo]
      );
    } else {
      await sql.transaction([
        sql.query(
          `update recorrencias set descricao = $3, fornecedor_id = $4, cliente_id = $5, dia_vencimento = $6, valor = $7,
                  banco_id = $8, inicio = $9, fim = $10, ativo = $11
            where id = $1 and empresa_id = $2`,
          [id, empresaId, descricao, fornecedor, cliente, dia, valor, bancoId, inicio, fim, ativo]
        ),
        // Lançamentos em aberto que ficaram fora do novo período (início/fim) saem
        sql.query(
          `delete from lancamentos l
            where l.recorrencia_id = $1 and l.empresa_id = $2 and l.status = 'aberto'
              and (l.competencia < date_trunc('month', $3::date) or ($4::date is not null and l.competencia > date_trunc('month', $4::date)))
              and not exists (select 1 from movimentos_bancarios m where m.lancamento_id = l.id)`,
          [id, empresaId, inicio, fim]
        ),
        // Futuros em aberto acompanham a conta fixa (valor, dia, descrição, parte, banco)
        sql.query(
          `update lancamentos set descricao = $3, fornecedor_id = $4, cliente_id = $5, valor = $6, banco_id = $7,
                  vencimento = ${VENC_DA_COMPETENCIA("competencia", "$8::int")}
            where recorrencia_id = $1 and empresa_id = $2 and status = 'aberto' and competencia is not null
              and (vencimento >= $9::date or ${VENC_DA_COMPETENCIA("competencia", "$8::int")} >= $9::date)`,
          [id, empresaId, descricao, fornecedor, cliente, valor, bancoId, dia, hojeISO()]
        ),
      ]);
    }
    await prepararRecorrencias(empresaId);
  } catch (e) {
    return { erro: mensagem(e) };
  }
  revalidar();
  return { ok: id ? "Conta fixa salva." : "Conta fixa criada." };
}

export async function excluirRecorrencia(tipo: TipoLancamento, id: string, apagarFuturos: boolean) {
  const { empresaId } = await contexto(tipo);
  if (!empresaId) return { erro: "Cadastre uma empresa antes." };
  if (!ehId(id)) return { erro: "Conta fixa não encontrada." };
  const [r] = await query("select id from recorrencias where id = $1 and empresa_id = $2 and tipo = $3", [id, empresaId, tipo]);
  if (!r) return { erro: "Conta fixa não encontrada nesta empresa." };
  try {
    const sql = db();
    await sql.transaction([
      ...(apagarFuturos
        ? [sql.query(
            `delete from lancamentos l
              where l.recorrencia_id = $1 and l.empresa_id = $2 and l.status = 'aberto' and l.vencimento >= $3::date
                and not exists (select 1 from movimentos_bancarios m where m.lancamento_id = l.id)`,
            [id, empresaId, hojeISO()]
          )]
        : []),
      sql.query("delete from recorrencias where id = $1 and empresa_id = $2", [id, empresaId]),
    ]);
  } catch (e) {
    return { erro: mensagem(e) };
  }
  revalidar();
  return { ok: "Conta fixa excluída." };
}
