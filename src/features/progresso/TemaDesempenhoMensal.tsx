import { useLiveQuery } from 'dexie-react-hooks';
import { Minus, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { getDesempenhoPorTemaComparativoMensal, type TemaComparativoMensal } from './progressoData';

function monthLabel(monthsAgo: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const label = d.toLocaleDateString('pt-BR', { month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function TemaDesempenhoMensal() {
  const dados = useLiveQuery(() => getDesempenhoPorTemaComparativoMensal(), []);
  const mesAtual = monthLabel(0);
  const mesAnterior = monthLabel(1);

  return (
    <div className="progresso-card">
      <h2 className="progresso-card-title">Comparação mensal por tema</h2>
      <p className="progresso-card-subtitle">
        {mesAtual} vs {mesAnterior} — refaça um tema no Banco de Questões e veja se melhorou
      </p>

      {!dados || dados.length === 0 ? (
        <p className="progresso-empty">
          Nenhuma prática registrada este mês ou no mês passado ainda.
        </p>
      ) : (
        <>
          <div className="dumbbell-legend">
            <span className="dumbbell-legend-item">
              <span className="dumbbell-legend-dot dumbbell-legend-dot--previous" /> {mesAnterior}
            </span>
            <span className="dumbbell-legend-item">
              <span className="dumbbell-legend-dot dumbbell-legend-dot--current" /> {mesAtual}
            </span>
          </div>

          <div className="dumbbell-list">
            {dados.map((item) => (
              <DumbbellRow key={item.tema} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DumbbellRow({ item }: { item: TemaComparativoMensal }) {
  const { tema, percentAtual, percentAnterior } = item;

  let trendIcon = <Minus size={12} />;
  let trendLabel = 'igual';
  let trendClass = 'dumbbell-trend--neutral';

  if (percentAtual === null) {
    trendLabel = 'sem prática este mês';
  } else if (percentAnterior === null) {
    trendIcon = <Sparkles size={12} />;
    trendLabel = 'novo este mês';
  } else {
    const delta = percentAtual - percentAnterior;
    if (delta > 0) {
      trendIcon = <TrendingUp size={12} />;
      trendLabel = `+${delta}pp`;
      trendClass = 'dumbbell-trend--up';
    } else if (delta < 0) {
      trendIcon = <TrendingDown size={12} />;
      trendLabel = `${delta}pp`;
      trendClass = 'dumbbell-trend--down';
    }
  }

  const left = Math.min(percentAtual ?? 100, percentAnterior ?? 100);
  const right = Math.max(percentAtual ?? 0, percentAnterior ?? 0);
  const hasBoth = percentAtual !== null && percentAnterior !== null;

  return (
    <div className="dumbbell-row">
      <div className="dumbbell-row-header">
        <span className="dumbbell-tema-name">{tema}</span>
        <span className={`dumbbell-trend ${trendClass}`}>
          {trendIcon} {trendLabel}
        </span>
      </div>

      <div className="dumbbell-track">
        {hasBoth && (
          <div className="dumbbell-connector" style={{ left: `${left}%`, width: `${right - left}%` }} />
        )}
        {percentAnterior !== null && (
          <div className="dumbbell-dot dumbbell-dot--previous" style={{ left: `${percentAnterior}%` }} />
        )}
        {percentAtual !== null && (
          <div className="dumbbell-dot dumbbell-dot--current" style={{ left: `${percentAtual}%` }} />
        )}
      </div>

      <div className="dumbbell-values">
        <span>Mês passado: {percentAnterior !== null ? `${percentAnterior}%` : '—'}</span>
        <span>Este mês: {percentAtual !== null ? `${percentAtual}%` : '—'}</span>
      </div>
    </div>
  );
}
