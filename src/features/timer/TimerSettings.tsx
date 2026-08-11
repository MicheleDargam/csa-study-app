import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import type { TimerSettings as TimerSettingsType } from '../../types';

interface TimerSettingsProps {
  settings: TimerSettingsType;
  onSave: (settings: TimerSettingsType) => void;
  onClose: () => void;
}

export function TimerSettings({ settings, onSave, onClose }: TimerSettingsProps) {
  const [studyDuration, setStudyDuration] = useState(settings.studyDuration);
  const [breakDuration, setBreakDuration] = useState(settings.breakDuration);

  const handleSave = () => {
    onSave({
      studyDuration: Math.max(1, studyDuration),
      breakDuration: Math.max(1, breakDuration),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Configurações</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-field">
            <label className="settings-label">Tempo de estudo</label>
            <div className="settings-stepper">
              <button
                className="stepper-btn"
                onClick={() => setStudyDuration((d) => Math.max(1, d - 5))}
              >
                <Minus size={16} />
              </button>
              <span className="stepper-value">{studyDuration} min</span>
              <button
                className="stepper-btn"
                onClick={() => setStudyDuration((d) => Math.min(120, d + 5))}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">Tempo de pausa</label>
            <div className="settings-stepper">
              <button
                className="stepper-btn"
                onClick={() => setBreakDuration((d) => Math.max(1, d - 1))}
              >
                <Minus size={16} />
              </button>
              <span className="stepper-value">{breakDuration} min</span>
              <button
                className="stepper-btn"
                onClick={() => setBreakDuration((d) => Math.min(30, d + 1))}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave}>
          Salvar
        </button>
      </div>
    </div>
  );
}
