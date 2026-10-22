// Leitura do XML da NF-e (modelo 55) — TypeScript puro, sem dependências.
// No navegador usa o DOMParser; no servidor (sem DOMParser) usa um parser XML leve embutido.
// As duas leituras viram a mesma árvore simples (NoXml), então a extração e os cálculos são idênticos.

export const NS_NFE = "http://www.portalfiscal.inf.br/nfe";

// ---------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------
export interface ParteNFe {
  documento: string; // CNPJ ou CPF só com dígitos
  nome: string;
  fantasia: string;
  ie: string;
  telefone: string;
  endereco: string;
}

export interface TotaisNFe {
  vProd: number;
  vFrete: number;
  vSeg: number;
  vDesc: number;
  vIPI: number;
  vST: number;
  vFCPST: number;
  vOutro: number;
  vNF: number;
}

export interface ItemNFe {
  nItem: number;
  codigo: string; // cProd (código do fornecedor)
  gtin: string; // "" quando SEM GTIN
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorProdutos: number;
  // Valores do item (já com o rateio do que só veio no total da nota)
  frete: number;
  seguro: number;
  desconto: number;
  outros: number;
  ipi: number;
  icmsSt: number;
  fcpSt: number;
  rateado: boolean; // recebeu parte de algum valor que só estava no total
  custoTotal: number;
  custoUnitario: number; // sem arredondar
}

export interface DuplicataNFe {
  numero: string;
  vencimento: string; // AAAA-MM-DD
  valor: number;
}

export interface PagamentoNFe {
  tPag: string;
  descricao: string;
  valor: number;
}

export interface NFe {
  chave: string;
  numero: string;
  serie: string;
  modelo: string;
  emissao: string; // dhEmi (ou dEmi) como veio
  dataEmissao: string; // AAAA-MM-DD
  natureza: string;
  emitente: ParteNFe;
  destinatario: { documento: string; nome: string };
  totais: TotaisNFe;
  itens: ItemNFe[];
  fatura: { numero: string; valorOriginal: number; desconto: number; valorLiquido: number } | null;
  duplicatas: DuplicataNFe[];
  pagamentos: PagamentoNFe[];
  formaPagamento: string;
  protocolo: string;
  // Venda para entrega futura: "faturamento" = nota de simples faturamento (CFOP x922, a mercadoria vem depois);
  // "remessa" = nota da entrega (CFOP x116/x117, já faturada antes)
  entregaFutura: "faturamento" | "remessa" | null;
  avisos: string[];
}

export class ErroNFe extends Error {}

// ---------------------------------------------------------------------
// Árvore XML simples
// ---------------------------------------------------------------------
export interface NoXml {
  nome: string; // nome local (sem prefixo)
  ns: string | null;
  attrs: Record<string, string>;
  filhos: NoXml[];
  texto: string; // texto direto (sem o dos filhos)
}

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodificar(s: string) {
  if (s.indexOf("&") < 0) return s;
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, e: string) => {
    if (e[0] === "#") {
      const cod = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cod) ? String.fromCodePoint(cod) : m;
    }
    return ENTIDADES[e] ?? m;
  });
}

