import type { Metadata } from "next";
import Link from "next/link";
import { exigirAcesso } from "@/lib/auth";
import BotaoImprimir from "@/components/orcamentos/BotaoImprimir";
import CertificadoFolhas, { certificadoDaUrl } from "@/components/rh/CertificadoFolhas";
import "@/app/(app)/rh/certificado.css";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: Params }): Promise<Metadata> {
  const d = certificadoDaUrl(await searchParams);
  return { title: d.nome ? `Certificado - ${d.nome}` : "Certificado" };
}

// Folha de impressão do certificado, fora do layout com menu. Os dados vêm da URL (nada é gravado).
export default async function ImpressaoCertificado({ searchParams }: { searchParams: Params }) {
  await exigirAcesso("certificados");
  const d = certificadoDaUrl(await searchParams);

  return (
    <div className="cert-impressao">
      <div className="cert-barra">
        <Link className="btn" href="/rh/certificados">← Voltar</Link>
        <BotaoImprimir />
      </div>
      <CertificadoFolhas d={d} />
    </div>
  );
}
