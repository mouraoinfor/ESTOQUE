"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, query } from "@/lib/db";
import { exigirAcesso } from "@/lib/auth";
import { hojeISO } from "@/lib/formato";
import { empresaAtual } from "@/lib/empresa";
import { DIAS_PADRAO, arred, competenciaDe, nomeMes, somarMeses, type ItemFolhaEdicao } from "@/components/rh/rh-util";

type Estado = { erro?: string; ok?: string } | undefined;
type Resp<T = true> = { erro: string } | { ok: T };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

function txt(fd: FormData, nome: string) {
  return String(fd.get(nome) ?? "").trim();
}

// Aceita "1588.59", "1.588,59" ou "1588,59"; vazio -> 0
function numero(v: unknown): number {
  let s = String(v ?? "").trim().replace(/\s|R\$/g, "");
  if (!s) return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function mensagem(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

function revalidar() {
  revalidatePath("/rh", "layout");
}

// ---------------------------------------------------------------------
// Contas a pagar da folha do mês M: Salários dia 5 de M+1, VR + VT no último dia útil de M
// (adiantado para o mês seguinte) e VA dia 15 de M+1.
// Criadas ao gerar a folha; depois acompanham cada alteração enquanto estão em aberto.
// ---------------------------------------------------------------------

// Último dia útil (seg a sex) do mês; feriados não entram na conta
function ultimoDiaUtil(comp: string) {
  const [a, m] = comp.split("-").map(Number);
  const d = new Date(Date.UTC(a, m, 0)); // dia 0 do mês seguinte = último dia deste
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const diaDoMes = (comp: string, dia: number) => `${comp.slice(0, 8)}${String(dia).padStart(2, "0")}`;

const CONTAS_FOLHA = [
  { parte: "salario", descricao: "Salários", soma: "sum(salario + comissao - desconto)", vencimento: (c: string) => diaDoMes(somarMeses(c, 1), 5) },
  { parte: "vrvt", descricao: "VR + VT", soma: "sum(vr + vt)", vencimento: (c: string) => ultimoDiaUtil(c) },
  { parte: "va", descricao: "Vale alimentação", soma: "sum(va)", vencimento: (c: string) => diaDoMes(somarMeses(c, 1), 15) },
] as const;

async function sincronizarContasFolha(comp: string, criar: boolean) {
  if (!criar) {
    const [{ n }] = await query<{ n: number }>("select count(*)::int as n from lancamentos where folha_competencia = $1", [comp]);
    if (!n) return; // folha antiga (já paga fora do sistema) ou criada sem gerar: não cria contas
  }
  const { atual } = await empresaAtual();
  if (!atual) return;
  const [t] = await query<Record<string, number>>(
    `select ${CONTAS_FOLHA.map((c) => `coalesce(${c.soma}, 0)::float8 as ${c.parte}`).join(", ")} from folha_itens where competencia = $1`,
    [comp]
  );
  const sql = db();
  await sql.transaction(
    CONTAS_FOLHA.map((c) => {
      const valor = arred(t[c.parte] ?? 0);
      if (valor <= 0) return sql.query("delete from lancamentos where folha_competencia = $1 and folha_parte = $2 and status = 'aberto'", [comp, c.parte]);
      return sql.query(
        `insert into lancamentos (empresa_id, tipo, descricao, vencimento, valor, folha_competencia, folha_parte, observacoes)
         values ($1, 'pagar', $2, $3::date, $4, $5, $6, 'Gerado pela folha de pagamento')
         on conflict (folha_competencia, folha_parte) where folha_competencia is not null
         do update set valor = excluded.valor where lancamentos.status = 'aberto'`,
        [atual.id, `${c.descricao} - folha ${nomeMes(comp)}`, c.vencimento(comp), valor, comp, c.parte]
      );
    })
  );
  revalidatePath("/financeiro", "layout");
}

// ---------------------------------------------------------------------
// Funcionários
// ---------------------------------------------------------------------

export async function salvarFuncionario(id: string | null, _prev: Estado, fd: FormData): Promise<Estado> {
  await exigirAcesso("rh");
  if (id && !UUID.test(id)) return { erro: "Funcionário inválido." };
  const nome = txt(fd, "nome");
  if (!nome) return { erro: "Informe o nome do funcionário." };

  const valores: Record<string, number> = {};
  for (const [campo, rotulo] of [["salario", "Salário"], ["vr_dia", "VR por dia"], ["vt_dia", "VT por dia"], ["va_mensal", "VA mensal"]] as const) {
    const n = numero(fd.get(campo));
    if (Number.isNaN(n) || n < 0) return { erro: `${rotulo}: informe um valor válido (zero ou mais).` };
    valores[campo] = arred(n);
  }
  const admissao = txt(fd, "admissao") || null;
  if (admissao && !DATA.test(admissao)) return { erro: "Data de admissão inválida." };
  const demissao = txt(fd, "demissao") || null;
  if (demissao && !DATA.test(demissao)) return { erro: "Data de desligamento inválida." };
  if (admissao && demissao && demissao < admissao) return { erro: "O desligamento não pode ser antes da admissão." };

  const extras = ["apelido", "funcao", "documento", "telefone", "pix", "observacoes"].map((c) => txt(fd, c) || null);
  const params = [nome, ...extras, valores.salario, valores.vr_dia, valores.vt_dia, valores.va_mensal, admissao];

  let novoId: string | null = null;
  try {
    if (id) {
      // Desligamento só é editado aqui se o funcionário já está desligado
      const r = await query(
        `update funcionarios set nome = $2, apelido = $3, funcao = $4, documento = $5, telefone = $6, pix = $7, observacoes = $8,
                salario = $9, vr_dia = $10, vt_dia = $11, va_mensal = $12, admissao = $13,
                demissao = case when ativo then demissao else coalesce($14::date, demissao) end
          where id = $1 returning id`,
        [id, ...params, demissao]
      );
      if (!r.length) return { erro: "Funcionário não encontrado." };
    } else {
      novoId = crypto.randomUUID();
      await query(
        `insert into funcionarios (id, nome, apelido, funcao, documento, telefone, pix, observacoes, salario, vr_dia, vt_dia, va_mensal, admissao)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [novoId, ...params]
      );
    }
  } catch (e) {
    return { erro: `Não foi possível salvar: ${mensagem(e)}` };
  }
  revalidar();
  if (novoId) redirect(`/rh/${novoId}`);
  return { ok: "Cadastro salvo." };
}

export async function desligarFuncionario(id: string, data: string): Promise<Resp> {
  await exigirAcesso("rh");
  if (!UUID.test(id)) return { erro: "Funcionário inválido." };
  const dia = data || hojeISO();
  if (!DATA.test(dia)) return { erro: "Data de desligamento inválida." };
  try {
    const [f] = await query<{ admissao: string | null }>("select admissao::text as admissao from funcionarios where id = $1", [id]);
    if (!f) return { erro: "Funcionário não encontrado." };
    if (f.admissao && dia < f.admissao) return { erro: "O desligamento não pode ser antes da admissão." };
    await query("update funcionarios set ativo = false, demissao = $2 where id = $1", [id, dia]);
  } catch (e) {
    return { erro: `Não foi possível desligar: ${mensagem(e)}` };
  }
  revalidar();
  return { ok: true };
}

export async function reativarFuncionario(id: string): Promise<Resp> {
  await exigirAcesso("rh");
  if (!UUID.test(id)) return { erro: "Funcionário inválido." };
  try {
    const r = await query("update funcionarios set ativo = true, demissao = null where id = $1 returning id", [id]);
    if (!r.length) return { erro: "Funcionário não encontrado." };
  } catch (e) {
    return { erro: `Não foi possível reativar: ${mensagem(e)}` };
  }
  revalidar();
  return { ok: true };
}

// ---------------------------------------------------------------------
// Folha de pagamento
// ---------------------------------------------------------------------

function lerCompetencia(v: string) {
  const c = competenciaDe(v);
  return c && v.length <= 10 ? c : null;
}

// Cria uma linha por funcionário ativo a partir do cadastro (só se o mês ainda está vazio)
export async function gerarFolha(competencia: string): Promise<Resp<number>> {
  await exigirAcesso("folha");
  const comp = lerCompetencia(competencia);
  if (!comp) return { erro: "Mês inválido." };
  try {
    const [{ n }] = await query<{ n: number }>("select count(*)::int as n from folha_itens where competencia = $1", [comp]);
    if (n > 0) return { erro: "Este mês já tem folha. Adicione as linhas que faltarem uma a uma." };
    const criados = await query(
      `insert into folha_itens (competencia, funcionario_id, nome, funcao, salario, dias, vr, vt, va)
       select $1::date, id, nome, funcao, salario, d.dias, round((vr_dia * d.dias)::numeric, 2)::float8,
              round((vt_dia * d.dias)::numeric, 2)::float8, va_mensal
         from funcionarios
         cross join lateral (select greatest($2::int - (select coalesce(sum(x.dias), 0) from funcionario_faltas x where x.funcionario_id = funcionarios.id and x.data >= $1::date and x.data < ($1::date + interval '1 month')), 0)::int as dias) d
        where ativo and not exists (select 1 from folha_itens where competencia = $1::date)
        order by nome
       returning id`,
      [comp, DIAS_PADRAO]
    );
    if (!criados.length) return { erro: "Nenhum funcionário ativo para gerar a folha." };
    await sincronizarContasFolha(comp, true);
    revalidar();
    return { ok: criados.length };
  } catch (e) {
    return { erro: `Não foi possível gerar a folha: ${mensagem(e)}` };
  }
}

// Adiciona uma linha: de um funcionário (valores do cadastro) ou avulsa (só o nome)
export async function adicionarItemFolha(competencia: string, funcionarioId: string | null, nomeAvulso: string): Promise<Resp<string>> {
  await exigirAcesso("folha");
  const comp = lerCompetencia(competencia);
  if (!comp) return { erro: "Mês inválido." };
  const id = crypto.randomUUID();
  try {
    if (funcionarioId) {
      if (!UUID.test(funcionarioId)) return { erro: "Funcionário inválido." };
      const r = await query(
        `insert into folha_itens (id, competencia, funcionario_id, nome, funcao, salario, dias, vr, vt, va)
         select $1, $2::date, id, nome, funcao, salario, d.dias, round((vr_dia * d.dias)::numeric, 2)::float8,
                round((vt_dia * d.dias)::numeric, 2)::float8, va_mensal
           from funcionarios
           cross join lateral (select greatest($4::int - (select coalesce(sum(x.dias), 0) from funcionario_faltas x where x.funcionario_id = funcionarios.id and x.data >= $2::date and x.data < ($2::date + interval '1 month')), 0)::int as dias) d
          where id = $3
         returning id`,
        [id, comp, funcionarioId, DIAS_PADRAO]
      );
      if (!r.length) return { erro: "Funcionário não encontrado." };
    } else {
      const nome = nomeAvulso.trim();
      if (!nome) return { erro: "Escolha um funcionário ou informe o nome." };
      await query("insert into folha_itens (id, competencia, nome) values ($1, $2, $3)", [id, comp, nome.slice(0, 200)]);
    }
    await sincronizarContasFolha(comp, false);
  } catch (e) {
    return { erro: `Não foi possível adicionar: ${mensagem(e)}` };
  }
  revalidar();
  return { ok: id };
}

export async function removerItemFolha(id: string): Promise<Resp> {
  await exigirAcesso("folha");
  if (!UUID.test(id)) return { erro: "Linha inválida." };
  try {
    const r = await query<{ competencia: string }>("delete from folha_itens where id = $1 returning competencia::text as competencia", [id]);
    if (!r.length) return { erro: "Linha não encontrada." };
    await sincronizarContasFolha(r[0].competencia, false);
  } catch (e) {
    return { erro: `Não foi possível remover: ${mensagem(e)}` };
  }
  revalidar();
  return { ok: true };
}

// Grava as linhas alteradas do mês de uma vez
export async function salvarFolha(competencia: string, itens: ItemFolhaEdicao[]): Promise<Resp<number>> {
  await exigirAcesso("folha");
  const comp = lerCompetencia(competencia);
  if (!comp) return { erro: "Mês inválido." };
  if (!Array.isArray(itens) || !itens.length) return { ok: 0 };
  if (itens.length > 500) return { erro: "Linhas demais." };

  const sql = db();
  const comandos = [];
  for (const i of itens) {
    if (!UUID.test(i.id)) return { erro: "Linha inválida." };
    const v: Record<string, number> = {};
    for (const [campo, rotulo] of [["salario", "Salário"], ["comissao", "Comissão"], ["desconto", "Desconto"], ["vr", "VR"], ["vt", "VT"], ["va", "VA"]] as const) {
      const n = numero(i[campo]);
      if (Number.isNaN(n) || n < 0) return { erro: `${rotulo}: valor inválido (use zero ou mais).` };
      v[campo] = arred(n);
    }
    let dias: number | null = null;
    if (i.dias !== null && String(i.dias).trim() !== "") {
      dias = Number(i.dias);
      if (!Number.isInteger(dias) || dias < 0 || dias > 31) return { erro: "Dias: use um número inteiro de 0 a 31." };
    }
    const descricao = String(i.desconto_descricao ?? "").trim() || null;
    const obs = String(i.observacoes ?? "").trim() || null;
    comandos.push(
      sql.query(
        `update folha_itens set salario = $3, comissao = $4, desconto = $5, desconto_descricao = $6, dias = $7,
                vr = $8, vt = $9, va = $10, observacoes = $11, pago = $12
          where id = $1 and competencia = $2`,
        [i.id, comp, v.salario, v.comissao, v.desconto, descricao, dias, v.vr, v.vt, v.va, obs, Boolean(i.pago)]
      )
    );
  }
  try {
    await sql.transaction(comandos);
    await sincronizarContasFolha(comp, false);
  } catch (e) {
    return { erro: `Não foi possível salvar a folha: ${mensagem(e)}` };
  }
  revalidar();
  return { ok: comandos.length };
}

export async function salvarObservacoesMes(competencia: string, texto: string): Promise<Resp> {
  await exigirAcesso("folha");
  const comp = lerCompetencia(competencia);
  if (!comp) return { erro: "Mês inválido." };
  const obs = String(texto ?? "").trim() || null;
  try {
    await query(
      `insert into folha_meses (competencia, observacoes) values ($1, $2)
       on conflict (competencia) do update set observacoes = excluded.observacoes`,
      [comp, obs]
    );
  } catch (e) {
    return { erro: `Não foi possível salvar as anotações: ${mensagem(e)}` };
  }
  revalidar();
  return { ok: true };
}

// ---------------------------------------------------------------------
// Faltas: abatem dias de VR/VT na folha do mesmo mês (paga no mês seguinte); salário e VA não mudam
// ---------------------------------------------------------------------

export async function registrarFalta(funcionarioId: string, data: string, dias: number, motivo: string): Promise<Resp> {
  const s = await exigirAcesso("rh");
  if (!UUID.test(funcionarioId)) return { erro: "Funcionário inválido." };
  if (!DATA.test(data)) return { erro: "Data inválida." };
  if (!Number.isInteger(dias) || dias < 1 || dias > 31) return { erro: "Quantidade de dias inválida (1 a 31)." };
  try {
    const r = await query(
      `insert into funcionario_faltas (funcionario_id, data, dias, motivo, usuario)
       select id, $2, $3, $4, $5 from funcionarios where id = $1 returning id`,
      [funcionarioId, data, dias, motivo.trim().slice(0, 300) || null, s.nome ?? s.email]
    );
    if (!r.length) return { erro: "Funcionário não encontrado." };
  } catch (e) {
    return { erro: `Não foi possível registrar a falta: ${mensagem(e)}` };
  }
  revalidar();
  return { ok: true };
}

export async function excluirFalta(id: string): Promise<Resp> {
  await exigirAcesso("rh");
  if (!UUID.test(id)) return { erro: "Falta inválida." };
  await query("delete from funcionario_faltas where id = $1", [id]);
  revalidar();
  return { ok: true };
}
