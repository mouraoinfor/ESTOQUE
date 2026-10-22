export type Condicao = "novo" | "usado" | "recondicionado";
export type Canal = "mercado_livre" | "olx" | "ambos" | "nenhum";
export type Status = "somente_estoque" | "a_revisar" | "pronto" | "anunciado" | "vendido";

export interface Produto {
  id: string;
  codigo: number;
  nome: string;
  nome_original: string | null;
  marca: string | null;
  modelo: string | null;
  categoria: string | null;
  condicao: Condicao;
  quantidade: number;
  localizacao: string | null;
  custo: number | null;
  para_venda: boolean;
  canal: Canal;
  status: Status;
  observacoes: string | null;
  quantidade_conferida: number | null;
  conferido_em: string | null;
  titulo_ml: string | null;
  titulo_olx: string | null;
  descricao: string | null;
  ficha_tecnica: Record<string, string>;
  palavras_chave: string[];
  categoria_ml: string | null;
  categoria_olx: string | null;
  conteudo_embalagem: string | null;
  garantia: string | null;
  gtin: string | null;
  peso_kg: number | null;
  altura_cm: number | null;
  largura_cm: number | null;
  comprimento_cm: number | null;
  preco_sugerido: number | null;
  preco_min: number | null;
  preco_max: number | null;
  preco_venda: number | null;
  link_anuncio: string | null;
  fontes: string[];
  confianca: "alta" | "media" | "baixa" | null;
  pendencias: string | null;
  created_at: string;
  updated_at: string;
}

export interface Movimentacao {
  id: string;
  produto_id: string;
  tipo: "entrada" | "saida" | "venda" | "ajuste";
  quantidade: number;
  saldo_apos: number | null;
  motivo: string | null;
  usuario: string | null;
  created_at: string;
}

export const CATEGORIAS = [
  "Redes",
  "Telefonia",
  "CFTV",
  "Controle de Acesso",
  "Alarme e Sensores",
  "Energia",
  "Energia Solar",
  "Fechaduras e Acessórios",
  "Automação de Portões",
  "Informática",
  "Automotivo",
  "Outros",
];

export const STATUS_LABEL: Record<Status, string> = {
  somente_estoque: "Só estoque",
  a_revisar: "A revisar",
  pronto: "Pronto p/ anunciar",
  anunciado: "Anunciado",
  vendido: "Vendido",
};

export const CANAL_LABEL: Record<Canal, string> = {
  mercado_livre: "Mercado Livre",
  olx: "OLX",
  ambos: "ML + OLX",
  nenhum: "—",
};

export const CONDICAO_LABEL: Record<Condicao, string> = {
  novo: "Novo",
  usado: "Usado",
  recondicionado: "Recondicionado",
};

export function brl(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
