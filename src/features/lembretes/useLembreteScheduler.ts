import { useEffect } from 'react';
import { db } from '../../db/database';
import { sendNotification } from '../timer/timerUtils';
import { todayKey } from '../tarefas/taskUtils';
import { currentHHMM } from './lembreteUtils';

const CHECK_INTERVAL_MS = 60_000;

async function checkAndFireLembretes(): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const today = todayKey();
  const weekday = now.getDay();
  const hhmm = currentHHMM(now);

  // Everything below runs in one transaction so a concurrent/overlapping
  // call (e.g. React StrictMode's double-invoked effect) never reads the
  // same "not fired yet today" state twice and double-fires.
  await db.transaction('rw', db.lembretes, db.tasks, async () => {
    const lembretes = await db.lembretes.toArray();
    const ativos = lembretes.filter((l) => l.ativo);

    for (const lembrete of ativos) {
      if (!lembrete.id) continue;
      if (lembrete.ultimoDisparoData === today) continue; // already handled today
      if (!lembrete.diasSemana.includes(weekday)) continue; // not scheduled today
      if (hhmm < lembrete.horario) continue; // not due yet

      // Mark handled first, still inside the transaction, before doing
      // anything else — this is what makes the dedup race-safe.
      await db.lembretes.update(lembrete.id, { ultimoDisparoData: today });

      if (lembrete.tipo === 'tarefas-pendentes') {
        const pendentes = await db.tasks
          .where('date')
          .equals(today)
          .and((t) => t.status === 'pending')
          .count();
        if (pendentes > 0) {
          sendNotification(
            'Tarefas pendentes 📋',
            `Você tem ${pendentes} tarefa${pendentes > 1 ? 's' : ''} pendente${pendentes > 1 ? 's' : ''} hoje.`,
            `lembrete-${lembrete.id}`,
          );
        }
      } else {
        sendNotification(
          lembrete.titulo?.trim() || 'Hora de estudar! 📚',
          'Toque para abrir o CSA Study Timer.',
          `lembrete-${lembrete.id}`,
        );
      }
    }
  });
}

/**
 * Best-effort reminder scheduler: checks immediately on mount, then every
 * 60s while this tab stays open (foreground or background). There is no
 * reliable way to fire a local notification once the app/tab is fully
 * closed without a push server, so this covers "app open somewhere" +
 * a catch-up check on the next time it's opened — not truly closed-app
 * background delivery.
 */
export function useLembreteScheduler(): void {
  useEffect(() => {
    checkAndFireLembretes();
    const interval = setInterval(checkAndFireLembretes, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
}