// Parser XML leve (suficiente para NF-e: elementos, atributos, namespaces, CDATA, comentários, entidades)
export function parseXmlLeve(xml: string): NoXml {
  const s = xml.charCodeAt(0) === 0xfeff ? xml.slice(1) : xml;
  const pilha: { no: NoXml; nsMap: Record<string, string> }[] = [];
  let raiz: NoXml | null = null;
  let i = 0;
  const n = s.length;

  const erro = (msg: string) => new ErroNFe(`XML inválido: ${msg} (posição ${i})`);

  while (i < n) {
    const lt = s.indexOf("<", i);
    if (lt < 0) {
      if (s.slice(i).trim() && pilha.length) throw erro("conteúdo fora de elemento");
      break;
    }
    if (lt > i && pilha.length) pilha[pilha.length - 1].no.texto += decodificar(s.slice(i, lt));
    i = lt;

    if (s.startsWith("<?", i)) {
      const fim = s.indexOf("?>", i);
      if (fim < 0) throw erro("instrução de processamento sem fim");
      i = fim + 2;
    } else if (s.startsWith("<!--", i)) {
      const fim = s.indexOf("-->", i);
      if (fim < 0) throw erro("comentário sem fim");
      i = fim + 3;
    } else if (s.startsWith("<![CDATA[", i)) {
      const fim = s.indexOf("]]>", i);
      if (fim < 0) throw erro("CDATA sem fim");
      if (pilha.length) pilha[pilha.length - 1].no.texto += s.slice(i + 9, fim);
      i = fim + 3;
    } else if (s.startsWith("<!", i)) {
      const fim = s.indexOf(">", i);
      if (fim < 0) throw erro("declaração sem fim");
      i = fim + 1;
    } else if (s.startsWith("</", i)) {
      const fim = s.indexOf(">", i);
      if (fim < 0) throw erro("tag de fechamento sem fim");
      const nomeBruto = s.slice(i + 2, fim).trim();
      const topo = pilha.pop();
      if (!topo) throw erro(`fechamento inesperado </${nomeBruto}>`);
      const local = nomeBruto.includes(":") ? nomeBruto.slice(nomeBruto.indexOf(":") + 1) : nomeBruto;
      if (local !== topo.no.nome) throw erro(`esperava </${topo.no.nome}> e encontrei </${nomeBruto}>`);
      i = fim + 1;
    } else {
      // Tag de abertura: acha o ">" respeitando aspas
      let j = i + 1;
      let aspa = "";
      while (j < n) {
        const c = s[j];
        if (aspa) {
          if (c === aspa) aspa = "";
        } else if (c === '"' || c === "'") aspa = c;
        else if (c === ">") break;
        j++;
      }
      if (j >= n) throw erro("tag sem fim");
      let corpo = s.slice(i + 1, j);
      const autoFecha = corpo.endsWith("/");
      if (autoFecha) corpo = corpo.slice(0, -1);
      const mNome = corpo.match(/^\s*([^\s/>]+)/);
      if (!mNome) throw erro("tag sem nome");
      const nomeBruto = mNome[1];
      const brutos: Record<string, string> = {};
      const reAttr = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
      const resto = corpo.slice(mNome[0].length);
      let m: RegExpExecArray | null;
      while ((m = reAttr.exec(resto))) brutos[m[1]] = decodificar(m[3] ?? m[4] ?? "");

      const nsPai = pilha.length ? pilha[pilha.length - 1].nsMap : {};
      let nsMap = nsPai;
      for (const k of Object.keys(brutos)) {
        if (k === "xmlns" || k.startsWith("xmlns:")) {
          if (nsMap === nsPai) nsMap = { ...nsPai };
          nsMap[k === "xmlns" ? "" : k.slice(6)] = brutos[k];
        }
      }
      const pos = nomeBruto.indexOf(":");
      const prefixo = pos >= 0 ? nomeBruto.slice(0, pos) : "";
      const attrs: Record<string, string> = {};
      for (const k of Object.keys(brutos)) {
        if (k === "xmlns" || k.startsWith("xmlns:")) continue;
        attrs[k.includes(":") ? k.slice(k.indexOf(":") + 1) : k] = brutos[k];
      }
      const no: NoXml = {
        nome: pos >= 0 ? nomeBruto.slice(pos + 1) : nomeBruto,
        ns: nsMap[prefixo] ?? null,
        attrs,
        filhos: [],
        texto: "",
      };
      if (pilha.length) pilha[pilha.length - 1].no.filhos.push(no);
      else if (raiz) throw erro("mais de um elemento raiz");
      else raiz = no;
      if (!autoFecha) pilha.push({ no, nsMap });
      i = j + 1;
    }
  }
  if (pilha.length) throw new ErroNFe(`XML inválido: elemento <${pilha[pilha.length - 1].no.nome}> não foi fechado`);
  if (!raiz) throw new ErroNFe("XML vazio");
  return raiz;
}

// Conversão de um DOM (DOMParser do navegador) para a árvore simples
interface ElementoDom {
  nodeType: number;
  localName?: string | null;
  nodeName: string;
  namespaceURI?: string | null;
  nodeValue?: string | null;
  attributes?: ArrayLike<{ name: string; localName?: string | null; value: string }> | null;
  childNodes: ArrayLike<ElementoDom>;
}

