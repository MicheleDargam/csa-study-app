import type { ReactNode } from 'react';
import { useTimer } from './useTimer';
import { TimerContext } from './timerContextValue';

/**
 * Mount once at the app root (see App.tsx) — this is what makes the running
 * Pomodoro cycle survive navigating to another tab. Previously `useTimer()`
 * was called directly inside TimerPage, so leaving the "/" route unmounted
 * it, cleared its setInterval, and the whole timer reset the next time you
 * came back.
 */
export function TimerProvider({ children }: { children: ReactNode }) {
  const timer = useTimer();
  return <TimerContext.Provider value={timer}>{children}</TimerContext.Provider>;
}
