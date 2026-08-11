import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { todayKey } from './taskUtils';
import type { Task } from '../../types';

interface TaskPickerProps {
  subjectId?: number;
  selected: Task | null;
  onSelect: (task: Task | null) => void;
  disabled?: boolean;
}

/**
 * Optional linker shown on the Timer page: lets you attach the running
 * study cycle to one of today's pending tasks for the selected subject.
 * Renders nothing if there's no subject selected or no pending tasks today.
 */
export function TaskPicker({ subjectId, selected, onSelect, disabled }: TaskPickerProps) {
  const today = todayKey();

  const tasks = useLiveQuery(async () => {
    if (!subjectId) return [];
    const todaysTasks = await db.tasks.where({ subjectId, date: today }).toArray();
    return todaysTasks.filter((t) => t.status === 'pending');
  }, [subjectId, today]);

  if (!subjectId || !tasks || tasks.length === 0) return null;

  return (
    <div className="subject-picker">
      <label className="subject-picker-label">Tarefa de hoje (opcional)</label>
      <div className="subject-chips">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            className={`subject-chip ${selected?.id === task.id ? 'subject-chip--selected' : ''}`}
            onClick={() => onSelect(selected?.id === task.id ? null : task)}
            disabled={disabled}
          >
            {task.title}
          </button>
        ))}
      </div>
    </div>
  );
}
