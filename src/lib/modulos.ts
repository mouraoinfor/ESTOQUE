// Módulos do sistema: definem o menu e as permissões de cada usuário.
// O administrador acessa tudo; os demais só os módulos marcados em usuarios.permissoes.
import type { NomeIcone } from "@/components/Icone";

export interface Modulo {
  chave: string;
  label: string;
  href: string;
  icone: NomeIcone;
  grupo: "Estoque" | "Compras" | "Vendas" | "Financeiro";
}

export const MODULOS: Modulo[] = [
  { chave: "graficos", label: "Gráficos", href: "/graficos", icone: "graficos", grupo: "Estoque" },
  { chave: "itens", label: "Itens", href: "/itens", icone: "itens", grupo: "Estoque" },
  { chave: "anuncios", label: "Anúncios", href: "/anuncios", icone: "anuncios", grupo: "Estoque" },
  { chave: "conferencia", label: "Conferência", href: "/conferencia", icone: "conferencia", grupo: "Estoque" },
  { chave: "movimentacoes", label: "Movimentações", href: "/movimentacoes", icone: "movimentacoes", grupo: "Estoque" },
  { chave: "notas", label: "Notas fiscais", href: "/notas", icone: "nota", grupo: "Compras" },
  { chave: "orcamentos", label: "Orçamentos", href: "/orcamentos", icone: "orcamento", grupo: "Vendas" },
  { chave: "financeiro", label: "Visão geral", href: "/financeiro", icone: "carteira", grupo: "Financeiro" },
  { chave: "fingraficos", label: "Gráficos", href: "/financeiro/graficos", icone: "graficos", grupo: "Financeiro" },
  { chave: "pagar", label: "Contas a pagar", href: "/financeiro/pagar", icone: "pagar", grupo: "Financeiro" },
  { chave: "receber", label: "Contas a receber", href: "/financeiro/receber", icone: "receber", grupo: "Financeiro" },
  { chave: "bancos", label: "Bancos e saldos", href: "/financeiro/bancos", icone: "banco", grupo: "Financeiro" },
  { chave: "conciliacao", label: "Conciliação", href: "/financeiro/conciliacao", icone: "conciliacao", grupo: "Financeiro" },
  { chave: "cadastros", label: "Cadastros", href: "/financeiro/cadastros", icone: "pessoas", grupo: "Financeiro" },
  { chave: "empresas", label: "Empresas", href: "/financeiro/empresas", icone: "empresa", grupo: "Financeiro" },
];

export const GRUPOS = ["Estoque", "Compras", "Vendas", "Financeiro"] as const;

export interface Acesso {
  admin: boolean;
  permissoes: string[];
}

export function podeAcessar(a: Acesso, chave: string) {
  return a.admin || a.permissoes.includes(chave);
}

// Módulo dono de uma rota (o mais específico vence: /financeiro/pagar antes de /financeiro)
export function moduloDaRota(pathname: string) {
  return [...MODULOS]
    .sort((x, y) => y.href.length - x.href.length)
    .find((m) => pathname === m.href || pathname.startsWith(m.href + "/"));
}
