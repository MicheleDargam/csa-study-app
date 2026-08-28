import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, History } from 'lucide-react';
import { db } from '../../db/database';
import { formatDuration } from '../timer/timerUtils';
import { formatAttemptDate, formatPercent } from '../simulados/simuladoUtils';

/** Same layout as HistoricoPraticaPage, reading from praticasPrepper. */
export function HistoricoPraticaPrepperPage() {
  const navigate = useNavigate();
  const praticas = useLiveQuery(
    () => db.praticasPrepper.orderBy('completedAt').reverse().toArray(),
    [],
  );

  return (
    <div className="materias-page">
      <div className="timer-page-header">
        <div className="materias-page-heading">
          <button className="timer-btn-icon" onClick={() => navigate('/exame-prepper/questoes')} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="timer-page-title">Histórico de Prática</h1>
        </div>
      </div>

      {praticas?.length === 0 ? (
        <div className="history-empty">
          <History size={32} className="history-empty-icon" />
          <p>Nenhuma sessão de prática ainda.</p>
          <p className="history-empty-sub">Pratique um domínio nas Questões Prepper para ver seu histórico aqui.</p>
        </div>
      ) : (
        <div className="materias-list">
          {praticas?.map((pratica) => (
            <button
              key={pratica.id}
              className="tentativa-row"
              onClick={() => navigate(`/exame-prepper/questoes/resultado/${pratica.id}`)}
            >
              <div className="tentativa-row-info">
                <span className="materia-row-name">{pratica.tema}</span>
                <span className="tentativa-row-meta">
                  {formatAttemptDate(pratica.completedAt)} · {formatDuration(pratica.duracaoSegundos)} ·{' '}
                  {pratica.modo === 'todas' ? 'todas as questões' : `${pratica.total} sorteadas`}
                </span>
              </div>
              <span className="tentativa-row-score">
                {pratica.acertos}/{pratica.total}
                <span className="tentativa-row-percent">{formatPercent(pratica.acertos, pratica.total)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
