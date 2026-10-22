import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/auth";
import { query } from "@/lib/db";
import { brl, dataBR, formatarDocumento } from "@/lib/formato";
import { podeAcessar } from "@/lib/modulos";
import Icone from "@/components/Icone";
import ExcluirNota from "@/components/notas/ExcluirNota";
import ParcelasNota, { type ParcelaNota } from "@/components/notas/ParcelasNota";
import "../notas.css";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface NotaDetalhe {
  id: string;
  numero: string | null;
  serie: string | null;
  chave: string | null;
  emissao: string | null;
  natureza: string | null;
  forma_pagamento: string | null;
  valor_produtos: number;
  valor_frete: number;
  valor_seguro: number;
  valor_desconto: number;
  valor_ipi: number;
  valor_st: number;
  valor_outros: number;
  valor_total: number;
  usuario: string | null;
  created_at: string;
  empresa: string | null;
  fornecedor: string | null;
  fornecedor_doc: string | null;
  fornecedor_tel: string | null;
}

interface ItemDetalhe {
  id: string;
  numero_item: number;
  produto_id: string | null;
  produto_nome: string | null;
  produto_codigo: number | null;
  codigo_fornecedor: string | null;
  gtin: string | null;
  descricao: string;
  ncm: string | null;
  cfop: string | null;
  unidade: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  custo_unitario: number | null;
  markup: number | null;
  margem: number | null;
  preco_venda: number | null;
  quantidade_estoque: number;
  produto_criado: boolean;
  atualizou_preco: boolean;
}

