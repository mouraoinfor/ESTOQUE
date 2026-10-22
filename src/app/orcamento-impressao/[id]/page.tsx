import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl, dataBR, formatarDocumento } from "@/lib/formato";
import { totaisOrcamento } from "@/components/orcamentos/tipos";
import BotaoImprimir from "@/components/orcamentos/BotaoImprimir";
import { carregarOrcamento } from "@/app/(app)/orcamentos/dados";
import "@/app/(app)/orcamentos/orcamentos.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  await exigirAcesso("orcamentos");
  const { id } = await params;
  const d = await carregarOrcamento(id);
  return { title: d ? `Orçamento ${d.orcamento.numero} - ${d.orcamento.titulo}` : "Orçamento" };
}

// Versão para o cliente: sem custo nem margem; fora do layout com menu
export default async function ImpressaoOrcamento({ params }: { params: Promise<{ id: string }> }) {
  await exigirAcesso("orcamentos");
  const { id } = await params;
  const dados = await carregarOrcamento(id);
  if (!dados) notFound();
  const { orcamento: o, itens } = dados;

  const [[cliente], [empresa]] = await Promise.all([
    o.cliente_id
      ? query<{ nome: string; documento: string | null; telefone: string | null; email: string | null }>(
          "select nome, documento, telefone, email from clientes where id = $1",
          [o.cliente_id]
        )
      : Promise.resolve([]),
    o.empresa_id
      ? query<{ nome: string; documento: string | null }>("select nome, documento from empresas where id = $1", [o.empresa_id])
      : Promise.resolve([]),
  ]);

  const tot = totaisOrcamento(itens, o.desconto);
  const emissao = new Date(o.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const nomeCliente = cliente?.nome ?? o.cliente_nome;

  return (
    <div className="orc-impressao">
      <div className="orc-imp-barra">
        <Link className="btn" href={`/orcamentos/${o.id}`}>← Voltar ao orçamento</Link>
        <BotaoImprimir />
      </div>

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
    </div>
  );
}
