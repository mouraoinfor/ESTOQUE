import Link from "next/link";
import ProdutoForm from "@/components/ProdutoForm";

export default function NovoItem() {
  return (
    <>
      <p className="small"><Link href="/">← Voltar para itens</Link></p>
      <h1>Novo item</h1>
      <div style={{ maxWidth: 820 }}>
        <ProdutoForm />
      </div>
    </>
  );
}
