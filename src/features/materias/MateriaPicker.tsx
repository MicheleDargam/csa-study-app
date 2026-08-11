import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Plus } from 'lucide-react';
import type { Subject } from '../../types';

interface MateriaPickerProps {
  selected: Subject | null;
  onSelect: (materia: Subject) => void;
  onAdd: () => void;
  disabled?: boolean;
}

export function MateriaPicker({
  selected,
  onSelect,
  onAdd,
  disabled,
}: MateriaPickerProps) {
  const materias = useLiveQuery(() => db.subjects.toArray(), []);

  return (
    <div className="subject-picker">
      <label className="subject-picker-label">Matéria</label>
      <div className="subject-chips">
        {materias?.map((materia) => (
          <button
            key={materia.id}
            className={`subject-chip ${
              selected?.id === materia.id ? 'subject-chip--selected' : ''
            }`}
            style={
              selected?.id === materia.id
                ? {
                    backgroundColor: `${materia.color}25`,
                    borderColor: materia.color,
                    color: materia.color,
                  }
                : {}
            }
            onClick={() => onSelect(materia)}
            disabled={disabled}
          >
            <span
              className="subject-chip-dot"
              style={{ backgroundColor: materia.color }}
            />
            {materia.name}
          </button>
        ))}
        <button
          className="subject-chip subject-chip--add"
          onClick={onAdd}
          disabled={disabled}
        >
          <Plus size={16} />
          Nova
        </button>
      </div>
    </div>
  );
}
