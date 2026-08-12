import { createContext, useContext } from 'react';
import type { useTimer } from './useTimer';

export type TimerContextValue = ReturnType<typeof useTimer>;

export const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimerContext(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return ctx;
}