function domParaNo(el: ElementoDom): NoXml {
  const attrs: Record<string, string> = {};
  const lista = el.attributes;
  if (lista) {
    for (let k = 0; k < lista.length; k++) {
      const a = lista[k];
      if (a.name === "xmlns" || a.name.startsWith("xmlns:")) continue;
      attrs[a.localName || a.name] = a.value;
    }
  }
  const no: NoXml = {
    nome: el.localName || el.nodeName.replace(/^.*:/, ""),
    ns: el.namespaceURI || null,
    attrs,
    filhos: [],
    texto: "",
  };
  for (let k = 0; k < el.childNodes.length; k++) {
    const c = el.childNodes[k];
    if (c.nodeType === 1) no.filhos.push(domParaNo(c));
    else if (c.nodeType === 3 || c.nodeType === 4) no.texto += c.nodeValue ?? "";
  }
  return no;
}

// Usa o DOMParser quando existe (navegador); senão o parser leve
export function lerXml(xml: string): NoXml {
  const DP = (globalThis as { DOMParser?: new () => { parseFromString(s: string, t: string): unknown } }).DOMParser;
  if (typeof DP !== "function") return parseXmlLeve(xml);
  const invalido = () => new ErroNFe("XML inválido: o arquivo não pôde ser lido (está corrompido ou não é XML).");
  let doc: { documentElement: ElementoDom | null; getElementsByTagName(n: string): ArrayLike<unknown> };
  try {
    doc = new DP().parseFromString(xml.charCodeAt(0) === 0xfeff ? xml.slice(1) : xml, "application/xml") as typeof doc;
  } catch {
    throw invalido(); // alguns DOMParsers jogam exceção em vez de devolver <parsererror>
  }
  const raiz = doc.documentElement;
  if (!raiz || doc.getElementsByTagName("parsererror").length || raiz.nodeName === "parsererror") throw invalido();
  return domParaNo(raiz);
}

// ---------------------------------------------------------------------
// Navegação (só elementos do namespace da NF-e ou sem namespace)
// ---------------------------------------------------------------------
function nsOk(no: NoXml) {
  return no.ns === null || no.ns === "" || no.ns === NS_NFE;
}
function filho(no: NoXml | null | undefined, nome: string): NoXml | null {
  if (!no) return null;
  return no.filhos.find((f) => f.nome === nome && nsOk(f)) ?? null;
}
function filhosDe(no: NoXml | null | undefined, nome: string): NoXml[] {
  if (!no) return [];
  return no.filhos.filter((f) => f.nome === nome && nsOk(f));
}
function buscar(no: NoXml | null | undefined, nome: string): NoXml | null {
  if (!no) return null;
  for (const f of no.filhos) {
    if (!nsOk(f)) continue;
    if (f.nome === nome) return f;
    const r = buscar(f, nome);
    if (r) return r;
  }
  return null;
}
function txt(no: NoXml | null | undefined, nome: string) {
  return (filho(no, nome)?.texto ?? "").trim();
}
function num(no: NoXml | null | undefined, nome: string) {
  const v = Number(txt(no, nome));
  return Number.isFinite(v) ? v : 0;
}
// Procura o primeiro descendente com esse nome (ex.: vICMSST dentro de ICMS/ICMS10)
function numFundo(no: NoXml | null | undefined, nome: string) {
  const v = Number((buscar(no, nome)?.texto ?? "").trim());
  return Number.isFinite(v) ? v : 0;
}

// ---------------------------------------------------------------------
// Cálculos (funções puras, também usadas na tela)
// ---------------------------------------------------------------------

// Distribui "valor" proporcionalmente aos pesos (vProd de cada item). Sem arredondar.
export function ratear(pesos: number[], valor: number): number[] {
  const soma = pesos.reduce((s, p) => s + p, 0);
  if (!valor) return pesos.map(() => 0);
  if (soma <= 0) return pesos.map(() => valor / (pesos.length || 1));
  return pesos.map((p) => (valor * p) / soma);
}

export interface ValoresItem {
  vProd: number;
  vFrete: number;
  vSeg: number;
  vOutro: number;
  vIPI: number;
  vICMSST: number;
  vFCPST: number;
  vDesc: number;
}

export function custoTotalItem(v: ValoresItem) {
  return v.vProd + v.vFrete + v.vSeg + v.vOutro + v.vIPI + v.vICMSST + v.vFCPST - v.vDesc;
}

export function custoUnitario(v: ValoresItem, quantidade: number) {
  return quantidade > 0 ? custoTotalItem(v) / quantidade : 0;
}

