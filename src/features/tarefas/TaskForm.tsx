import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X } from 'lucide-react';
import { db } from '../../db/database';
import { todayKey } from './taskUtils';

interface TaskFormProps {
  onClose: () => void;
  defaultDate?: string;
}

export function TaskForm({ onClose, defaultDate }: TaskFormProps) {
  const materias = useLiveQuery(() => db.subjects.toArray(), []);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [date, setDate] = useState(defaultDate ?? todayKey());

  // Default to the first subject once the list loads
  useEffect(() => {
    if (subjectId === null && materias && materias.length > 0) {
      setSubjectId(materias[0].id ?? null);
    }
  }, [materias, subjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !subjectId) return;

    await db.tasks.add({
      title: trimmed,
      subjectId,
      date,
      status: 'pending',
      createdAt: new Date(),
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nova Tarefa</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="subject-form">
          <div className="form-field">
            <label className="form-label" htmlFor="task-title">
              Título
            </label>
            <input
              id="task-title"
              type="text"
              className="form-input"
              placeholder="Ex: Revisar módulo de Flow Designer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              maxLength={120}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Matéria</label>
            {materias?.length === 0 ? (
              <p className="form-hint">Crie uma matéria primeiro.</p>
            ) : (
              <div className="subject-chips">
                {materias?.map((materia) => (
                  <button
                    key={materia.id}
                    type="button"
                    className={`subject-chip ${
                      subjectId === materia.id ? 'subject-chip--selected' : ''
                    }`}
                    style={
                      subjectId === materia.id
                        ? {
                            backgroundColor: `${materia.color}25`,
                            borderColor: materia.color,
                            color: materia.color,
                          }
                        : {}
                    }
                    onClick={() => setSubjectId(materia.id ?? null)}
                  >
                    <span
                      className="subject-chip-dot"
                      style={{ backgroundColor: materia.color }}
                    />
                    {materia.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="task-date">
              Data
            </label>
            <input
              id="task-date"
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!title.trim() || !subjectId}
          >
            Criar Tarefa
          </button>
        </form>
      </div>
    </div>
  );
}
