import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, History } from 'lucide-react';
import { db } from '../../db/database';
import { formatDuration } from '../timer/timerUtils';
import { formatAttemptDate, formatPercent } from '../simulados/simuladoUtils';

/** Same layout as HistoricoPage, reading from tentativasPrepper. */
export function HistoricoPrepperPage() {
  const navigate = useNavigate();
  const tentativas = useLiveQuery(
    () => db.tentativasPrepper.orderBy('completedAt').reverse().toArray(),
    [],
  );

  return (
    <div className="materias-page">
      <div className="timer-page-header">
        <div className="materias-page-heading">
          <button className="timer-btn-icon" onClick={() => navigate('/exame-prepper')} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="timer-page-title">Histórico</h1>
        </div>
      </div>

      {tentativas?.length === 0 ? (
        <div className="history-empty">
          <History size={32} className="history-empty-icon" />
          <p>Nenhuma tentativa registrada ainda.</p>
          <p className="history-empty-sub">Faça um Simulado Prepper para ver seu histórico aqui.</p>
        </div>
      ) : (
        <div className="materias-list">
          {tentativas?.map((tentativa) => (
            <button
              key={tentativa.id}
              className="tentativa-row"
              onClick={() => navigate(`/exame-prepper/resultado/${tentativa.id}`)}
            >
              <div className="tentativa-row-info">
                <span className="materia-row-name">{tentativa.simuladoNome}</span>
                <span className="tentativa-row-meta">
                  {formatAttemptDate(tentativa.completedAt)} · {formatDuration(tentativa.duracaoSegundos)}
                </span>
              </div>
              <span className="tentativa-row-score">
                {tentativa.acertos}/{tentativa.total}
                <span className="tentativa-row-percent">{formatPercent(tentativa.acertos, tentativa.total)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
