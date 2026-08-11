import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { MATERIA_COLORS } from './materiaColors';
import { db } from '../../db/database';
import type { Subject } from '../../types';

interface MateriaFormProps {
  onClose: () => void;
  /** When provided, the form edits this subject instead of creating a new one. */
  materia?: Subject;
}

export function MateriaForm({ onClose, materia }: MateriaFormProps) {
  const isEditing = !!materia;
  const [name, setName] = useState(materia?.name ?? '');
  const [selectedColor, setSelectedColor] = useState<string>(
    materia?.color ?? MATERIA_COLORS[0].value,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isEditing && materia.id) {
      await db.subjects.update(materia.id, {
        name: trimmed,
        color: selectedColor,
      });
    } else {
      await db.subjects.add({
        name: trimmed,
        color: selectedColor,
        createdAt: new Date(),
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? 'Editar Matéria' : 'Nova Matéria'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="subject-form">
          <div className="form-field">
            <label className="form-label" htmlFor="materia-name">
              Nome
            </label>
            <input
              id="materia-name"
              type="text"
              className="form-input"
              placeholder="Ex: Flow Designer, Integrações..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={50}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Cor</label>
            <div className="color-grid">
              {MATERIA_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`color-option ${
                    selectedColor === color.value ? 'color-option--selected' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <Check size={16} className="color-check" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!name.trim()}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Matéria'}
          </button>
        </form>
      </div>
    </div>
  );
}
