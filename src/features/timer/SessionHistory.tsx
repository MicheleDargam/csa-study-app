import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { getStartOfToday, formatDuration, formatHourMinute } from './timerUtils';
import { Clock, BookOpen } from 'lucide-react';

export function SessionHistory() {
  const todayStart = getStartOfToday();

  const sessions = useLiveQuery(
    () =>
      db.sessions
        .where('startedAt')
        .aboveOrEqual(todayStart)
        .reverse()
        .toArray(),
    [],
  );

  const studySessions = sessions?.filter((s) => s.type === 'study') ?? [];
  const totalStudySeconds = studySessions.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="session-history">
      <div className="history-header">
        <h3 className="history-title">
          <Clock size={18} />
          Hoje
        </h3>
        {studySessions.length > 0 && (
          <span className="history-total">
            {formatDuration(totalStudySeconds)} de estudo
          </span>
        )}
      </div>

      {(!sessions || sessions.length === 0) ? (
        <div className="history-empty">
          <BookOpen size={32} className="history-empty-icon" />
          <p>Nenhuma sessão hoje ainda.</p>
          <p className="history-empty-sub">Comece um ciclo de estudo!</p>
        </div>
      ) : (
        <div className="history-list">
          {sessions
            .filter((s) => s.type === 'study')
            .map((session) => (
              <div key={session.id} className="history-item">
                <div
                  className="history-item-color"
                  style={{ backgroundColor: session.subjectColor }}
                />
                <div className="history-item-info">
                  <span className="history-item-subject">
                    {session.subjectName}
                  </span>
                  <span className="history-item-time">
                    {formatHourMinute(session.startedAt)} —{' '}
                    {formatHourMinute(session.completedAt)}
                    {session.taskTitle && ` · ${session.taskTitle}`}
                  </span>
                </div>
                <span className="history-item-duration">
                  {formatDuration(session.duration)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
