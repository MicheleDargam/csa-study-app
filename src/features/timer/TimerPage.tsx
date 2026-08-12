import { useState } from 'react';
import { useTimerContext } from './timerContextValue';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { TimerSettings } from './TimerSettings';
import { SessionHistory } from './SessionHistory';
import { MateriaPicker } from '../materias/MateriaPicker';
import { MateriaForm } from '../materias/MateriaForm';
import { TaskPicker } from '../tarefas/TaskPicker';
import { TaskCompletePrompt } from '../tarefas/TaskCompletePrompt';
import { completeTask } from '../tarefas/taskUtils';
import { Settings } from 'lucide-react';

export function TimerPage() {
  const timer = useTimerContext();
  const [showSettings, setShowSettings] = useState(false);
  const [showMateriaForm, setShowMateriaForm] = useState(false);

  const isTimerActive = timer.phase !== 'idle';

  const handleConfirmTaskDone = async () => {
    if (timer.taskToConfirm?.id) {
      await completeTask(timer.taskToConfirm.id);
    }
    timer.setSelectedTask(null);
    timer.clearTaskToConfirm();
  };

  return (
    <div className="timer-page">
      {/* Header */}
      <div className="timer-page-header">
        <div>
          <h1 className="timer-page-title">CSA Study Timer</h1>
          <p className="timer-page-subtitle">ServiceNow Certified System Administrator</p>
        </div>
        {!isTimerActive && (
          <button
            className="timer-btn-icon"
            onClick={() => setShowSettings(true)}
            title="Configurações"
          >
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* Subject Picker */}
      <MateriaPicker
        selected={timer.selectedSubject}
        onSelect={timer.selectSubject}
        onAdd={() => setShowMateriaForm(true)}
        disabled={isTimerActive}
      />

      {/* Task Picker (optional link to today's task) */}
      {!isTimerActive && (
        <TaskPicker
          subjectId={timer.selectedSubject?.id}
          selected={timer.selectedTask}
          onSelect={timer.setSelectedTask}
          disabled={isTimerActive}
        />
      )}

      {/* Timer Display */}
      <TimerDisplay
        timeRemaining={timer.timeRemaining}
        progress={timer.progress}
        phase={timer.phase}
        subjectColor={timer.selectedSubject?.color ?? '#6366f1'}
        totalTime={timer.totalTime}
      />

      {/* Cycle counter */}
      {timer.cycleCount > 0 && (
        <div className="cycle-counter">
          <span className="cycle-counter-label">Ciclos completos</span>
          <div className="cycle-dots">
            {Array.from({ length: timer.cycleCount }).map((_, i) => (
              <span
                key={i}
                className="cycle-dot"
                style={{
                  backgroundColor: timer.selectedSubject?.color ?? '#6366f1',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Timer Info */}
      {timer.phase === 'idle' && (
        <div className="timer-info">
          <span>{timer.settings.studyDuration}min estudo</span>
          <span className="timer-info-sep">•</span>
          <span>{timer.settings.breakDuration}min pausa</span>
        </div>
      )}

      {/* Controls */}
      <TimerControls
        phase={timer.phase}
        status={timer.status}
        onStart={timer.start}
        onPause={timer.pause}
        onResume={timer.resume}
        onSkip={timer.skip}
        onReset={timer.reset}
        onOpenSettings={() => setShowSettings(true)}
        canStart={!!timer.selectedSubject}
      />

      {/* Session History */}
      <SessionHistory />

      {/* Modals */}
      {showSettings && (
        <TimerSettings
          settings={timer.settings}
          onSave={timer.updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showMateriaForm && (
        <MateriaForm onClose={() => setShowMateriaForm(false)} />
      )}

      {timer.taskToConfirm && (
        <TaskCompletePrompt
          task={timer.taskToConfirm}
          onConfirm={handleConfirmTaskDone}
          onDismiss={timer.clearTaskToConfirm}
        />
      )}
    </div>
  );
}
