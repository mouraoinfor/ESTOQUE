import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl, dataBR, formatarDocumento, valorPorExtenso } from "@/lib/formato";
import { totaisOrcamento, type ItemOrcamento, type Orcamento } from "@/components/orcamentos/tipos";
import BotaoImprimir from "@/components/orcamentos/BotaoImprimir";
import { carregarOrcamento } from "@/app/(app)/orcamentos/dados";
import "@/app/(app)/orcamentos/orcamentos.css";

export const dynamic = "force-dynamic";

const FUSO = "America/Sao_Paulo";

interface Empresa {
  nome: string;
  documento: string | null;
  inscricao_estadual: string | null;
  endereco: string | null;
  telefone: string | null;
  cidade: string | null;
  responsavel: string | null;
  responsavel_cargo: string | null;
}

interface Cliente {
  nome: string;
  documento: string | null;
  telefone: string | null;
  email: string | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  await exigirAcesso("orcamentos");
  const { id } = await params;
  const d = await carregarOrcamento(id);
  return { title: d ? `Proposta ${d.orcamento.numero} - ${d.orcamento.titulo}` : "Proposta" };
}

// Versão para o cliente: sem custo nem margem; fora do layout com menu.
// ?modelo=detalhado mostra a tabela com valor de cada item; o padrão é a proposta comercial.
export default async function ImpressaoOrcamento({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modelo?: string }>;
}) {
  await exigirAcesso("orcamentos");
  const { id } = await params;
  const detalhado = (await searchParams).modelo === "detalhado";
  const dados = await carregarOrcamento(id);
  if (!dados) notFound();
  const { orcamento: o, itens } = dados;

  const [[cliente], [empresa]] = await Promise.all([
    o.cliente_id
      ? query<Cliente>("select nome, documento, telefone, email from clientes where id = $1", [o.cliente_id])
      : Promise.resolve([]),
    o.empresa_id
      ? query<Empresa>(
          `select nome, documento, inscricao_estadual, endereco, telefone, cidade, responsavel, responsavel_cargo
             from empresas where id = $1`,
          [o.empresa_id]
        )
      : Promise.resolve([]),
  ]);

  return (
    <div className="orc-impressao">
      <div className="orc-imp-barra">
        <Link className="btn" href={`/orcamentos/${o.id}`}>← Voltar ao orçamento</Link>
        <div className="actions">
          <div className="tabs">
            <Link className={`btn small ${detalhado ? "" : "active"}`} href={`/orcamento-impressao/${o.id}`}>Proposta comercial</Link>
            <Link className={`btn small ${detalhado ? "active" : ""}`} href={`/orcamento-impressao/${o.id}?modelo=detalhado`}>Orçamento detalhado</Link>
          </div>
          <BotaoImprimir />
        </div>
      </div>
      {!detalhado && (!empresa || !empresa.endereco) && (
        <div className="alert warn orc-imp-aviso">
          {empresa
            ? <>Endereço, telefone e assinatura da proposta vêm do cadastro da empresa. <Link href="/financeiro/empresas">Completar dados da empresa</Link>.</>
            : <>Escolha a empresa no orçamento para o CNPJ, endereço e assinatura saírem na proposta.</>}
        </div>
      )}
      {detalhado ? (
        <Detalhado o={o} itens={itens} cliente={cliente} empresa={empresa} />
      ) : (
        <Proposta o={o} itens={itens} empresa={empresa} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Proposta comercial (modelo usado pela A+ Com)
// ---------------------------------------------------------------------
function Proposta({ o, itens, empresa }: { o: Orcamento; itens: ItemOrcamento[]; empresa?: Empresa }) {
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
          <img src="/logo-amais.png" alt="A+ Com Engenharia e Tecnologia" />
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

      <h1 className="prop-titulo">PROPOSTA COMERCIAL {o.numero}</h1>

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
        {empresa?.responsavel && (
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

// ---------------------------------------------------------------------
// Orçamento detalhado (valor de cada item)
// ---------------------------------------------------------------------
function Detalhado({ o, itens, cliente, empresa }: { o: Orcamento; itens: ItemOrcamento[]; cliente?: Cliente; empresa?: Empresa }) {
  const tot = totaisOrcamento(itens, o.desconto);
  const emissao = new Date(o.created_at).toLocaleDateString("pt-BR", { timeZone: FUSO });
  const nomeCliente = cliente?.nome ?? o.cliente_nome;

  return (
    <article className="orc-folha">
      <header className="orc-folha-topo">
        <div className="orc-folha-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-amais.png" alt="A+ Com Engenharia e Tecnologia" />
        </div>
        <div className="orc-folha-num">
          <div className="orc-folha-titulo">ORÇAMENTO</div>
          <div className="orc-folha-n">Nº {o.numero}</div>
          <div>Emissão: {emissao}</div>
          {o.validade && <div>Válido até: <strong>{dataBR(o.validade)}</strong></div>}
        </div>
      </header>

      {empresa && (
        <p className="orc-folha-empresa">
          {empresa.nome}{empresa.documento && ` · CNPJ/CPF ${formatarDocumento(empresa.documento)}`}
        </p>
      )}

      <section className="orc-folha-bloco">
        <div>
          <div className="orc-folha-rotulo">Cliente</div>
          <div className="orc-folha-valor">{nomeCliente ?? "—"}</div>
          {cliente && (
            <div className="orc-folha-sub">
              {[cliente.documento && formatarDocumento(cliente.documento), cliente.telefone, cliente.email].filter(Boolean).join(" · ")}
            </div>
          )}
          {o.aos_cuidados && <div className="orc-folha-sub">A/C: {o.aos_cuidados}</div>}
        </div>
        <div>
          <div className="orc-folha-rotulo">Projeto</div>
          <div className="orc-folha-valor">{o.titulo}</div>
        </div>
      </section>

      <table className="orc-folha-itens">
        <thead>
          <tr>
            <th className="n">#</th>
            <th>Descrição</th>
            <th className="v">Qtd</th>
            <th className="v">Valor unit.</th>
            <th className="v">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((i, k) => (
            <tr key={i.id ?? k}>
              <td className="n">{k + 1}</td>
              <td>{i.descricao}{i.tipo === "servico" && <span className="orc-folha-tag">serviço</span>}</td>
              <td className="v">{i.quantidade.toLocaleString("pt-BR")}</td>
              <td className="v">{brl(i.valor_unitario)}</td>
              <td className="v">{brl(i.quantidade * i.valor_unitario)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="orc-folha-totais">
        {tot.desconto > 0 && (
          <>
            <div><span>Subtotal</span><span>{brl(tot.subtotal)}</span></div>
            <div><span>Desconto</span><span>- {brl(tot.desconto)}</span></div>
          </>
        )}
        <div className="total"><span>Total</span><span>{brl(tot.total)}</span></div>
      </div>

      {o.condicoes && (
        <section className="orc-folha-texto">
          <div className="orc-folha-rotulo">Condições de pagamento</div>
          <p>{o.condicoes}</p>
        </section>
      )}
      {o.observacoes && (
        <section className="orc-folha-texto">
          <div className="orc-folha-rotulo">Observações</div>
          <p>{o.observacoes}</p>
        </section>
      )}

      <footer className="orc-folha-rodape">
        {o.validade ? `Orçamento válido até ${dataBR(o.validade)}.` : "Orçamento sujeito a confirmação de disponibilidade."}
      </footer>
    </article>
  );
}
