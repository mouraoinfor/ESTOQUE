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
