import { Play, Pause, SkipForward, RotateCcw, Settings } from 'lucide-react';
import type { TimerPhase, TimerStatus } from '../../types';

interface TimerControlsProps {
  phase: TimerPhase;
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onReset: () => void;
  onOpenSettings: () => void;
  canStart: boolean;
}

export function TimerControls({
  phase,
  status,
  onStart,
  onPause,
  onResume,
  onSkip,
  onReset,
  onOpenSettings,
  canStart,
}: TimerControlsProps) {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = phase === 'idle';

  return (
    <div className="timer-controls">
      {/* Secondary controls row */}
      <div className="timer-controls-secondary">
        {!isIdle && (
          <button
            className="timer-btn-secondary"
            onClick={onReset}
            title="Resetar"
          >
            <RotateCcw size={20} />
          </button>
        )}

        {isIdle && <div />}

        {/* Main play/pause button */}
        {isIdle ? (
          <button
            className={`timer-btn-main ${canStart ? 'timer-btn-main--active' : 'timer-btn-main--disabled'}`}
            onClick={onStart}
            disabled={!canStart}
            title="Iniciar"
          >
            <Play size={32} className="timer-play-icon" />
          </button>
        ) : isRunning ? (
          <button
            className="timer-btn-main timer-btn-main--active"
            onClick={onPause}
            title="Pausar"
          >
            <Pause size={32} />
          </button>
        ) : isPaused ? (
          <button
            className="timer-btn-main timer-btn-main--active timer-btn-main--pulse"
            onClick={onResume}
            title="Continuar"
          >
            <Play size={32} className="timer-play-icon" />
          </button>
        ) : null}

        {!isIdle ? (
          <button
            className="timer-btn-secondary"
            onClick={onSkip}
            title="Pular"
          >
            <SkipForward size={20} />
          </button>
        ) : (
          <button
            className="timer-btn-secondary"
            onClick={onOpenSettings}
            title="Configurações"
          >
            <Settings size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
