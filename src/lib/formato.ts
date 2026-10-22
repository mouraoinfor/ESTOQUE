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
