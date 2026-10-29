// Tipos do módulo Projetos (usados no servidor e no navegador)

export type CategoriaGasto = "material" | "mao_de_obra" | "terceiros" | "deslocamento" | "alimentacao" | "outros";

export const CATEGORIAS_GASTO: Record<CategoriaGasto, string> = {
  material: "Material",
  mao_de_obra: "Mão de obra",
  terceiros: "Terceiros",
  deslocamento: "Deslocamento / combustível",
  alimentacao: "Alimentação",
  outros: "Outros",
};

export interface GastoProjeto {
  id: string;
  data: string;
  categoria: CategoriaGasto;
  descricao: string;
  produto_id: string | null;
  produto_codigo: number | null;
  quantidade: number;
  valor_unitario: number;
  baixou_estoque: boolean;
  lancamento_id: string | null;
  conta_status: string | null;
  usuario: string | null;
}

// Resumo financeiro de um projeto fechado
export interface ResumoProjeto {
  id: string;
  numero: number;
  titulo: string;
  cliente_nome: string | null;
  status: "aprovado" | "baixado";
  aprovado_em: string | null;
  contrato: number;          // valor fechado (ou o total do orçamento)
  custo_previsto: number;    // custo dos itens do orçamento
  material_baixado: number;  // custo dos itens do orçamento já baixados do estoque
  gastos: number;            // lançados em projeto_gastos
  recebido: number;
  a_receber: number;
}

export function gastoTotal(p: Pick<ResumoProjeto, "material_baixado" | "gastos">) {
  return p.material_baixado + p.gastos;
}
