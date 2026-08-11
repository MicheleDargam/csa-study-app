import { Check } from 'lucide-react';
import { isMultiSelect } from './simuladoUtils';
import type { Questao } from '../../types';

interface QuestionCardProps {
  questao: Questao;
  index: number;
  total: number;
  selected: number[];
  onChange: (selected: number[]) => void;
}

export function QuestionCard({ questao, index, total, selected, onChange }: QuestionCardProps) {
  const multi = isMultiSelect(questao);

  const toggle = (altIndex: number) => {
    if (multi) {
      onChange(
        selected.includes(altIndex)
          ? selected.filter((i) => i !== altIndex)
          : [...selected, altIndex],
      );
    } else {
      onChange([altIndex]);
    }
  };

  return (
    <div className="question-card">
      <div className="question-card-header">
        <span className="question-card-progress">Questão {index + 1} de {total}</span>
        <span className="question-card-tema">{questao.tema}</span>
      </div>

      {multi && <p className="question-card-hint">Selecione todas as alternativas corretas</p>}

      <p className="question-card-enunciado">{questao.enunciado}</p>

      <div className="question-card-options">
        {questao.alternativas.map((alt, i) => {
          const isSelected = selected.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={`question-option ${isSelected ? 'question-option--selected' : ''}`}
              onClick={() => toggle(i)}
            >
              <span className={`question-option-mark ${multi ? 'question-option-mark--square' : ''} ${isSelected ? 'question-option-mark--checked' : ''}`}>
                {isSelected && <Check size={13} />}
              </span>
              <span className="question-option-text">{alt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
