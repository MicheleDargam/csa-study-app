import { useState, useCallback, useRef, useEffect } from 'react';
import type { Subject, Task, TimerPhase, TimerStatus, TimerSettings, StudySession } from '../../types';
import { db } from '../../db/database';
import {
  playNotificationSound,
  sendNotification,
  requestNotificationPermission,
} from './timerUtils';
import { saveActiveSnapshot, loadActiveSnapshot, clearActiveSnapshot } from './timerSessionStorage';

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
  const [recoveredNotice, setRecoveredNotice] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  // React 18 StrictMode (dev only) invokes a functional setState updater
  // twice to help surface impurities — and the "cycle just finished" branch
  // below has side effects (saving the session, notifying) inside exactly
  // such an updater. Without this guard, every natural completion would
  // double-save. Reset to false whenever a fresh interval starts; flips to
  // true the first time that interval's completion branch runs.
  const completionHandledRef = useRef(false);

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

  // Keeps the wall-clock snapshot in localStorage fresh so a locked screen,
  // a backgrounded tab reclaimed by the OS, or a hard reload can recover
  // the in-progress phase (see the boot-time recovery effect below) instead
  // of silently losing already-studied minutes.
  const persistSnapshot = useCallback(
    (phaseType: 'study' | 'break', snapStatus: 'running' | 'paused', total: number, remaining: number, cycles: number) => {
      if (!selectedSubject?.id || !sessionStartRef.current) return;
      saveActiveSnapshot({
        subjectId: selectedSubject.id,
        taskId: selectedTask?.id,
        phase: phaseType,
        status: snapStatus,
        totalTime: total,
        remaining,
        savedAt: Date.now(),
        phaseStartedAt: sessionStartRef.current.getTime(),
        cycleCount: cycles,
      });
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
    completionHandledRef.current = false;
    persistSnapshot('break', 'running', breakSeconds, breakSeconds, cycleCount);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (completionHandledRef.current) return 0;
          completionHandledRef.current = true;
          clearTimer();
          // Break completed
          playNotificationSound();
          sendNotification(
            'Pausa finalizada! ☕',
            'Hora de voltar aos estudos.',
          );
          saveSession('break', breakSeconds);
          clearActiveSnapshot();
          setPhase('idle');
          setStatus('stopped');
          return 0;
        }
        persistSnapshot('break', 'running', breakSeconds, prev - 1, cycleCount);
        return prev - 1;
      });
    }, 1000);
  }, [settings.breakDuration, clearTimer, saveSession, persistSnapshot, cycleCount]);

  const startStudy = useCallback(() => {
    clearTimer();
    const studySeconds = settings.studyDuration * 60;
    setPhase('study');
    setStatus('running');
    setTimeRemaining(studySeconds);
    setTotalTime(studySeconds);
    sessionStartRef.current = new Date();
    completionHandledRef.current = false;
    persistSnapshot('study', 'running', studySeconds, studySeconds, cycleCount);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (completionHandledRef.current) return 0;
          completionHandledRef.current = true;
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
        persistSnapshot('study', 'running', studySeconds, prev - 1, cycleCount);
        return prev - 1;
      });
    }, 1000);
  }, [settings.studyDuration, clearTimer, saveSession, startBreak, persistSnapshot, cycleCount]);

  const start = useCallback(() => {
    if (!selectedSubject) return;
    requestNotificationPermission();
    startStudy();
  }, [selectedSubject, startStudy]);

  const pause = useCallback(() => {
    clearTimer();
    setStatus('paused');
    persistSnapshot(phase === 'break' ? 'break' : 'study', 'paused', totalTime, timeRemaining, cycleCount);
  }, [clearTimer, persistSnapshot, phase, totalTime, timeRemaining, cycleCount]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    setStatus('running');
    completionHandledRef.current = false;
    persistSnapshot(phase === 'break' ? 'break' : 'study', 'running', totalTime, timeRemaining, cycleCount);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (completionHandledRef.current) return 0;
          completionHandledRef.current = true;
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
            clearActiveSnapshot();
            setPhase('idle');
            setStatus('stopped');
          }
          return 0;
        }
        persistSnapshot(phase === 'break' ? 'break' : 'study', 'running', totalTime, prev - 1, cycleCount);
        return prev - 1;
      });
    }, 1000);
  }, [status, phase, settings, clearTimer, saveSession, startBreak, persistSnapshot, totalTime, timeRemaining, cycleCount]);

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
      clearActiveSnapshot();
      setPhase('idle');
      setStatus('stopped');
      setTimeRemaining(0);
    }
  }, [phase, clearTimer, startBreak, totalTime, timeRemaining, saveSession, selectedSubject]);

  const reset = useCallback(() => {
    clearTimer();
    // Resetting mid-study used to silently discard the elapsed time — save
    // it as a partial session first, same as Skip already does, so minutes
    // already studied aren't lost just because the cycle wasn't finished.
    if (phase === 'study' && sessionStartRef.current && selectedSubject) {
      const elapsed = totalTime - timeRemaining;
      if (elapsed > 0) {
        saveSession('study', elapsed);
      }
    }
    clearActiveSnapshot();
    setPhase('idle');
    setStatus('stopped');
    setTimeRemaining(0);
    setTotalTime(0);
    setCycleCount(0);
  }, [clearTimer, phase, totalTime, timeRemaining, selectedSubject, saveSession]);

  // Recover a phase that was running/paused before the app disappeared —
  // a locked screen for long enough, the OS reclaiming a backgrounded tab,
  // or any hard reload all kill the setInterval and every bit of React
  // state with it. Runs once at boot (this hook is only ever mounted once,
  // at the app root — see TimerContext.tsx).
  useEffect(() => {
    const snap = loadActiveSnapshot();
    if (!snap) return;
    // Clear it synchronously, before any `await` — React StrictMode
    // double-invokes mount effects in dev, and both invocations run this
    // synchronous portion before either reaches an awaited call. Clearing
    // here means the second invocation's `loadActiveSnapshot()` finds
    // nothing and no-ops, instead of both recovering (and double-saving)
    // the same finished cycle.
    clearActiveSnapshot();

    (async () => {
      const subjectRecord = await db.subjects.get(snap.subjectId);
      if (!subjectRecord) {
        // Subject no longer exists — nothing sane to recover into.
        return;
      }
      const taskRecord = snap.taskId ? await db.tasks.get(snap.taskId) : undefined;

      setSelectedSubject(subjectRecord);
      setSelectedTask(taskRecord ?? null);
      sessionStartRef.current = new Date(snap.phaseStartedAt);

      if (snap.status === 'paused') {
        setPhase(snap.phase);
        setStatus('paused');
        setTotalTime(snap.totalTime);
        setTimeRemaining(snap.remaining);
        setCycleCount(snap.cycleCount);
        return;
      }

      // Was running — ticks stop entirely while the tab/process is dead, so
      // recompute from wall-clock time instead of trusting `remaining`.
      const elapsedSinceSave = Math.floor((Date.now() - snap.savedAt) / 1000);
      const recoveredRemaining = snap.remaining - elapsedSinceSave;

      if (recoveredRemaining > 0) {
        // Still mid-cycle — resume seamlessly from where the clock says we
        // should be.
        setPhase(snap.phase);
        setStatus('running');
        setTotalTime(snap.totalTime);
        setTimeRemaining(recoveredRemaining);
        setCycleCount(snap.cycleCount);
        completionHandledRef.current = false;

        intervalRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              if (completionHandledRef.current) return 0;
              completionHandledRef.current = true;
              clearTimer();
              playNotificationSound();
              if (snap.phase === 'study') {
                sendNotification('Ciclo concluído! 🎉', `Você completou ${Math.round(snap.totalTime / 60)} minutos de estudo.`);
                saveSession('study', snap.totalTime);
                setCycleCount((c) => c + 1);
                setTimeout(() => startBreak(), 500);
              } else {
                sendNotification('Pausa finalizada! ☕', 'Hora de voltar aos estudos.');
                saveSession('break', snap.totalTime);
                setPhase('idle');
                setStatus('stopped');
              }
              return 0;
            }
            persistSnapshot(snap.phase, 'running', snap.totalTime, prev - 1, snap.cycleCount);
            return prev - 1;
          });
        }, 1000);
        return;
      }

      // The whole phase elapsed while the app was gone. If it was a study
      // cycle, that time genuinely happened — count it — but don't guess
      // how long ago it actually finished by auto-chaining into a break;
      // land on idle and let the next action be explicit.
      if (snap.phase === 'study') {
        const session: StudySession = {
          subjectId: subjectRecord.id!,
          subjectName: subjectRecord.name,
          subjectColor: subjectRecord.color,
          taskId: taskRecord?.id,
          taskTitle: taskRecord?.title,
          type: 'study',
          duration: snap.totalTime,
          startedAt: new Date(snap.phaseStartedAt),
          completedAt: new Date(snap.phaseStartedAt + snap.totalTime * 1000),
        };
        await db.sessions.add(session);
        setCycleCount(snap.cycleCount + 1);
        setRecoveredNotice(
          `Notamos que um ciclo de ${Math.round(snap.totalTime / 60)} minutos de estudo terminou enquanto o app estava fechado — já contamos esse tempo!`,
        );
        if (taskRecord) setTaskToConfirm(taskRecord);
      }
      setPhase('idle');
      setStatus('stopped');
      setTimeRemaining(0);
      setTotalTime(0);
    })();
    // Runs once at boot only — intentionally ignoring clearTimer/saveSession/
    // startBreak/persistSnapshot so this doesn't re-fire (and re-recover a
    // snapshot it just wrote itself) every time those get recreated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changing the subject invalidates the previously picked task (it belonged
  // to the old subject's list), so clear it to avoid a stale/mismatched link.
  const selectSubject = useCallback((subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedTask(null);
  }, []);

  const clearTaskToConfirm = useCallback(() => setTaskToConfirm(null), []);
  const dismissRecoveredNotice = useCallback(() => setRecoveredNotice(null), []);

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
    recoveredNotice,
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
    dismissRecoveredNotice,
    updateSettings,
  };
}
