import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatarDocumento } from "@/lib/formato";
import BotaoImprimir from "@/components/orcamentos/BotaoImprimir";
import { dataExtenso } from "@/components/termos/tipos";
import { carregarTermo } from "@/app/(app)/termos/dados";
import "@/app/(app)/termos/termos.css";

export const dynamic = "force-dynamic";

interface Empresa {
  nome: string;
  documento: string | null;
  inscricao_estadual: string | null;
  endereco: string | null;
  telefone: string | null;
  cidade: string | null;
}

const rotuloDoc = (d: string | null) => (d && d.replace(/\D/g, "").length === 11 ? "CPF" : "CNPJ");

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  await exigirAcesso("termos");
  const d = await carregarTermo((await params).id);
  return { title: d ? `Termo de entrega ${d.termo.numero} - ${d.termo.recebedor_nome}` : "Termo de entrega" };
}

// Termo de entrega de material (modelo A+ Com) para imprimir / salvar em PDF
export default async function ImpressaoTermo({ params }: { params: Promise<{ id: string }> }) {
  await exigirAcesso("termos");
  const { id } = await params;
  const dados = await carregarTermo(id);
  if (!dados) notFound();
  const { termo: t, itens } = dados;
  const [empresa] = t.empresa_id
    ? await query<Empresa>("select nome, documento, inscricao_estadual, endereco, telefone, cidade from empresas where id = $1", [t.empresa_id])
    : [];
  const enderecoLinha = empresa?.endereco?.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).join(" - ");
  // Linhas em branco no fim da tabela, como no modelo (para itens escritos à mão)
  const brancos = Math.max(0, 3 - itens.length);

  return (
    <div className="termo-impressao">
      <div className="termo-imp-barra">
        <Link className="btn" href={`/termos/${t.id}`}>← Voltar ao termo</Link>
        <BotaoImprimir />
      </div>
      {!empresa && (
        <div className="alert warn termo-imp-aviso">
          Escolha a empresa que entrega no termo para o nome, CNPJ e endereço saírem no documento.
        </div>
      )}

      <article className="termo-folha">
        <header className="termo-topo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-amais-papel.jpg" alt="A+ Com" />
          <div className="termo-num">Nº {String(t.numero).padStart(4, "0")}</div>
        </header>

        <h1 className="termo-titulo">TERMO DE ENTREGA DE MATERIAL</h1>
        <p className="termo-intro">
          Pelo presente instrumento, declaramos para os devidos fins que os materiais abaixo relacionados foram entregues ao
          responsável identificado neste documento.
        </p>

        <h2>DADOS DA EMPRESA</h2>
        <p>Empresa: {empresa?.nome ?? "________________________________"}</p>
        {empresa?.documento && <p>{rotuloDoc(empresa.documento)}: {formatarDocumento(empresa.documento)}</p>}
        {enderecoLinha && <p>Endereço: {enderecoLinha}</p>}

        <h2>DADOS DO RECEBEDOR</h2>
        <p>Empresa: {t.recebedor_nome}</p>
        {t.recebedor_documento && <p>{rotuloDoc(t.recebedor_documento)}: {formatarDocumento(t.recebedor_documento)}</p>}
        {t.recebedor_endereco && <p>Endereço: {t.recebedor_endereco}</p>}

        <h2>MATERIAIS ENTREGUES</h2>
        <table className="termo-tabela">
          <thead>
            <tr><th className="q">QUANT</th><th>DESCRIÇÃO</th></tr>
          </thead>
          <tbody>
            {itens.map((i, k) => (
              <tr key={k}>
                <td className="q">{Number(i.quantidade).toLocaleString("pt-BR")}</td>
                <td>{i.descricao}</td>
              </tr>
            ))}
            {Array.from({ length: brancos }, (_, k) => (
              <tr key={`b${k}`} className="branco"><td className="q">&nbsp;</td><td>&nbsp;</td></tr>
            ))}
          </tbody>
        </table>

        {t.observacoes && (
          <>
            <h2>OBSERVAÇÕES</h2>
            <p className="termo-obs">{t.observacoes}</p>
          </>
        )}

        <h2 className="termo-recebido">RECEBIDO POR</h2>
        <p>Nome: {t.recebido_por ? <strong>{t.recebido_por}</strong> : "___________________________________________"}</p>
        <p>Documento: _______________________________</p>
        <div className="termo-assinatura">
          <div className="linha" />
          <div>Assinatura do recebedor</div>
        </div>

        <p className="termo-data">{empresa?.cidade?.trim() || "Brasília"}, {dataExtenso(t.data)}.</p>

        {empresa && (
          <footer className="termo-rodape">
            <div>{empresa.nome}</div>
            {(empresa.documento || empresa.inscricao_estadual) && (
              <div>
                {[
                  empresa.documento && `${rotuloDoc(empresa.documento)}: ${formatarDocumento(empresa.documento)}`,
                  empresa.inscricao_estadual && `IE: ${empresa.inscricao_estadual}`,
                ].filter(Boolean).join(" - ")}
              </div>
            )}
            {empresa.endereco?.split(/\r?\n/).filter((s) => s.trim()).map((s, k) => <div key={k}>{s}</div>)}
            {empresa.telefone && <div>Fone: {empresa.telefone}</div>}
          </footer>
        )}
      </article>
    </div>
  );
}
