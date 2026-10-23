// Folha da proposta comercial (modelo usado pela A+ Com).
// Usada na impressão e na prévia ao lado do editor, então não acessa banco nem servidor.
import { brl, dataBR, formatarDocumento, valorPorExtenso } from "@/lib/formato";
import { totaisOrcamento, type ItemOrcamento, type Orcamento } from "./tipos";

const FUSO = "America/Sao_Paulo";

export interface EmpresaProposta {
  id?: string;
  nome: string;
  documento: string | null;
  inscricao_estadual: string | null;
  endereco: string | null;
  telefone: string | null;
  cidade: string | null;
  responsavel: string | null;
  responsavel_cargo: string | null;
  assinatura: string | null; // imagem em data URL
}

export type DadosProposta = Pick<
  Orcamento,
  "numero" | "validade" | "observacoes" | "condicoes" | "desconto" | "aos_cuidados" | "descricao_servico" | "prazo_entrega"
  | "garantia_fabricacao" | "garantia_instalacao" | "exibir_valores" | "created_at"
>;

export default function PropostaFolha({ o, itens, empresa }: { o: DadosProposta; itens: ItemOrcamento[]; empresa?: EmpresaProposta | null }) {
  const tot = totaisOrcamento(itens, o.desconto);
  const materiais = itens.filter((i) => i.tipo === "produto");
  const servicos = itens.filter((i) => i.tipo === "servico");
  const valorMaterial = materiais.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);
  const valorServico = tot.subtotal - valorMaterial;

  const emissaoISO = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date(o.created_at));
  const emissaoExtenso = new Date(`${emissaoISO}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const diasValidade = o.validade
    ? Math.round((Date.parse(`${o.validade}T12:00:00Z`) - Date.parse(`${emissaoISO}T12:00:00Z`)) / 86_400_000)
    : null;

  // Sem texto próprio, a descrição do serviço lista os serviços da tabela
  const textoServico = o.descricao_servico ?? (servicos.length ? servicos.map((s, k) => `${k + 1} - ${s.descricao}`).join("\n") : null);
  const porItem = o.exibir_valores === "itens";
  const garantias = [o.garantia_fabricacao, o.garantia_instalacao].filter(Boolean);
  const linhaValor = (rotulo: string, v: number, negativo = false) => (
    <p>
      <strong>{rotulo}:</strong> {negativo && "- "}{brl(v)} ({valorPorExtenso(v)}).
    </p>
  );

  return (
    <article className="orc-folha prop-folha">
      <header className="prop-topo">
        <div className="prop-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-amais-papel.jpg" alt="A+ Com Engenharia e Tecnologia" />
          {o.aos_cuidados && <div className="prop-ac">A/C: {o.aos_cuidados}</div>}
        </div>
        {empresa && (
          <div className="prop-empresa">
            <div>{empresa.nome}</div>
            {(empresa.documento || empresa.inscricao_estadual) && (
              <div>
                {[
                  empresa.documento && `${empresa.documento.length === 11 ? "CPF" : "CNPJ"}: ${formatarDocumento(empresa.documento)}`,
                  empresa.inscricao_estadual && `IE: ${empresa.inscricao_estadual}`,
                ].filter(Boolean).join(" - ")}
              </div>
            )}
            {empresa.endereco && <div className="prop-quebra">{empresa.endereco}</div>}
            {empresa.telefone && <div>Fone: {empresa.telefone}</div>}
          </div>
        )}
      </header>

      <h1 className="prop-titulo">PROPOSTA COMERCIAL {o.numero || ""}</h1>

      {textoServico && (
        <section className="prop-secao">
          <h2>DESCRIÇÃO DO SERVIÇO</h2>
          <p>A proposta contempla os serviços descritos abaixo:</p>
          <p className="prop-quebra">{textoServico}</p>
        </section>
      )}
      {o.observacoes && <p className="prop-obs prop-quebra">OBS. {o.observacoes}</p>}

      {materiais.length > 0 && (
        <section className="prop-secao">
          <h2>DESCRIÇÃO DO MATERIAL</h2>
          <TabelaProposta itens={materiais} porItem={porItem} />
        </section>
      )}
      {porItem && servicos.length > 0 && (
        <section className="prop-secao">
          <h2>VALORES DO SERVIÇO</h2>
          <TabelaProposta itens={servicos} porItem />
        </section>
      )}

      <section className="prop-secao prop-investimento">
        <h2>INVESTIMENTO</h2>
        {valorMaterial > 0 && linhaValor("Valor do Material", valorMaterial)}
        {valorServico > 0 && linhaValor("Valor do Serviço", valorServico)}
        {tot.desconto > 0 && linhaValor("Desconto", tot.desconto, true)}
        {linhaValor("Valor Total", tot.total)}
        {o.condicoes && <p className="prop-quebra"><strong>Condições de pagamento:</strong> {o.condicoes}</p>}
      </section>

      <div className="prop-final">
        {/* Assinatura escaneada ao lado do prazo de entrega, como no modelo em papel */}
        {empresa?.assinatura && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="prop-assinatura-img" src={empresa.assinatura} alt={empresa.responsavel ? `Assinatura de ${empresa.responsavel}` : "Assinatura"} />
        )}
        <div>
          {o.prazo_entrega && (
            <section className="prop-secao">
              <h2>PRAZO DE ENTREGA</h2>
              <p className="prop-quebra">{o.prazo_entrega}</p>
            </section>
          )}
          {garantias.length > 0 && (
            <section className="prop-secao">
              <h2>PRAZO DE GARANTIA</h2>
              {garantias.map((g) => <p key={g}>{g}</p>)}
            </section>
          )}
        </div>
      </div>

      {/* Assinatura e rodapé ficam juntos na mesma página */}
      <div className="prop-fecho">
        {!empresa?.assinatura && empresa?.responsavel && (
          <div className="prop-assinatura">
            <div className="prop-assinatura-linha" />
            <strong>{empresa.responsavel}</strong>
            {empresa.responsavel_cargo && <div>{empresa.responsavel_cargo}</div>}
            <div>{empresa.nome}</div>
          </div>
        )}
        <footer className="prop-rodape">
          <span>{diasValidade !== null && diasValidade > 0 ? `Proposta válida por ${diasValidade} dia${diasValidade === 1 ? "" : "s"}` : o.validade ? `Proposta válida até ${dataBR(o.validade)}` : ""}</span>
          <span>{empresa?.cidade ? `${empresa.cidade}, ` : ""}{emissaoExtenso}.</span>
        </footer>
      </div>
    </article>
  );
}

// Tabela da proposta: QTD + descrição; com porItem, também valor unitário e subtotal
function TabelaProposta({ itens, porItem }: { itens: ItemOrcamento[]; porItem: boolean }) {
  return (
    <table className={`prop-tabela ${porItem ? "com-valores" : ""}`}>
      <thead>
        <tr>
          <th className="q">QTD</th>
          <th>DESCRIÇÃO</th>
          {porItem && <th className="v">VALOR UNIT.</th>}
          {porItem && <th className="v">SUBTOTAL</th>}
        </tr>
      </thead>
      <tbody>
        {itens.map((i, k) => (
          <tr key={i.id ?? k}>
            <td className="q">{i.quantidade.toLocaleString("pt-BR")}</td>
            <td>{i.descricao}</td>
            {porItem && <td className="v">{brl(i.valor_unitario)}</td>}
            {porItem && <td className="v">{brl(i.quantidade * i.valor_unitario)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
