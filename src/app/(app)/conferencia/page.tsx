import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Produto } from "@/lib/types";
import Conferencia from "@/components/Conferencia";

export const dynamic = "force-dynamic";

export default async function ConferenciaPage() {
  await exigirAcesso("conferencia");
  const produtos = await query<Produto>(
    `select id, codigo, nome, marca, modelo, condicao, localizacao, quantidade, quantidade_conferida, conferido_em
       from produtos order by codigo`
  );
  return <Conferencia produtos={produtos} />;
}