function pct(v: number | null) {
  return v === null ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function brl4(v: number | null) {
  if (v === null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export default async function NotaPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigirAcesso("notas");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [[n], itens, parcelas] = await Promise.all([
    query<NotaDetalhe>(
      `select n.id, n.numero, n.serie, n.chave, (n.emissao at time zone 'America/Sao_Paulo')::date::text as emissao,
              n.natureza, n.forma_pagamento, n.valor_produtos, n.valor_frete, n.valor_seguro, n.valor_desconto,
              n.valor_ipi, n.valor_st, n.valor_outros, n.valor_total, n.usuario, to_char(n.created_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as created_at,
              e.nome as empresa, f.nome as fornecedor, f.documento as fornecedor_doc, f.telefone as fornecedor_tel
         from notas_fiscais n
         left join empresas e on e.id = n.empresa_id
         left join fornecedores f on f.id = n.fornecedor_id
        where n.id = $1`,
      [id]
    ),
    query<ItemDetalhe>(
      `select i.id, i.numero_item, i.produto_id, p.nome as produto_nome, p.codigo as produto_codigo, i.codigo_fornecedor,
              i.gtin, i.descricao, i.ncm, i.cfop, i.unidade, i.quantidade, i.valor_unitario, i.valor_total,
              i.custo_unitario, i.markup, i.margem, i.preco_venda, i.quantidade_estoque, i.produto_criado, i.atualizou_preco
         from nota_itens i
         left join produtos p on p.id = i.produto_id
        where i.nota_id = $1
        order by i.numero_item`,
      [id]
    ),
    query<ParcelaNota>(
      `select l.id, l.descricao, l.documento, l.vencimento::text as vencimento, l.valor, l.status, l.pago_em::text as pago_em,
              b.nome as banco
         from lancamentos l
         left join bancos b on b.id = l.banco_id
        where l.nota_id = $1
        order by l.vencimento, l.created_at`,
      [id]
    ),
  ]);
  if (!n) notFound();

  const podePagar = podeAcessar(s, "pagar");
  const podeItens = podeAcessar(s, "itens");
  const unidades = itens.reduce((t, i) => t + i.quantidade_estoque, 0);
  const custoItens = itens.reduce((t, i) => t + (i.custo_unitario ?? 0) * (i.quantidade_estoque > 0 ? i.quantidade_estoque : i.quantidade), 0);

  return (
    <>
      <p className="small"><Link href="/notas">← Voltar para notas fiscais</Link></p>
      <div className="actions" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ marginBottom: ".25rem" }}>NF {n.numero}{n.serie ? ` / ${n.serie}` : ""} · {n.fornecedor ?? "Fornecedor"}</h1>
          <div className="small muted">
            {formatarDocumento(n.fornecedor_doc)}
            {n.fornecedor_tel && <> · {n.fornecedor_tel}</>}
            {n.empresa && <> · para {n.empresa}</>}
          </div>
        </div>
        <div className="actions">
          <a className="btn" href={`/api/notas/${n.id}/xml`}><Icone nome="nota" tamanho={16} /> Baixar XML</a>
          <ExcluirNota id={n.id} podePagar={podePagar} />
        </div>
      </div>

      <div className="stats">
        <div className="stat"><div className="label">Valor da nota</div><div className="value" style={{ fontSize: "1.15rem" }}>{brl(n.valor_total)}</div></div>
        <div className="stat"><div className="label">Emissão</div><div className="value" style={{ fontSize: "1.15rem" }}>{dataBR(n.emissao)}</div></div>
        <div className="stat"><div className="label">Itens</div><div className="value">{itens.length}</div></div>
        <div className="stat"><div className="label">Unidades no estoque</div><div className="value">{unidades}</div></div>
      </div>

      <div className="card">
        <div className="grid4 nfe-dados">
          <div><span className="small muted">Natureza</span><div className="small">{n.natureza ?? "—"}</div></div>
          <div><span className="small muted">Pagamento</span><div className="small">{n.forma_pagamento ?? "—"}</div></div>
          <div><span className="small muted">Importada</span><div className="small">{n.created_at}{n.usuario && <> por {n.usuario}</>}</div></div>
          <div><span className="small muted">Custo dos itens</span><div className="small">{brl(custoItens)}</div></div>
        </div>
        <div className="small muted nfe-chave">Chave: {(n.chave ?? "").replace(/(\d{4})(?=\d)/g, "$1 ")}</div>
        <div className="nfe-totais small">
          <span>Produtos {brl(n.valor_produtos)}</span>
          {n.valor_frete > 0 && <span>Frete {brl(n.valor_frete)}</span>}
          {n.valor_seguro > 0 && <span>Seguro {brl(n.valor_seguro)}</span>}
          {n.valor_ipi > 0 && <span>IPI {brl(n.valor_ipi)}</span>}
          {n.valor_st > 0 && <span>ST {brl(n.valor_st)}</span>}
          {n.valor_outros > 0 && <span>Outras {brl(n.valor_outros)}</span>}
          {n.valor_desconto > 0 && <span>Desconto −{brl(n.valor_desconto)}</span>}
        </div>
      </div>

      <h3>Itens</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Descrição do fornecedor</th>
              <th className="num">Qtd</th>
              <th className="num">V. unit.</th>
              <th className="num" title="Por unidade de estoque, com rateio de frete/seguro/outros/IPI/ST e menos desconto">Custo real un.</th>
              <th className="num">Markup</th>
              <th className="num">Margem</th>
              <th className="num">Preço venda</th>
              <th>Produto no estoque</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id}>
                <td className="num muted">{i.numero_item}</td>
                <td>
                  {i.descricao}
                  <div className="small muted">
                    Cód. {i.codigo_fornecedor ?? "—"}
                    {i.gtin && <> · GTIN {i.gtin}</>}
                    {i.ncm && <> · NCM {i.ncm}</>}
                    {i.cfop && <> · CFOP {i.cfop}</>}
                  </div>
                </td>
                <td className="num">
                  {i.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 4 })} <span className="small muted">{i.unidade}</span>
                </td>
                <td className="num">{brl4(i.valor_unitario)}</td>
                <td className="num"><strong>{brl4(i.custo_unitario)}</strong></td>
                <td className="num">{pct(i.markup)}</td>
                <td className="num">{pct(i.margem)}</td>
                <td className="num">
                  {brl(i.preco_venda)}
                  {i.preco_venda !== null && !i.atualizou_preco && <div className="small muted">não gravado no produto</div>}
                </td>
                <td>
                  {i.produto_id ? (
                    <>
                      {podeItens ? (
                        <Link href={`/itens/${i.produto_id}`}>#{i.produto_codigo} · {i.produto_nome}</Link>
                      ) : (
                        <span>#{i.produto_codigo} · {i.produto_nome}</span>
                      )}
                      <div className="small muted">
                        +{i.quantidade_estoque} un.{i.produto_criado && <> · <span className="badge novo">criado pela nota</span></>}
                      </div>
                    </>
                  ) : (
                    <span className="muted small">Sem entrada no estoque</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ParcelasNota notaId={n.id} parcelas={parcelas} podePagar={podePagar} totalNota={n.valor_total} />
    </>
  );
}
