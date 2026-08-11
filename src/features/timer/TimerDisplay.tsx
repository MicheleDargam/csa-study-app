import { formatTime } from './timerUtils';
import type { TimerPhase } from '../../types';

interface TimerDisplayProps {
  timeRemaining: number;
  progress: number;
  phase: TimerPhase;
  subjectColor: string;
  totalTime: number;
}

export function TimerDisplay({
  timeRemaining,
  progress,
  phase,
  subjectColor,
  totalTime,
}: TimerDisplayProps) {
  const size = 280;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const phaseLabel =
    phase === 'study'
      ? 'Estudando'
      : phase === 'break'
        ? 'Pausa'
        : 'Pronto';

  const displayColor = phase === 'idle' ? '#6366f1' : subjectColor || '#6366f1';
  const displayTime = phase === 'idle' && totalTime === 0
    ? '--:--'
    : formatTime(timeRemaining);

  return (
    <div className="timer-display-wrapper">
      <div className="timer-display">
        {/* Glow effect behind the ring */}
        <div
          className="timer-glow"
          style={{
            background: `radial-gradient(circle, ${displayColor}20 0%, transparent 70%)`,
          }}
        />

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="timer-svg"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />

          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={displayColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="timer-progress-ring"
            style={{
              filter: `drop-shadow(0 0 8px ${displayColor}80)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="timer-center">
          <span className="timer-phase-label" style={{ color: displayColor }}>
            {phaseLabel}
          </span>
          <span className="timer-time">{displayTime}</span>
        </div>
      </div>
    </div>
  );
}