export type ModoPreco = "markup" | "margem";

// markup: preço = custo × (1 + m/100) ; margem: preço = custo / (1 − m/100), margem < 100
export function precoPor(modo: ModoPreco, custo: number, percentual: number): number | null {
  if (!Number.isFinite(custo) || !Number.isFinite(percentual)) return null;
  if (modo === "markup") return custo * (1 + percentual / 100);
  if (percentual >= 100) return null;
  return custo / (1 - percentual / 100);
}

export function markupDe(custo: number, preco: number) {
  return custo > 0 ? (preco / custo - 1) * 100 : null;
}

export function margemDe(custo: number, preco: number) {
  return preco > 0 ? ((preco - custo) / preco) * 100 : null;
}

// Arredonda para cima terminando em ,90 (37,42 -> 37,90 ; 37,95 -> 38,90)
export function arredondar90(preco: number) {
  const base = Math.floor(preco) + 0.9;
  return Math.round((base >= preco - 1e-9 ? base : base + 1) * 100) / 100;
}

export function centavos(v: number) {
  return Math.round(v * 100) / 100;
}

// Dígito verificador da chave (módulo 11)
export function chaveValida(chave: string) {
  if (!/^\d{44}$/.test(chave)) return false;
  let soma = 0;
  let peso = 2;
  for (let k = 42; k >= 0; k--) {
    soma += Number(chave[k]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  return dv === Number(chave[43]);
}

export const FORMAS_PAGAMENTO: Record<string, string> = {
  "01": "Dinheiro",
  "02": "Cheque",
  "03": "Cartão de crédito",
  "04": "Cartão de débito",
  "05": "Crédito loja",
  "10": "Vale alimentação",
  "11": "Vale refeição",
  "12": "Vale presente",
  "13": "Vale combustível",
  "15": "Boleto bancário",
  "16": "Depósito bancário",
  "17": "PIX",
  "18": "Transferência / carteira digital",
  "19": "Programa de fidelidade",
  "90": "Sem pagamento",
  "99": "Outros",
};

function gtinValido(s: string) {
  const d = s.trim();
  return /^\d{8}$|^\d{12,14}$/.test(d) && !/^0+$/.test(d) ? d : "";
}

function parte(no: NoXml | null, enderTag: string): ParteNFe {
  const end = filho(no, enderTag);
  const mun = [txt(end, "xMun"), txt(end, "UF")].filter(Boolean).join("/");
  const rua = [txt(end, "xLgr"), txt(end, "nro")].filter(Boolean).join(", ");
  return {
    documento: txt(no, "CNPJ") || txt(no, "CPF"),
    nome: txt(no, "xNome"),
    fantasia: txt(no, "xFant"),
    ie: txt(no, "IE"),
    telefone: txt(end, "fone"),
    endereco: [rua, txt(end, "xBairro"), mun].filter(Boolean).join(" - "),
  };
}

// ---------------------------------------------------------------------
// Leitura da NF-e
// ---------------------------------------------------------------------
export function lerNFe(xml: string): NFe {
  if (!xml || !xml.trim()) throw new ErroNFe("Arquivo vazio.");
  const raiz = lerXml(xml);

  if (raiz.nome === "resNFe") throw new ErroNFe("Este XML é só o resumo da NF-e (resNFe). Baixe o XML completo da nota.");
  if (raiz.nome === "procEventoNFe" || raiz.nome === "evento" || raiz.nome === "envEvento") {
    throw new ErroNFe("Este XML é um evento da NF-e (cancelamento, carta de correção...), não a nota.");
  }
  if (raiz.nome === "cteProc" || raiz.nome === "CTe") throw new ErroNFe("Este XML é um CT-e (conhecimento de transporte), não uma NF-e.");

  const inf = raiz.nome === "infNFe" ? raiz : buscar(raiz, "infNFe");
  if (!inf) throw new ErroNFe("Arquivo não é uma NF-e: não encontrei o grupo infNFe.");

  const avisos: string[] = [];
  const ide = filho(inf, "ide");
  const modelo = txt(ide, "mod");
  if (modelo !== "55") {
    throw new ErroNFe(
      modelo === "65"
        ? "Este XML é de uma NFC-e (modelo 65, cupom do consumidor). Só NF-e modelo 55 pode ser importada."
        : `Modelo de documento "${modelo || "?"}" não é NF-e (55).`
    );
  }

  const prot = buscar(raiz, "infProt");
  let chave = (inf.attrs["Id"] ?? "").replace(/^NFe/, "").trim();
  if (!/^\d{44}$/.test(chave)) chave = txt(prot, "chNFe");
  if (!/^\d{44}$/.test(chave)) throw new ErroNFe("Chave de acesso da NF-e não encontrada ou inválida.");
  if (!chaveValida(chave)) avisos.push("O dígito verificador da chave de acesso não confere.");

  if (!prot) avisos.push("XML sem protocolo de autorização da SEFAZ (protNFe). Confira se a nota foi autorizada.");
  else {
    const cStat = txt(prot, "cStat");
    if (cStat && cStat !== "100" && cStat !== "150") avisos.push(`Protocolo com situação ${cStat}: ${txt(prot, "xMotivo")}`);
  }

  const emissao = txt(ide, "dhEmi") || txt(ide, "dEmi");
  if (!/^\d{4}-\d{2}-\d{2}/.test(emissao)) throw new ErroNFe("Data de emissão não encontrada na NF-e.");

  const emit = filho(inf, "emit");
  const dest = filho(inf, "dest");
  const emitente = parte(emit, "enderEmit");
  if (!emitente.documento) throw new ErroNFe("CNPJ/CPF do emitente não encontrado.");

  const tot = filho(filho(inf, "total"), "ICMSTot");
  const totais: TotaisNFe = {
    vProd: num(tot, "vProd"),
    vFrete: num(tot, "vFrete"),
    vSeg: num(tot, "vSeg"),
    vDesc: num(tot, "vDesc"),
    vIPI: num(tot, "vIPI"),
    vST: num(tot, "vST"),
    vFCPST: num(tot, "vFCPST"),
    vOutro: num(tot, "vOutro"),
    vNF: num(tot, "vNF"),
  };

  // Itens com os valores que vieram em cada um
  const dets = filhosDe(inf, "det");
  if (!dets.length) throw new ErroNFe("A NF-e não tem itens (det).");
  const brutos = dets.map((det, k) => {
    const prod = filho(det, "prod");
    const imp = filho(det, "imposto");
    const ipi = filho(imp, "IPI");
    const icms = filho(imp, "ICMS");
    return {
      nItem: Number(det.attrs["nItem"]) || k + 1,
      codigo: txt(prod, "cProd"),
      gtin: gtinValido(txt(prod, "cEAN")) || gtinValido(txt(prod, "cEANTrib")),
      descricao: txt(prod, "xProd"),
      ncm: txt(prod, "NCM"),
      cfop: txt(prod, "CFOP"),
      unidade: txt(prod, "uCom"),
      quantidade: num(prod, "qCom"),
      valorUnitario: num(prod, "vUnCom"),
      v: {
        vProd: num(prod, "vProd"),
        vFrete: num(prod, "vFrete"),
        vSeg: num(prod, "vSeg"),
        vDesc: num(prod, "vDesc"),
        vOutro: num(prod, "vOutro"),
        vIPI: numFundo(ipi, "vIPI"),
        vICMSST: numFundo(icms, "vICMSST"),
        vFCPST: numFundo(icms, "vFCPST"),
      } as ValoresItem,
      rateado: false,
    };
  });

  // Rateio do que está no total e não nos itens (diferença), proporcional ao vProd
  const pesos = brutos.map((b) => b.v.vProd);
  const campos: [keyof ValoresItem, number, string][] = [
    ["vFrete", totais.vFrete, "frete"],
    ["vSeg", totais.vSeg, "seguro"],
    ["vDesc", totais.vDesc, "desconto"],
    ["vOutro", totais.vOutro, "outras despesas"],
    ["vIPI", totais.vIPI, "IPI"],
    ["vICMSST", totais.vST, "ICMS ST"],
    ["vFCPST", totais.vFCPST, "FCP ST"],
  ];
  for (const [campo, total, rotulo] of campos) {
    const somaItens = brutos.reduce((s, b) => s + b.v[campo], 0);
    const dif = total - somaItens;
    if (Math.abs(dif) < 0.005) continue;
    if (dif < 0) {
      avisos.push(`A soma de ${rotulo} dos itens é maior que o total da nota; usei os valores dos itens.`);
      continue;
    }
    ratear(pesos, dif).forEach((r, k) => {
      brutos[k].v[campo] += r;
      if (r) brutos[k].rateado = true;
    });
    avisos.push(`${rotulo[0].toUpperCase() + rotulo.slice(1)} de ${dif.toFixed(2).replace(".", ",")} só no total da nota: rateado entre os itens pelo valor de cada um.`);
  }

  const itens: ItemNFe[] = brutos.map((b) => {
    if (!(b.quantidade > 0)) avisos.push(`Item ${b.nItem} está com quantidade zero.`);
    return {
      nItem: b.nItem,
      codigo: b.codigo,
      gtin: b.gtin,
      descricao: b.descricao,
      ncm: b.ncm,
      cfop: b.cfop,
      unidade: b.unidade,
      quantidade: b.quantidade,
      valorUnitario: b.valorUnitario,
      valorProdutos: b.v.vProd,
      frete: b.v.vFrete,
      seguro: b.v.vSeg,
      desconto: b.v.vDesc,
      outros: b.v.vOutro,
      ipi: b.v.vIPI,
      icmsSt: b.v.vICMSST,
      fcpSt: b.v.vFCPST,
      rateado: b.rateado,
      custoTotal: custoTotalItem(b.v),
      custoUnitario: custoUnitario(b.v, b.quantidade),
    };
  });

  const somaCusto = itens.reduce((s, it) => s + it.custoTotal, 0);
  if (totais.vNF && Math.abs(somaCusto - totais.vNF) > 0.05) {
    avisos.push(
      `O custo somado dos itens (${somaCusto.toFixed(2).replace(".", ",")}) difere do valor da nota (${totais.vNF.toFixed(2).replace(".", ",")}) — a nota pode ter impostos/valores que não entram no custo.`
    );
  }

  const cfops = itens.map((it) => it.cfop.slice(1));
  let entregaFutura: NFe["entregaFutura"] = null;
  if (cfops.length && cfops.every((c) => c === "922")) {
    entregaFutura = "faturamento";
    avisos.push(
      "Nota de simples faturamento (venda para entrega futura, CFOP x922): as mercadorias chegam depois com a nota de remessa. Normalmente não se dá entrada no estoque por esta nota, só no financeiro."
    );
  } else if (cfops.length && cfops.every((c) => c === "116" || c === "117")) {
    entregaFutura = "remessa";
    avisos.push(
      "Nota de remessa de entrega futura (CFOP x116/x117): a cobrança normalmente veio na nota de simples faturamento. Confira antes de lançar no contas a pagar."
    );
  }

  const cobr = filho(inf, "cobr");
  const fat = filho(cobr, "fat");
  const duplicatas: DuplicataNFe[] = filhosDe(cobr, "dup").map((d) => ({
    numero: txt(d, "nDup"),
    vencimento: txt(d, "dVenc").slice(0, 10),
    valor: num(d, "vDup"),
  }));

  const pag = filho(inf, "pag");
  const pagamentos: PagamentoNFe[] = filhosDe(pag, "detPag").map((d) => {
    const tPag = txt(d, "tPag");
    return { tPag, descricao: FORMAS_PAGAMENTO[tPag] ?? `Código ${tPag}`, valor: num(d, "vPag") };
  });
  const formaPagamento = [...new Set(pagamentos.map((p) => p.descricao))].join(", ");

  return {
    chave,
    numero: txt(ide, "nNF"),
    serie: txt(ide, "serie"),
    modelo,
    emissao,
    dataEmissao: emissao.slice(0, 10),
    natureza: txt(ide, "natOp"),
    emitente,
    destinatario: { documento: txt(dest, "CNPJ") || txt(dest, "CPF"), nome: txt(dest, "xNome") },
    totais,
    itens,
    fatura: fat
      ? { numero: txt(fat, "nFat"), valorOriginal: num(fat, "vOrig"), desconto: num(fat, "vDesc"), valorLiquido: num(fat, "vLiq") }
      : null,
    duplicatas,
    pagamentos,
    formaPagamento,
    protocolo: txt(prot, "nProt"),
    entregaFutura,
    avisos,
  };
}

// Soma de dias numa data AAAA-MM-DD (UTC, sem fuso)
export function somarDias(iso: string, dias: number) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}
