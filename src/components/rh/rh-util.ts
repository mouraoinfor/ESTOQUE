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

// Valores da folha que vão, cada um por si, para o Contas a pagar
export type ParteFolha = "salario" | "vr" | "vt" | "va";

export const PARTES_FOLHA: { parte: ParteFolha; rotulo: string }[] = [
  { parte: "salario", rotulo: "Salário" },
  { parte: "vr", rotulo: "VR" },
  { parte: "vt", rotulo: "VT" },
  { parte: "va", rotulo: "VA" },
];

// Valor de uma parte: "salario" é o líquido (salário + comissão - desconto)
export function valorParte(i: Pick<ItemFolha, "salario" | "comissao" | "desconto" | "vr" | "vt" | "va">, parte: ParteFolha) {
  return arred(parte === "salario" ? liquido(i) : i[parte]);
}

// Parte já enviada ao Contas a pagar
export interface LancadoFolha {
  item: string;
  parte: ParteFolha;
  lancamento_id: string;
  status: "aberto" | "pago";
}

// Dias trabalhados padrão para VR/VT (só para estimativas; a folha usa diasUteisMes)
export const DIAS_PADRAO = 22;

export interface Feriado {
  data: string; // AAAA-MM-DD
  descricao: string;
}

// Dias de VR/VT do mês: segunda a sexta, menos os feriados que caem nesses dias
export function diasUteisMes(competencia: string, feriados: string[]) {
  const [a, m] = competencia.split("-").map(Number);
  const fim = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const folga = new Set(feriados);
  let n = 0;
  for (let d = 1; d <= fim; d++) {
    const dt = new Date(Date.UTC(a, m - 1, d));
    const sem = dt.getUTCDay();
    if (sem === 0 || sem === 6) continue;
    if (folga.has(dt.toISOString().slice(0, 10))) continue;
    n++;
  }
  return n;
}

// Feriado em dia útil (segunda a sexta)?
export function emDiaUtil(data: string) {
  const sem = new Date(data + "T12:00:00Z").getUTCDay();
  return sem !== 0 && sem !== 6;
}

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher)
function pascoa(ano: number) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(ano, mes - 1, dia);
}

// Feriados nacionais do ano; facultativo = ponto facultativo (Carnaval, Corpus Christi)
export function feriadosNacionais(ano: number): (Feriado & { facultativo: boolean })[] {
  const p = pascoa(ano);
  const movel = (dias: number) => new Date(p + dias * 86_400_000).toISOString().slice(0, 10);
  const fixo = (md: string) => `${ano}-${md}`;
  return [
    { data: fixo("01-01"), descricao: "Confraternização Universal", facultativo: false },
    { data: movel(-48), descricao: "Carnaval (segunda)", facultativo: true },
    { data: movel(-47), descricao: "Carnaval (terça)", facultativo: true },
    { data: movel(-2), descricao: "Sexta-feira Santa", facultativo: false },
    { data: fixo("04-21"), descricao: "Tiradentes", facultativo: false },
    { data: fixo("05-01"), descricao: "Dia do Trabalho", facultativo: false },
    { data: movel(60), descricao: "Corpus Christi", facultativo: true },
    { data: fixo("09-07"), descricao: "Independência do Brasil", facultativo: false },
    { data: fixo("10-12"), descricao: "Nossa Senhora Aparecida", facultativo: false },
    { data: fixo("11-02"), descricao: "Finados", facultativo: false },
    { data: fixo("11-15"), descricao: "Proclamação da República", facultativo: false },
    { data: fixo("11-20"), descricao: "Dia da Consciência Negra", facultativo: false },
    { data: fixo("12-25"), descricao: "Natal", facultativo: false },
  ].sort((x, y) => x.data.localeCompare(y.data));
}

// Falta registrada: abate dias de VR/VT na folha do mesmo mês, que é paga no mês seguinte (não mexe em salário nem VA)
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
