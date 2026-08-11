import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bell, CheckSquare, Layers, Plus } from 'lucide-react';
import { db } from '../../db/database';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { todayKey, toDateKey, getCurrentWeekDates, formatWeekdayLabel, formatDayMonth } from './taskUtils';
import type { Task } from '../../types';

type View = 'hoje' | 'semana';

export function TarefasPage() {
  const [view, setView] = useState<View>('hoje');
  const [showForm, setShowForm] = useState(false);

  const materias = useLiveQuery(() => db.subjects.toArray(), []);
  const subjectMap = useMemo(
    () => new Map((materias ?? []).map((s) => [s.id, s])),
    [materias],
  );

  const today = todayKey();
  const todayTasks = useLiveQuery(
    () => db.tasks.where('date').equals(today).toArray(),
    [today],
  );

  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const weekStart = toDateKey(weekDates[0]);
  const weekEnd = toDateKey(weekDates[6]);
  const weekTasks = useLiveQuery(
    () => db.tasks.where('date').between(weekStart, weekEnd, true, true).toArray(),
    [weekStart, weekEnd],
  );

  const groupedToday = useMemo(() => {
    const map = new Map<number, Task[]>();
    for (const t of todayTasks ?? []) {
      const arr = map.get(t.subjectId) ?? [];
      arr.push(t);
      map.set(t.subjectId, arr);
    }
    return map;
  }, [todayTasks]);

  return (
    <div className="tarefas-page">
      <div className="timer-page-header">
        <div>
          <h1 className="timer-page-title">Tarefas</h1>
          <p className="timer-page-subtitle">Organize seus estudos para a CSA</p>
        </div>
        <div className="header-actions">
          <Link to="lembretes" className="timer-btn-icon" title="Lembretes">
            <Bell size={20} />
          </Link>
          <Link to="materias" className="timer-btn-icon" title="Gerenciar matérias">
            <Layers size={20} />
          </Link>
        </div>
      </div>

      <div className="segmented-control">
        <button
          className={`segmented-btn ${view === 'hoje' ? 'segmented-btn--active' : ''}`}
          onClick={() => setView('hoje')}
        >
          Hoje
        </button>
        <button
          className={`segmented-btn ${view === 'semana' ? 'segmented-btn--active' : ''}`}
          onClick={() => setView('semana')}
        >
          Semana
        </button>
      </div>

      {view === 'hoje' ? (
        <div className="tarefas-list-wrapper">
          {!todayTasks || todayTasks.length === 0 ? (
            <div className="history-empty">
              <CheckSquare size={32} className="history-empty-icon" />
              <p>Nenhuma tarefa para hoje.</p>
              <p className="history-empty-sub">Toque em + para adicionar.</p>
            </div>
          ) : (
            Array.from(groupedToday.entries()).map(([subjectId, items]) => {
              const subject = subjectMap.get(subjectId);
              return (
                <div key={subjectId} className="task-group">
                  <div className="task-group-header">
                    <span
                      className="task-group-dot"
                      style={{ backgroundColor: subject?.color ?? '#6366f1' }}
                    />
                    <span className="task-group-title">{subject?.name ?? 'Matéria removida'}</span>
                  </div>
                  {items.map((task) => (
                    <TaskItem key={task.id} task={task} subject={subject} />
                  ))}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="tarefas-list-wrapper">
          {weekDates.map((d) => {
            const key = toDateKey(d);
            const items = (weekTasks ?? []).filter((t) => t.date === key);
            const isToday = key === today;
            return (
              <div key={key} className="task-day-group">
                <div className="task-day-header">
                  <span className={`task-day-weekday ${isToday ? 'task-day-weekday--today' : ''}`}>
                    {formatWeekdayLabel(d)}
                  </span>
                  <span className="task-day-date">{formatDayMonth(d)}</span>
                </div>
                {items.length === 0 ? (
                  <p className="task-day-empty">Nenhuma tarefa</p>
                ) : (
                  items.map((task) => (
                    <TaskItem key={task.id} task={task} subject={subjectMap.get(task.subjectId)} />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      <button className="fab-add" onClick={() => setShowForm(true)} title="Nova tarefa">
        <Plus size={24} />
      </button>

      {showForm && (
        <TaskForm onClose={() => setShowForm(false)} defaultDate={view === 'hoje' ? today : undefined} />
      )}
    </div>
  );
}
