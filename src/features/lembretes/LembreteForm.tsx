import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X } from 'lucide-react';
import { db } from '../../db/database';
import { TODOS_OS_DIAS } from './lembreteUtils';
import { WEEKDAY_LABELS } from '../tarefas/taskUtils';
import type { Lembrete } from '../../types';

interface LembreteFormProps {
  onClose: () => void;
  /** Present when editing; absent when creating a new 'horario' reminder. */
  lembrete?: Lembrete;
}

export function LembreteForm({ onClose, lembrete }: LembreteFormProps) {
  const isEditing = !!lembrete;
  const isTarefasPendentes = lembrete?.tipo === 'tarefas-pendentes';

  const materias = useLiveQuery(() => db.subjects.toArray(), []);

  const [titulo, setTitulo] = useState(lembrete?.titulo ?? '');
  const [horario, setHorario] = useState(lembrete?.horario ?? '19:00');
  const [diasSemana, setDiasSemana] = useState<number[]>(lembrete?.diasSemana ?? TODOS_OS_DIAS);
  const [subjectId, setSubjectId] = useState<number | undefined>(lembrete?.subjectId);

  const toggleDia = (dia: number) => {
    setDiasSemana((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (diasSemana.length === 0) return;

    if (isEditing && lembrete.id) {
      await db.lembretes.update(lembrete.id, {
        horario,
        diasSemana,
        ...(isTarefasPendentes ? {} : { titulo: titulo.trim() || undefined, subjectId }),
      });
    } else {
      await db.lembretes.add({
        tipo: 'horario',
        titulo: titulo.trim() || undefined,
        horario,
        diasSemana,
        subjectId,
        ativo: true,
        createdAt: new Date(),
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isTarefasPendentes ? 'Tarefas pendentes do dia' : isEditing ? 'Editar Lembrete' : 'Novo Lembrete'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="subject-form">
          {!isTarefasPendentes && (
            <div className="form-field">
              <label className="form-label" htmlFor="lembrete-titulo">
                Título (opcional)
              </label>
              <input
                id="lembrete-titulo"
                type="text"
                className="form-input"
                placeholder="Ex: Bloco de manhã"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={60}
              />
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="lembrete-horario">
              Horário
            </label>
            <input
              id="lembrete-horario"
              type="time"
              className="form-input"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Dias</label>
            <div className="subject-chips">
              <button
                type="button"
                className={`subject-chip ${diasSemana.length === 7 ? 'subject-chip--selected' : ''}`}
                onClick={() => setDiasSemana(TODOS_OS_DIAS)}
              >
                Todo dia
              </button>
            </div>
            <div className="weekday-picker">
              {WEEKDAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  className={`weekday-chip ${diasSemana.includes(i) ? 'weekday-chip--selected' : ''}`}
                  onClick={() => toggleDia(i)}
                >
                  {label}
                </button>
              ))}
            </div>
            {diasSemana.length === 0 && <p className="form-hint">Selecione pelo menos um dia.</p>}
          </div>

          {!isTarefasPendentes && (
            <div className="form-field">
              <label className="form-label">Matéria (opcional)</label>
              <div className="subject-chips lembrete-materia-chips">
                <button
                  type="button"
                  className={`subject-chip ${subjectId === undefined ? 'subject-chip--selected' : ''}`}
                  onClick={() => setSubjectId(undefined)}
                >
                  Sem matéria
                </button>
                {materias?.map((materia) => (
                  <button
                    key={materia.id}
                    type="button"
                    className={`subject-chip ${subjectId === materia.id ? 'subject-chip--selected' : ''}`}
                    style={
                      subjectId === materia.id
                        ? { backgroundColor: `${materia.color}25`, borderColor: materia.color, color: materia.color }
                        : {}
                    }
                    onClick={() => setSubjectId(materia.id)}
                  >
                    <span className="subject-chip-dot" style={{ backgroundColor: materia.color }} />
                    {materia.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={diasSemana.length === 0}>
            {isEditing ? 'Salvar Alterações' : 'Criar Lembrete'}
          </button>
        </form>
      </div>
    </div>
  );
}
