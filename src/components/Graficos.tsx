// Gráficos simples em HTML/CSS (sem biblioteca): barras horizontais e colunas, uma série cada
export interface Ponto {
  rotulo: string;
  valor: number;
  href?: string;
}

export function Barras({ dados, formatar = String }: { dados: Ponto[]; formatar?: (v: number) => string }) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  if (!dados.length) return <p className="muted small">Sem dados.</p>;
  return (
    <div className="bars">
      {dados.map((d) => (
        <div className="bar-row" key={d.rotulo} title={`${d.rotulo}: ${formatar(d.valor)}`}>
          <span className="rotulo">{d.href ? <a href={d.href}>{d.rotulo}</a> : d.rotulo}</span>
          <div className="trilho"><div className="barra" style={{ width: `${(d.valor / max) * 100}%` }} /></div>
          <span className="val">{formatar(d.valor)}</span>
        </div>
      ))}
    </div>
  );
}

export function Colunas({ dados, formatar = String }: { dados: Ponto[]; formatar?: (v: number) => string }) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  if (!dados.length) return <p className="muted small">Sem dados.</p>;
  return (
    <>
      <div className="colunas">
        {dados.map((d) => (
          <div className="coluna" key={d.rotulo} title={`${d.rotulo}: ${formatar(d.valor)}`}>
            <span>{formatar(d.valor)}</span>
            <div className="barra" style={{ height: `${(d.valor / max) * 85}%` }} />
          </div>
        ))}
      </div>
      <div className="colunas-rotulos">
        {dados.map((d) => <span key={d.rotulo}>{d.rotulo}</span>)}
      </div>
    </>
  );
}

// Colunas lado a lado, várias séries por rótulo (ex.: recebido × pago por mês)
export interface Serie {
  nome: string;
  cor: string;
}

export function ColunasAgrupadas({
  dados,
  series,
  formatar = String,
}: {
  dados: { rotulo: string; valores: number[] }[];
  series: Serie[];
  formatar?: (v: number) => string;
}) {
  const max = Math.max(1, ...dados.flatMap((d) => d.valores));
  if (!dados.length) return <p className="muted small">Sem dados.</p>;
  return (
    <>
      <div className="grupos-legenda">
        {series.map((s) => <span key={s.nome}><i style={{ background: s.cor }} />{s.nome}</span>)}
      </div>
      <div className="colunas grupos">
        {dados.map((d) => (
          <div className="grupo" key={d.rotulo}>
            {series.map((s, k) => (
              <div className="coluna" key={s.nome} title={`${d.rotulo} · ${s.nome}: ${formatar(d.valores[k] ?? 0)}`}>
                <div className="barra" style={{ height: `${((d.valores[k] ?? 0) / max) * 92}%`, background: s.cor }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="colunas-rotulos">
        {dados.map((d) => <span key={d.rotulo}>{d.rotulo}</span>)}
      </div>
    </>
  );
}
