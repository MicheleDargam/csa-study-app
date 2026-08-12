import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, CheckCircle2, XCircle, Info, Languages } from 'lucide-react';
import { db } from '../../db/database';
import { formatDuration } from '../timer/timerUtils';
import { formatPercent } from './simuladoUtils';
import { TranslationPanel } from './TranslationPanel';
import type { Questao, TentativaErro } from '../../types';

interface ResultadoViewProps {
  title: string;
  acertos: number;
  total: number;
  duracaoSegundos: number;
  erros: TentativaErro[];
  onBack: () => void;
}

/**
 * Score summary + wrong-answer review, shared by the Simulados and Banco de
 * Questões result screens. Only needs the graded outcome — the caller is
 * responsible for loading its own attempt record (TentativaSimulado or
 * SessaoPratica) and passing its fields down.
 */
export function ResultadoView({ title, acertos, total, duracaoSegundos, erros, onBack }: ResultadoViewProps) {
  const errorQuestoes = useLiveQuery(async () => {
    if (erros.length === 0) return [];
    const questoes = await db.questoes.bulkGet(erros.map((e) => e.questaoId));
    const byId = new Map<number, Questao>();
    for (const q of questoes) {
      if (q?.id) byId.set(q.id, q);
    }
    return erros
      .map((erro) => ({ erro, questao: byId.get(erro.questaoId) }))
      .filter((item): item is { erro: TentativaErro; questao: Questao } => !!item.questao);
  }, [erros]);

  const percent = formatPercent(acertos, total);

  return (
    <div className="simulados-page">
      <div className="timer-page-header">
        <div className="materias-page-heading">
          <button className="timer-btn-icon" onClick={onBack} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="timer-page-title">Resultado</h1>
        </div>
      </div>

      <div className="resultado-summary">
        <span className="resultado-summary-name">{title}</span>
        <span className="resultado-summary-score">{percent}</span>
        <span className="resultado-summary-detail">
          {acertos} de {total} corretas · {formatDuration(duracaoSegundos)}
        </span>
      </div>

      {errorQuestoes && errorQuestoes.length > 0 ? (
        <div className="resultado-review">
          <h2 className="task-group-title">Questões para revisar</h2>
          {errorQuestoes.map(({ erro, questao }) => (
            <ReviewCard key={questao.id} erro={erro} questao={questao} />
          ))}
        </div>
      ) : (
        <div className="history-empty">
          <CheckCircle2 size={32} className="history-empty-icon" />
          <p>Você acertou todas as questões! 🎉</p>
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  erro: TentativaErro;
  questao: Questao;
}

function ReviewCard({ erro, questao }: ReviewCardProps) {
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <div className="review-card">
      <div className="question-card-header">
        <span className="question-card-tema">{questao.tema}</span>
        {questao.enunciadoPt && (
          <button
            type="button"
            className={`translate-toggle ${showTranslation ? 'translate-toggle--active' : ''}`}
            onClick={() => setShowTranslation((s) => !s)}
            title="Ver tradução em português"
          >
            <Languages size={13} /> PT
          </button>
        )}
      </div>

      <p className="question-card-enunciado">{questao.enunciado}</p>

      {showTranslation && <TranslationPanel questao={questao} />}

      <div className="question-card-options">
        {questao.alternativas.map((alt, i) => {
          const isCorrect = questao.respostaCorreta.includes(i);
          const wasSelected = erro.selecionadas.includes(i);
          const state = isCorrect
            ? 'review-option--correct'
            : wasSelected
              ? 'review-option--wrong'
              : '';
          return (
            <div key={i} className={`question-option review-option ${state}`}>
              <span className="question-option-mark">
                {isCorrect && <CheckCircle2 size={14} />}
                {!isCorrect && wasSelected && <XCircle size={14} />}
              </span>
              <span className="question-option-text">{alt}</span>
            </div>
          );
        })}
      </div>

      {questao.nota && (
        <p className="review-nota">
          <Info size={14} /> {questao.nota}
        </p>
      )}
    </div>
  );
}
