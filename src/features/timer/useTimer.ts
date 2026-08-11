import { useState, useCallback, useRef, useEffect } from 'react';
import type { Subject, Task, TimerPhase, TimerStatus, TimerSettings, StudySession } from '../../types';
import { db } from '../../db/database';
import {
  playNotificationSound,
  sendNotification,
  requestNotificationPermission,
} from './timerUtils';

const SETTINGS_KEY = 'csa-timer-settings';

function loadSettings(): TimerSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* fallback to defaults */ }
  return { studyDuration: 25, breakDuration: 5 };
}

function saveSettings(settings: TimerSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function useTimer() {
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [status, setStatus] = useState<TimerStatus>('stopped');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToConfirm, setTaskToConfirm] = useState<Task | null>(null);
  const [settings, setSettingsState] = useState<TimerSettings>(loadSettings);
  const [cycleCount, setCycleCount] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<Date | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const saveSession = useCallback(
    async (phaseType: 'study' | 'break', duration: number) => {
      if (!selectedSubject || !sessionStartRef.current) return;

      const session: StudySession = {
        subjectId: selectedSubject.id!,
        subjectName: selectedSubject.name,
        subjectColor: selectedSubject.color,
        taskId: selectedTask?.id,
        taskTitle: selectedTask?.title,
        type: phaseType,
        duration,
        startedAt: sessionStartRef.current,
        completedAt: new Date(),
      };

      await db.sessions.add(session);

      // A study cycle linked to a task just finished — ask whether to mark it done
      if (phaseType === 'study' && selectedTask) {
        setTaskToConfirm(selectedTask);
      }
    },
    [selectedSubject, selectedTask],
  );

  const startBreak = useCallback(() => {
    clearTimer();
    const breakSeconds = settings.breakDuration * 60;
    setPhase('break');
    setStatus('running');
    setTimeRemaining(breakSeconds);
    setTotalTime(breakSeconds);
    sessionStartRef.current = new Date();

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          // Break completed
          playNotificationSound();
          sendNotification(
            'Pausa finalizada! ☕',
            'Hora de voltar aos estudos.',
          );
          saveSession('break', breakSeconds);
          setPhase('idle');
          setStatus('stopped');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings.breakDuration, clearTimer, saveSession]);

  const startStudy = useCallback(() => {
    clearTimer();
    const studySeconds = settings.studyDuration * 60;
    setPhase('study');
    setStatus('running');
    setTimeRemaining(studySeconds);
    setTotalTime(studySeconds);
    sessionStartRef.current = new Date();

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          // Study cycle completed
          playNotificationSound();
          sendNotification(
            'Ciclo concluído! 🎉',
            `Você completou ${settings.studyDuration} minutos de estudo.`,
          );
          saveSession('study', studySeconds);
          setCycleCount((c) => c + 1);
          // Auto-start break
          setTimeout(() => startBreak(), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings.studyDuration, clearTimer, saveSession, startBreak]);

  const start = useCallback(() => {
    if (!selectedSubject) return;
    requestNotificationPermission();
    startStudy();
  }, [selectedSubject, startStudy]);

  const pause = useCallback(() => {
    clearTimer();
    setStatus('paused');
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    setStatus('running');

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          if (phase === 'study') {
            playNotificationSound();
            sendNotification(
              'Ciclo concluído! 🎉',
              `Você completou ${settings.studyDuration} minutos de estudo.`,
            );
            const studySeconds = settings.studyDuration * 60;
            saveSession('study', studySeconds);
            setCycleCount((c) => c + 1);
            setTimeout(() => startBreak(), 500);
          } else {
            playNotificationSound();
            sendNotification('Pausa finalizada! ☕', 'Hora de voltar aos estudos.');
            const breakSeconds = settings.breakDuration * 60;
            saveSession('break', breakSeconds);
            setPhase('idle');
            setStatus('stopped');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [status, phase, settings, clearTimer, saveSession, startBreak]);

  const skip = useCallback(() => {
    clearTimer();
    if (phase === 'study') {
      // Save partial session
      if (sessionStartRef.current && selectedSubject) {
        const elapsed = totalTime - timeRemaining;
        if (elapsed > 0) {
          saveSession('study', elapsed);
        }
      }
      startBreak();
    } else if (phase === 'break') {
      setPhase('idle');
      setStatus('stopped');
      setTimeRemaining(0);
    }
  }, [phase, clearTimer, startBreak, totalTime, timeRemaining, saveSession, selectedSubject]);

  const reset = useCallback(() => {
    clearTimer();
    setPhase('idle');
    setStatus('stopped');
    setTimeRemaining(0);
    setTotalTime(0);
    setCycleCount(0);
  }, [clearTimer]);

  // Changing the subject invalidates the previously picked task (it belonged
  // to the old subject's list), so clear it to avoid a stale/mismatched link.
  const selectSubject = useCallback((subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedTask(null);
  }, []);

  const clearTaskToConfirm = useCallback(() => setTaskToConfirm(null), []);

  const updateSettings = useCallback(
    (newSettings: TimerSettings) => {
      setSettingsState(newSettings);
      saveSettings(newSettings);
      // If idle, update the displayed time
      if (phase === 'idle') {
        setTimeRemaining(0);
      }
    },
    [phase],
  );

  const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0;

  return {
    // State
    phase,
    status,
    timeRemaining,
    totalTime,
    progress,
    selectedSubject,
    selectedTask,
    taskToConfirm,
    settings,
    cycleCount,
    // Actions
    start,
    pause,
    resume,
    skip,
    reset,
    setSelectedSubject,
    selectSubject,
    setSelectedTask,
    clearTaskToConfirm,
    updateSettings,
  };
}
