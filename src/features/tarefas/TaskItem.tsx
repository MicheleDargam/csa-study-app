import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { toggleTaskStatus, deleteTask, formatDayMonth, parseDateKey } from './taskUtils';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Subject, Task } from '../../types';

interface TaskItemProps {
  task: Task;
  subject?: Subject;
  showDate?: boolean;
}

export function TaskItem({ task, subject, showDate }: TaskItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
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

      <button
        type="button"
        className="task-item-delete"
        onClick={() => setConfirmDelete(true)}
        title="Excluir tarefa"
      >
        <Trash2 size={16} />
      </button>

      {confirmDelete && (
        <ConfirmDialog
          title="Excluir tarefa"
          message={`Deseja excluir a tarefa "${task.title}"?`}
          confirmLabel="Excluir"
          danger
          onConfirm={() => {
            if (task.id) void deleteTask(task.id);
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
