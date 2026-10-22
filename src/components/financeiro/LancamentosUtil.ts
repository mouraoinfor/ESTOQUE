// Funções puras do módulo de contas a pagar/receber (usadas no servidor e no navegador)

// "1.234,56" -> 1234.56 ; "1234,5" -> 1234.5 ; "1234.56" -> 1234.56 ; "1.234" -> 1234
export function lerValor(entrada: unknown): number | null {
  let s = String(entrada ?? "").trim().replace(/\s|R\$/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

// 1234.5 -> "1234,50" (para preencher campos de valor)
export function valorCampo(v: number | null | undefined) {
  if (v == null) return "";
  return v.toFixed(2).replace(".", ",");
}

export function dataValida(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [a, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function ultimoDia(ano: number, mes0: number) {
  return new Date(Date.UTC(ano, mes0 + 1, 0)).getUTCDate();
}

// Soma meses mantendo o dia (31/01 + 1 mês = 28/02 ou 29/02; + 2 meses = 31/03)
export function somarMeses(iso: string, meses: number) {
  const [a, m, d] = iso.split("-").map(Number);
  const total = a * 12 + (m - 1) + meses;
  const ano = Math.floor(total / 12);
  const mes0 = total % 12;
  const dia = Math.min(d, ultimoDia(ano, mes0));
  return `${ano}-${String(mes0 + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function somarDias(iso: string, dias: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

// Primeiro e último dia do mês de uma data (deslocado em "meses")
export function mesDe(iso: string, meses = 0) {
  const ini = somarMeses(iso.slice(0, 8) + "01", meses);
  const [a, m] = ini.split("-").map(Number);
  return { de: ini, ate: `${ini.slice(0, 8)}${String(ultimoDia(a, m - 1)).padStart(2, "0")}` };
}

export interface Parcela {
  numero: number;
  descricao: string;
  valor: number;
  vencimento: string;
}

// Divide o total em N parcelas mensais; a diferença de centavos fica na última
export function parcelar(descricao: string, total: number, n: number, primeiroVencimento: string): Parcela[] {
  const centavos = Math.round(total * 100);
  const base = Math.floor(centavos / n);
  return Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    descricao: n > 1 ? `${descricao} (${i + 1}/${n})` : descricao,
    valor: (i === n - 1 ? centavos - base * (n - 1) : base) / 100,
    vencimento: somarMeses(primeiroVencimento, i),
  }));
}
