import type { Task } from '../../types';

interface TaskCompletePromptProps {
  task: Task;
  onConfirm: () => void;
  onDismiss: () => void;
}

/** Shown right after a study cycle linked to a task finishes. */
export function TaskCompletePrompt({ task, onConfirm, onDismiss }: TaskCompletePromptProps) {
  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Ciclo concluído! 🎉</h2>
        </div>

        <p className="confirm-message">
          Marcar "<strong>{task.title}</strong>" como concluída?
        </p>

        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onDismiss}>
            Agora não
          </button>
          <button className="btn-primary" onClick={onConfirm}>
            Concluir tarefa
          </button>
        </div>
      </div>
    </div>
  );
}
