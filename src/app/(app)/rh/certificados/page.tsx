import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { hojeISO } from "@/lib/formato";
import CertificadoForm, { type FuncionarioCertificado } from "@/components/rh/CertificadoForm";
import "../rh.css";
import "../certificado.css";

export const dynamic = "force-dynamic";

export default async function CertificadosPagina() {
  await exigirAcesso("certificados");
  const funcionarios = await query<FuncionarioCertificado>(
    "select id, nome, documento from funcionarios where ativo order by lower(nome)"
  );

  return (
    <div className="rh">
      <div className="actions rh-topo">
        <h1>Certificados de treinamento</h1>
      </div>
      <p className="muted small rh-nota">
        Preencha os dados, confira na prévia e clique em Abrir para imprimir. Imprima em A4 paisagem, sem margens,
        com &quot;gráficos de plano de fundo&quot; marcado, e assine à mão.
      </p>
      <CertificadoForm funcionarios={funcionarios} hoje={hojeISO()} />
    </div>
  );
}
