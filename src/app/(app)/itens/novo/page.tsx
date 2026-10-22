import { exigirAcesso } from "@/lib/auth";
import Link from "next/link";
import ProdutoForm from "@/components/ProdutoForm";

export default async function NovoItem() {
  await exigirAcesso("itens");
  return (
    <>
      <p className="small"><Link href="/itens">← Voltar para itens</Link></p>
      <h1>Novo item</h1>
      <div style={{ maxWidth: 820 }}>
        <ProdutoForm />
      </div>
    </>
  );
}
