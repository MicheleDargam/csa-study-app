import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, ArrowLeft, Bell, BellOff, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { db } from '../../db/database';
import { requestNotificationPermission } from '../timer/timerUtils';
import { formatDiasSemana, jaPassouHojeNoHorario } from './lembreteUtils';
import { todayKey } from '../tarefas/taskUtils';
import { LembreteForm } from './LembreteForm';
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Lembrete } from '../../types';

export function LembretesPage() {
  const navigate = useNavigate();
  const lembretes = useLiveQuery(() => db.lembretes.toArray(), []);
  const materias = useLiveQuery(() => db.subjects.toArray(), []);

  const [formTarget, setFormTarget] = useState<'new' | Lembrete | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lembrete | null>(null);
  const [pendingActivation, setPendingActivation] = useState<Lembrete | null>(null);

  const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;
  const permission = notificationsSupported ? Notification.permission : 'unsupported';
  const temAtivos = (lembretes ?? []).some((l) => l.ativo);

  const subjectMap = new Map((materias ?? []).map((m) => [m.id, m]));

  const ativarLembrete = async (lembrete: Lembrete) => {
    const updates: Partial<Lembrete> = { ativo: true };
    // Don't fire immediately just because today's slot already passed —
    // start counting from the next scheduled occurrence.
    if (jaPassouHojeNoHorario(lembrete.diasSemana, lembrete.horario)) {
      updates.ultimoDisparoData = todayKey();
    }
    await db.lembretes.update(lembrete.id!, updates);
  };

  const handleToggleAtivo = async (lembrete: Lembrete) => {
    if (lembrete.ativo) {
      await db.lembretes.update(lembrete.id!, { ativo: false });
      return;
    }
    if (permission === 'default') {
      setPendingActivation(lembrete);
      return;
    }
    await ativarLembrete(lembrete);
  };

  const handleAllowPermission = async () => {
    if (!pendingActivation) return;
    await requestNotificationPermission();
    await ativarLembrete(pendingActivation);
    setPendingActivation(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await db.lembretes.delete(deleteTarget.id);
    setDeleteTarget(null);
  };

  const lembreteLabel = (lembrete: Lembrete): string => {
    if (lembrete.tipo === 'tarefas-pendentes') return 'Tarefas pendentes do dia';
    if (lembrete.titulo?.trim()) return lembrete.titulo.trim();
    if (lembrete.subjectId) return subjectMap.get(lembrete.subjectId)?.name ?? 'Lembrete de estudo';
    return 'Lembrete de estudo';
  };

  const sorted = [...(lembretes ?? [])].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === 'tarefas-pendentes' ? -1 : 1;
    return a.horario.localeCompare(b.horario);
  });

  return (
    <div className="materias-page">
      <div className="timer-page-header">
        <div className="materias-page-heading">
          <button className="timer-btn-icon" onClick={() => navigate('/tarefas')} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="timer-page-title">Lembretes</h1>
        </div>
        <button className="timer-btn-icon" onClick={() => setFormTarget('new')} title="Novo lembrete">
          <Plus size={20} />
        </button>
      </div>

      {permission === 'denied' && temAtivos && (
        <div className="lembrete-warning-banner">
          <AlertTriangle size={16} />
          <span>
            As notificações estão bloqueadas no navegador. Ative manualmente nas configurações do
            site para os lembretes funcionarem.
          </span>
        </div>
      )}
      {permission === 'unsupported' && temAtivos && (
        <div className="lembrete-warning-banner">
          <AlertTriangle size={16} />
          <span>Este navegador não tem suporte a notificações — os lembretes não vão disparar aqui.</span>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="history-empty">
          <Bell size={32} className="history-empty-icon" />
          <p>Nenhum lembrete cadastrado.</p>
          <p className="history-empty-sub">Toque em + para criar o primeiro.</p>
        </div>
      ) : (
        <div className="materias-list">
          {sorted.map((lembrete) => {
            const materia = lembrete.subjectId ? subjectMap.get(lembrete.subjectId) : undefined;
            return (
              <div key={lembrete.id} className={`lembrete-row ${!lembrete.ativo ? 'lembrete-row--paused' : ''}`}>
                <div className="lembrete-row-icon">
                  {lembrete.tipo === 'tarefas-pendentes' ? <ListChecks size={18} /> : <Bell size={18} />}
                </div>
                <div className="materia-row-info">
                  <span className="materia-row-name">{lembreteLabel(lembrete)}</span>
                  <span className="lembrete-row-meta">
                    {lembrete.horario} · {formatDiasSemana(lembrete.diasSemana)}
                    {materia && (
                      <>
                        {' · '}
                        <span className="task-item-dot" style={{ backgroundColor: materia.color }} />
                        {materia.name}
                      </>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  className={`toggle-switch ${lembrete.ativo ? 'toggle-switch--on' : ''}`}
                  onClick={() => handleToggleAtivo(lembrete)}
                  title={lembrete.ativo ? 'Pausar' : 'Ativar'}
                >
                  <span className="toggle-switch-knob" />
                </button>
                <button className="materia-row-action" onClick={() => setFormTarget(lembrete)} title="Editar">
                  <Pencil size={16} />
                </button>
                {lembrete.tipo !== 'tarefas-pendentes' && (
                  <button
                    className="materia-row-action materia-row-action--danger"
                    onClick={() => setDeleteTarget(lembrete)}
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="lembrete-disclaimer">
        <BellOff size={13} /> Lembretes disparam enquanto o app estiver aberto em alguma aba
        (mesmo em segundo plano) — não há garantia de disparo com o app totalmente fechado.
      </p>

      {formTarget && (
        <LembreteForm lembrete={formTarget === 'new' ? undefined : formTarget} onClose={() => setFormTarget(null)} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir lembrete"
          message={`Deseja excluir o lembrete "${lembreteLabel(deleteTarget)}"?`}
          confirmLabel="Excluir"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {pendingActivation && (
        <NotificationPermissionPrompt onAllow={handleAllowPermission} onDismiss={() => setPendingActivation(null)} />
      )}
    </div>
  );
}
