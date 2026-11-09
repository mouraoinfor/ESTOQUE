// Tipos do módulo Termos de entrega (usados no servidor e no navegador)

export interface ItemTermo {
  produto_id: string | null; // null = item avulso
  produto_codigo: number | null;
  descricao: string;
  quantidade: number | string;
}

export interface Termo {
  id: string;
  numero: number;
  empresa_id: string | null;
  cliente_id: string | null;
  recebedor_nome: string;
  recebedor_documento: string | null;
  recebedor_endereco: string | null;
  recebido_por: string | null;
  data: string;
  orcamento_id: string | null;
  observacoes: string | null;
  usuario: string | null;
}

// O que o editor manda para salvar
export interface DadosTermo {
  empresa_id: string | null;
  cliente_id: string | null;
  recebedor_nome: string;
  recebedor_documento: string;
  recebedor_endereco: string;
  recebido_por: string;
  data: string;
  orcamento_id: string | null;
  observacoes: string;
  itens: ItemTermo[];
}

// Orçamento/projeto de onde dá para puxar os itens
export interface OrcamentoOpcao {
  id: string;
  numero: number;
  titulo: string;
  cliente_nome: string | null;
}

export const SELECT_TERMO = `select id, numero, empresa_id, cliente_id, recebedor_nome, recebedor_documento, recebedor_endereco,
  recebido_por, data::text as data, orcamento_id, observacoes, usuario from termos_entrega`;

// "2026-11-09" -> "09 de novembro de 2026"
export function dataExtenso(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}
