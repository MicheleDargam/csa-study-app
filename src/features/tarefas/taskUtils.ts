import { db } from '../../db/database';
import type { Task } from '../../types';

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Local date key in YYYY-MM-DD, used to group/filter tasks by day without
 * timezone drift (avoid using UTC-based Date math for this).
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Parse a YYYY-MM-DD key back into a local Date at midnight. */
export function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

/** Monday-to-Sunday dates for the current week. */
export function getCurrentWeekDates(): Date[] {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function formatWeekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()];
}

export function formatDayMonth(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export async function toggleTaskStatus(task: Task): Promise<void> {
  if (!task.id) return;
  if (task.status === 'pending') {
    await db.tasks.update(task.id, { status: 'done', completedAt: new Date() });
  } else {
    await db.tasks.update(task.id, { status: 'pending' });
  }
}

export async function completeTask(taskId: number): Promise<void> {
  await db.tasks.update(taskId, { status: 'done', completedAt: new Date() });
}
