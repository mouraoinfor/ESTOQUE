// Tipos e contas do módulo Orçamentos (usados no servidor e no navegador)

export type StatusOrcamento = "rascunho" | "aprovado" | "baixado" | "cancelado";
// venda = venda de produtos; projeto = proposta de projeto (rascunho) que vira contrato fechado (aprovado)
export type TipoOrcamento = "venda" | "projeto";
export type TipoItem = "produto" | "servico";
// Na proposta: só os totais ou o valor de cada item
export type ExibirValores = "total" | "itens";

export const STATUS_ORCAMENTO: Record<StatusOrcamento, string> = {
  rascunho: "Rascunho",
  aprovado: "Aprovado",
  baixado: "Baixado",
  cancelado: "Cancelado",
};

export const TIPO_ORCAMENTO: Record<TipoOrcamento, string> = {
  venda: "Venda de produtos",
  projeto: "Projeto",
};

// Num projeto o rascunho é a proposta em negociação e o aprovado é o contrato fechado
export function rotuloStatus(tipo: TipoOrcamento, status: StatusOrcamento) {
  if (tipo !== "projeto") return STATUS_ORCAMENTO[status];
  return { rascunho: "Proposta", aprovado: "Fechado", baixado: "Fechado · material baixado", cancelado: "Perdido / cancelado" }[status];
}

// Reaproveita as cores dos badges globais
export const BADGE_ORCAMENTO: Record<StatusOrcamento, string> = {
  rascunho: "",
  aprovado: "pronto",
  baixado: "anunciado",
  cancelado: "baixa",
};

export interface Orcamento {
  id: string;
  numero: number;
  titulo: string;
  tipo: TipoOrcamento;
  valor_contrato: number | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  empresa_id: string | null;
  status: StatusOrcamento;
  validade: string | null;
  observacoes: string | null;
  condicoes: string | null;
  desconto: number;
  aos_cuidados: string | null;
  descricao_servico: string | null;
  prazo_entrega: string | null;
  garantia_fabricacao: string | null;
  garantia_instalacao: string | null;
  exibir_valores: ExibirValores;
  aprovado_em: string | null;
  baixado_em: string | null;
  baixado_por: string | null;
  created_at: string;
}

export interface ItemOrcamento {
  id?: string;
  produto_id: string | null;
  tipo: TipoItem;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  custo_unitario: number | null;
  secao?: string | null; // divisão do orçamento (ex.: "CFTV", "ALARME")
}

// Produto como aparece na busca do editor
export interface ProdutoBusca {
  id: string;
  codigo: number;
  nome: string;
  marca: string | null;
  modelo: string | null;
  quantidade: number;
  preco: number | null;
  custo: number | null; // null também quando o usuário não pode ver custo
}

export interface ClienteBusca {
  id: string;
  nome: string;
  documento: string | null;
  telefone: string | null;
  email: string | null;
}

// O que o editor manda para salvar
export interface DadosOrcamento {
  titulo: string;
  tipo: TipoOrcamento;
  valor_contrato: number | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  empresa_id: string | null;
  validade: string | null;
  observacoes: string | null;
  condicoes: string | null;
  desconto: number;
  aos_cuidados: string | null;
  descricao_servico: string | null;
  prazo_entrega: string | null;
  garantia_fabricacao: string | null;
  garantia_instalacao: string | null;
  exibir_valores: ExibirValores;
  itens: ItemOrcamento[];
}

// Textos que já vêm preenchidos numa proposta nova
export const PADROES_PROPOSTA = {
  prazo_entrega: "5 dias úteis.",
  garantia_fabricacao: "01 Ano contra defeitos de fabricação (direto na rede autorizada).",
  garantia_instalacao: "06 Meses na instalação.",
};

// Conta a receber opcional (na aprovação / baixa)
export interface ContaReceberPedido {
  empresa_id: string;
  valor: number;
  vencimento: string; // 1ª parcela, AAAA-MM-DD
  parcelas: number;
}

// Número da proposta para o cliente: número do orçamento + data de emissão em ddmmaa (nº 4 em 29/10/26 = 4291026)
export function numeroProposta(numero: number, criadoEm: string) {
  if (!numero) return "";
  const [a, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(criadoEm)).split("-");
  return `${numero}${d}${m}${a.slice(2)}`;
}

export function totaisOrcamento(itens: ItemOrcamento[], desconto: number) {
  let subtotal = 0, custo = 0, semCusto = 0;
  for (const i of itens) {
    subtotal += i.quantidade * i.valor_unitario;
    if (i.custo_unitario === null || i.custo_unitario === undefined) {
      if (i.tipo === "produto") semCusto++;
    } else custo += i.quantidade * i.custo_unitario;
  }
  const total = Math.max(0, subtotal - (desconto || 0));
  return { subtotal, desconto: desconto || 0, total, custo, lucro: total - custo, semCusto };
}

// Divide um valor em parcelas mensais (centavos certos; a última leva a diferença)
export function parcelar(valor: number, n: number, primeiro: string) {
  const qtd = Math.max(1, Math.min(60, Math.trunc(n)));
  const centavos = Math.round(valor * 100);
  const base = Math.floor(centavos / qtd);
  const [a, m, d] = primeiro.split("-").map(Number);
  return Array.from({ length: qtd }, (_, k) => {
    const mes0 = m - 1 + k;
    const ano = a + Math.floor(mes0 / 12);
    const mes = (mes0 % 12) + 1;
    const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    const dia = Math.min(d, ultimo);
    const venc = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const v = k === qtd - 1 ? centavos - base * (qtd - 1) : base;
    return { vencimento: venc, valor: v / 100 };
  });
}

// Itens agrupados pela divisão, na ordem em que aparecem (divisão vazia = itens sem divisão)
export function porSecao<T extends { secao?: string | null }>(itens: T[]) {
  const grupos: { secao: string; itens: T[] }[] = [];
  for (const i of itens) {
    const s = i.secao ?? "";
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.secao === s) ultimo.itens.push(i);
    else grupos.push({ secao: s, itens: [i] });
  }
  return grupos;
}

export function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
