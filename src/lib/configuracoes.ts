// Configurações gerais do sistema (tabela configuracoes; editadas em /configuracoes pelo admin)
import { query } from "@/lib/db";
import type { ModoPreco } from "@/lib/nfe";

export interface Precificacao {
  modo: ModoPreco;
  percentual: number;
}

export const PRECIFICACAO_PADRAO: Precificacao = { modo: "markup", percentual: 40 };

// Preço de venda sugerido a partir do custo (orçamento e importação de NF-e)
export async function precificacao(): Promise<Precificacao> {
  try {
    const [r] = await query<{ valor: Partial<Precificacao> }>("select valor from configuracoes where chave = 'precificacao'");
    const v = r?.valor;
    if (!v) return PRECIFICACAO_PADRAO;
    const modo: ModoPreco = v.modo === "margem" ? "margem" : "markup";
    const percentual = Number(v.percentual);
    return Number.isFinite(percentual) && percentual >= 0 ? { modo, percentual } : PRECIFICACAO_PADRAO;
  } catch {
    // Tabela ainda não criada (npm run db:setup): usa o padrão
    return PRECIFICACAO_PADRAO;
  }
}
