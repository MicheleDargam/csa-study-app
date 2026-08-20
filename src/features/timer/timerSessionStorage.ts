/**
 * Persists a snapshot of the currently running/paused Pomodoro phase to
 * localStorage, wall-clock (not tick-count) based, so a locked screen, a
 * backgrounded tab getting killed by the OS, or a hard reload can recover
 * the in-progress cycle instead of silently losing the studied minutes —
 * see useTimer.ts's boot-time recovery logic.
 */
export interface ActiveTimerSnapshot {
  subjectId: number;
  taskId?: number;
  phase: 'study' | 'break';
  status: 'running' | 'paused';
  totalTime: number; // planned seconds for this phase
  remaining: number; // seconds remaining, accurate as of `savedAt`
  savedAt: number; // epoch ms — wall-clock reference for `remaining`
  phaseStartedAt: number; // epoch ms — when this phase actually began
  cycleCount: number;
}

const ACTIVE_KEY = 'csa-timer-active-session';

export function saveActiveSnapshot(snap: ActiveTimerSnapshot): void {
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(snap));
  } catch {
    // Storage full/unavailable — recovery just won't work, not fatal.
  }
}

export function loadActiveSnapshot(): ActiveTimerSnapshot | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearActiveSnapshot(): void {
  localStorage.removeItem(ACTIVE_KEY);
}
