import Link from "next/link";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { empresaAtual } from "@/lib/empresa";
import { podeAcessar } from "@/lib/modulos";
import ImportarNota, { type ProdutoResumo } from "@/components/notas/ImportarNota";
import "../notas.css";

export const dynamic = "force-dynamic";

export default async function ImportarNotaPage() {
  const s = await exigirAcesso("notas");
  const { atual, todas } = await empresaAtual();
  const [produtos, bancos] = await Promise.all([
    query<ProdutoResumo>(
      `select id, codigo, nome, marca, modelo, gtin, condicao, quantidade, custo, preco_venda
         from produtos order by nome`
    ),
    query<{ id: string; empresa_id: string; nome: string }>("select id, empresa_id, nome from bancos where ativo order by nome"),
  ]);

  return (
    <>
      <p className="small"><Link href="/notas">← Voltar para notas fiscais</Link></p>
      <h1>Importar XML da NF-e</h1>
      {!atual ? (
        <div className="alert warn">
          Cadastre a empresa (CNPJ) antes de importar notas: <Link href="/financeiro/empresas">Empresas</Link>.
        </div>
      ) : (
        <ImportarNota
          produtos={produtos}
          empresas={todas.map((e) => ({ id: e.id, nome: e.nome, documento: e.documento }))}
          empresaAtualId={atual.id}
          bancos={bancos}
          podePagar={podeAcessar(s, "pagar")}
        />
      )}
    </>
  );
}
