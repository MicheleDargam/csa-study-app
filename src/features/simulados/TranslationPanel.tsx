import type { Questao } from '../../types';

interface TranslationPanelProps {
  questao: Questao;
}

/** PT-BR translation, shown below the English enunciado/alternativas when toggled on. */
export function TranslationPanel({ questao }: TranslationPanelProps) {
  if (!questao.enunciadoPt) return null;

  return (
    <div className="translation-panel">
      <p className="translation-enunciado">{questao.enunciadoPt}</p>
      {questao.alternativasPt && questao.alternativasPt.length > 0 && (
        <ul className="translation-alternativas">
          {questao.alternativasPt.map((alt, i) => (
            <li key={i}>
              <span className="translation-alt-letter">{String.fromCharCode(65 + i)}.</span> {alt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
