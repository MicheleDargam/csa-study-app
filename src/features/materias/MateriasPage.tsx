import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { db, deleteSubjectCascade } from '../../db/database';
import { MateriaForm } from './MateriaForm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Subject } from '../../types';

export function MateriasPage() {
  const navigate = useNavigate();
  const materias = useLiveQuery(() => db.subjects.toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const lembretes = useLiveQuery(() => db.lembretes.toArray(), []);

  const [formTarget, setFormTarget] = useState<'new' | Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  const pendingCountFor = (subjectId?: number) =>
    tasks?.filter((t) => t.subjectId === subjectId && t.status === 'pending').length ?? 0;

  const lembretesCountFor = (subjectId?: number) =>
    lembretes?.filter((l) => l.subjectId === subjectId).length ?? 0;

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await deleteSubjectCascade(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="materias-page">
      <div className="timer-page-header">
        <div className="materias-page-heading">
          <button
            className="timer-btn-icon"
            onClick={() => navigate('/tarefas')}
            title="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="timer-page-title">Matérias</h1>
        </div>
        <button
          className="timer-btn-icon"
          onClick={() => setFormTarget('new')}
          title="Nova matéria"
        >
          <Plus size={20} />
        </button>
      </div>

      {materias?.length === 0 ? (
        <div className="history-empty">
          <Layers size={32} className="history-empty-icon" />
          <p>Nenhuma matéria cadastrada.</p>
          <p className="history-empty-sub">Toque em + para criar a primeira.</p>
        </div>
      ) : (
        <div className="materias-list">
          {materias?.map((materia) => {
            const pending = pendingCountFor(materia.id);
            return (
              <div key={materia.id} className="materia-row">
                <span className="materia-row-dot" style={{ backgroundColor: materia.color }} />
                <div className="materia-row-info">
                  <span className="materia-row-name">{materia.name}</span>
                  {pending > 0 && (
                    <span className="materia-row-count">
                      {pending} tarefa{pending > 1 ? 's' : ''} pendente{pending > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button
                  className="materia-row-action"
                  onClick={() => setFormTarget(materia)}
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="materia-row-action materia-row-action--danger"
                  onClick={() => setDeleteTarget(materia)}
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {formTarget && (
        <MateriaForm
          materia={formTarget === 'new' ? undefined : formTarget}
          onClose={() => setFormTarget(null)}
        />
      )}

      {deleteTarget && (() => {
        const pending = pendingCountFor(deleteTarget.id);
        const lembretesLigados = lembretesCountFor(deleteTarget.id);
        const avisos: string[] = [];
        if (pending > 0) {
          avisos.push(`${pending} tarefa(s) pendente(s) — elas também serão excluídas`);
        }
        if (lembretesLigados > 0) {
          avisos.push(`${lembretesLigados} lembrete(s) vinculado(s) — eles continuam ativos, só perdem a matéria`);
        }
        const detalhe = avisos.length > 0 ? `"${deleteTarget.name}" tem ${avisos.join(' e ')}. ` : '';
        return (
          <ConfirmDialog
            title="Excluir matéria"
            message={`${detalhe}As sessões de estudo já registradas no histórico permanecem intactas. Deseja continuar?`}
            confirmLabel="Excluir"
            danger
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        );
      })()}
    </div>
  );
}
