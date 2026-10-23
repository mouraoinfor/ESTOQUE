// Formatação compartilhada (valores, datas, documentos)
export { brl } from "./types";

export function soDigitos(s: string | null | undefined) {
  return (s ?? "").replace(/\D/g, "");
}

// 12345678000190 -> 12.345.678/0001-90 ; 12345678901 -> 123.456.789-01
export function formatarDocumento(s: string | null | undefined) {
  const d = soDigitos(s);
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return s ?? "";
}

// Datas "AAAA-MM-DD" (coluna date do Postgres vem como Date do driver ou string)
export function isoData(v: string | Date | null | undefined) {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v.slice(0, 10);
}

export function dataBR(v: string | Date | null | undefined) {
  const iso = isoData(v);
  if (!iso) return "—";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

// Hoje no fuso de Brasília, em "AAAA-MM-DD"
export function hojeISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

// ---------------------------------------------------------------------
// Valor por extenso: 1428.8 -> "mil quatrocentos e vinte e oito reais e oitenta centavos"
// ---------------------------------------------------------------------
const UNIDADES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze",
  "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
const ESCALAS: [string, string][] = [["", ""], ["mil", "mil"], ["milhão", "milhões"], ["bilhão", "bilhões"]];

function ate999(n: number): string {
  if (n === 100) return "cem";
  if (n < 20) return UNIDADES[n];
  if (n < 100) return DEZENAS[Math.floor(n / 10)] + (n % 10 ? ` e ${UNIDADES[n % 10]}` : "");
  return CENTENAS[Math.floor(n / 100)] + (n % 100 ? ` e ${ate999(n % 100)}` : "");
}

export function numeroPorExtenso(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "zero";
  const grupos: number[] = [];
  for (let r = n; r > 0; r = Math.floor(r / 1000)) grupos.push(r % 1000);
  const partes: { txt: string; valor: number }[] = [];
  for (let g = grupos.length - 1; g >= 0; g--) {
    const v = grupos[g];
    if (!v) continue;
    const [sing, plur] = ESCALAS[g] ?? ["", ""];
    const txt = g === 0 ? ate999(v) : g === 1 ? (v === 1 ? "mil" : `${ate999(v)} mil`) : `${ate999(v)} ${v === 1 ? sing : plur}`;
    partes.push({ txt, valor: v });
  }
  // "e" antes do último grupo só quando ele é menor que 100 ou centena redonda (mil e duzentos / mil quatrocentos e vinte)
  return partes
    .map((p, k) => {
      if (k === 0) return p.txt;
      const ultimo = k === partes.length - 1;
      return (ultimo && (p.valor < 100 || p.valor % 100 === 0) ? " e " : " ") + p.txt;
    })
    .join("");
}

export function valorPorExtenso(valor: number): string {
  const centavos = Math.round(Math.abs(valor) * 100);
  const reais = Math.floor(centavos / 100);
  const c = centavos % 100;
  let s = "";
  if (reais) {
    const txt = numeroPorExtenso(reais);
    // "um milhão de reais", "dois milhões de reais"
    const de = reais >= 1_000_000 && reais % 1_000_000 === 0 ? " de" : "";
    s = `${txt}${de} ${reais === 1 ? "real" : "reais"}`;
  }
  if (c) s += `${s ? " e " : ""}${numeroPorExtenso(c)} ${c === 1 ? "centavo" : "centavos"}`;
  return s || "zero reais";
}
