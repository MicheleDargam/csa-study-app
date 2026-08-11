import { Check } from 'lucide-react';
import { toggleTaskStatus, formatDayMonth, parseDateKey } from './taskUtils';
import type { Subject, Task } from '../../types';

interface TaskItemProps {
  task: Task;
  subject?: Subject;
  showDate?: boolean;
}

export function TaskItem({ task, subject, showDate }: TaskItemProps) {
  const isDone = task.status === 'done';
  const color = subject?.color ?? '#6366f1';

  return (
    <div className={`task-item ${isDone ? 'task-item--done' : ''}`}>
      <button
        type="button"
        className={`task-checkbox ${isDone ? 'task-checkbox--checked' : ''}`}
        style={isDone ? { backgroundColor: color, borderColor: color } : {}}
        onClick={() => toggleTaskStatus(task)}
        title={isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
      >
        {isDone && <Check size={14} />}
      </button>

      <div className="task-item-info">
        <span className="task-item-title">{task.title}</span>
        <span className="task-item-meta">
          {subject && (
            <>
              <span className="task-item-dot" style={{ backgroundColor: subject.color }} />
              {subject.name}
            </>
          )}
          {showDate && (
            <span className="task-item-date">{formatDayMonth(parseDateKey(task.date))}</span>
          )}
        </span>
      </div>
    </div>
  );
}
