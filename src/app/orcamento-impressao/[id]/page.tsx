import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl, dataBR, formatarDocumento } from "@/lib/formato";
import { numeroProposta, totaisOrcamento, type ItemOrcamento, type Orcamento } from "@/components/orcamentos/tipos";
import BotaoImprimir from "@/components/orcamentos/BotaoImprimir";
import PropostaFolha, { type EmpresaProposta } from "@/components/orcamentos/PropostaFolha";
import { CAMPOS_EMPRESA_PROPOSTA, carregarOrcamento } from "@/app/(app)/orcamentos/dados";
import "@/app/(app)/orcamentos/orcamentos.css";

export const dynamic = "force-dynamic";

const FUSO = "America/Sao_Paulo";

type Empresa = EmpresaProposta;

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
  return { title: d ? `Proposta ${numeroProposta(d.orcamento.numero, d.orcamento.created_at)} - ${d.orcamento.titulo}` : "Proposta" };
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
          `select ${CAMPOS_EMPRESA_PROPOSTA} from empresas where id = $1`,
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
        <PropostaFolha o={o} itens={itens} empresa={empresa} />
      )}
    </div>
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
          <div className="orc-folha-n">Nº {numeroProposta(o.numero, o.created_at)}</div>
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
