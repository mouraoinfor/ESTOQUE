import { query } from "@/lib/db";
import type { Produto } from "@/lib/types";
import ListaItens from "@/components/ListaItens";

export const dynamic = "force-dynamic";

export default async function Home() {
  const produtos = await query<Produto>("select * from produtos order by codigo");
  return <ListaItens produtos={produtos} />;
}
