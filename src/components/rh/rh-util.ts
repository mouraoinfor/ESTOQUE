// Tipos e helpers do RH (usados no servidor e no cliente)

export interface Funcionario {
  id: string;
  nome: string;
  apelido: string | null;
  funcao: string | null;
  salario: number;
  admissao: string | null;
  demissao: string | null;
  ativo: boolean;
  vr_dia: number;
  vt_dia: number;
  va_mensal: number;
  documento: string | null;
  telefone: string | null;
  pix: string | null;
  observacoes: string | null;
}

export interface ItemFolha {
  id: string;
  competencia: string;
  funcionario_id: string | null;
  nome: string;
  funcao: string | null;
  salario: number;
  comissao: number;
  desconto: number;
  desconto_descricao: string | null;
  dias: number | null;
  vr: number;
  vt: number;
  va: number;
  observacoes: string | null;
  pago: boolean;
}

// Campos da folha que a tela edita
export type ItemFolhaEdicao = Pick<
  ItemFolha,
  "id" | "salario" | "comissao" | "desconto" | "desconto_descricao" | "dias" | "vr" | "vt" | "va" | "observacoes" | "pago"
>;

// Dias trabalhados padrão para VR/VT
export const DIAS_PADRAO = 22;

// Falta registrada: abate dias de VR/VT na folha do mês seguinte (não mexe em salário nem VA)
export interface Falta {
  id: string;
  data: string;
  dias: number;
  motivo: string | null;
  usuario: string | null;
}

// Benefícios mensais estimados de um funcionário (VR e VT por dia + VA)
export function beneficiosMensais(f: Pick<Funcionario, "vr_dia" | "vt_dia" | "va_mensal">, dias = DIAS_PADRAO) {
  return (f.vr_dia + f.vt_dia) * dias + f.va_mensal;
}

export function liquido(i: Pick<ItemFolha, "salario" | "comissao" | "desconto">) {
  return i.salario + i.comissao - i.desconto;
}

export function totaisFolha(itens: Pick<ItemFolha, "salario" | "comissao" | "desconto" | "vr" | "vt" | "va">[]) {
  const t = { bruto: 0, descontos: 0, liquido: 0, vr: 0, vt: 0, va: 0, geral: 0 };
  for (const i of itens) {
    t.bruto += i.salario + i.comissao;
    t.descontos += i.desconto;
    t.vr += i.vr;
    t.vt += i.vt;
    t.va += i.va;
  }
  t.liquido = t.bruto - t.descontos;
  t.geral = t.liquido + t.vr + t.vt + t.va;
  return t;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// "2026-09-01" -> "setembro/2026"
export function nomeMes(competencia: string) {
  const [a, m] = competencia.split("-");
  return `${MESES[Number(m) - 1] ?? m}/${a}`;
}

// "2026-09-01" -> "09/26"
export function mesCurto(competencia: string) {
  const [a, m] = competencia.split("-");
  return `${m}/${a.slice(2)}`;
}

// "2026-09-01" -> "2026-09" (usado na URL)
export function mesParam(competencia: string) {
  return competencia.slice(0, 7);
}

// "2026-09" ou "2026-09-15" -> "2026-09-01"; inválido -> null
export function competenciaDe(v: string | null | undefined) {
  const m = /^(\d{4})-(\d{2})/.exec(v ?? "");
  if (!m) return null;
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return `${m[1]}-${m[2]}-01`;
}

export function somarMeses(competencia: string, n: number) {
  const [a, m] = competencia.split("-").map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

export function arred(v: number) {
  return Math.round(v * 100) / 100;
}
