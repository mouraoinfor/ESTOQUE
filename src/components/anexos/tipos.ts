// Anexos do orçamento (usados no servidor e no navegador)
export const PARTE_BYTES = 2.5 * 1024 * 1024; // cada envio fica abaixo do limite de 4,5 MB da Vercel
export const MAX_ANEXO_BYTES = 30 * 1024 * 1024;

export interface Anexo {
  id: string;
  nome: string;
  mime: string;
  tamanho: number;
  partes: number;
  usuario: string | null;
  created_at: string;
}

export function tamanhoTexto(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} KB`;
  return `${(b / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}
