// Preço de venda padrão a partir do custo (sem acesso ao banco: pode ser usado no navegador).
// O valor salvo fica em configuracoes ('precificacao'); leitura em lib/configuracoes.ts.
import type { ModoPreco } from "@/lib/nfe";

export interface Precificacao {
  modo: ModoPreco;
  percentual: number;
}

export const PRECIFICACAO_PADRAO: Precificacao = { modo: "markup", percentual: 40 };
