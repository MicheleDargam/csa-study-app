import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Play, X } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { sameAnswerSet } from './simuladoUtils';
import { loadMatchingDraft, saveDraft, clearDraft } from './quizDraft';
import type { Questao, TentativaErro } from '../../types';

export interface QuizResult {
  acertos: number;
  total: number;
  erros: TentativaErro[];
  startedAt: Date;
  completedAt: Date;
  duracaoSegundos: number;
}

interface QuizRunnerProps {
  /** Shown as the page title, both on the intro screen and during the quiz. */
  title: string;
  questoes: Questao[];
  introHint?: string;
  /**
   * Stable identifier for this quiz's autosave draft (e.g. `simulado-3` or
   * `banco-CMDB-CSA - ServiceNow`). Must uniquely identify the exact
   * question set — the draft is discarded if it doesn't match `questoes`.
   */
  draftKey: string;
  onBack: () => void;
  onFinish: (result: QuizResult) => void;
}

type Phase = 'intro' | 'running';

/**
 * Generic one-question-at-a-time quiz engine: intro screen, progress bar,
 * navigation, scoring and the "unanswered questions" confirm dialog.
 * Feature-agnostic — Simulados and Banco de Questões both drive it with
 * their own question list and decide what to do with the result.
 *
 * Every answer/navigation is autosaved to localStorage (see quizDraft.ts),
 * so a locked screen, a backgrounded tab getting reclaimed by the OS, or an
 * accidental reload resumes exactly where it left off instead of losing the
 * attempt — this only clears once the quiz is actually submitted.
 */
export function QuizRunner({ title, questoes, introHint, draftKey, onBack, onFinish }: QuizRunnerProps) {
  const questaoIds = questoes.map((q) => q.id!);
  // Computed once, at mount — later prop updates (e.g. a live query
  // re-firing) shouldn't retrigger draft detection.
  const [initialDraft] = useState(() => loadMatchingDraft(draftKey, questaoIds));

  const [phase, setPhase] = useState<Phase>(initialDraft ? 'running' : 'intro');
  const [currentIndex, setCurrentIndex] = useState(initialDraft?.currentIndex ?? 0);
  const [answers, setAnswers] = useState<Record<number, number[]>>(initialDraft?.answers ?? {});
  const [startedAt, setStartedAt] = useState<Date | null>(
    initialDraft ? new Date(initialDraft.startedAt) : null,
  );
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showResumedBanner, setShowResumedBanner] = useState(!!initialDraft);

  const total = questoes.length;
  const currentQuestao = questoes[currentIndex];
  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length;
  const isLast = currentIndex === total - 1;

  // Keep the draft in sync with every answer/navigation while the quiz is
  // running, so there's never more than one question's worth of progress
  // at risk if the app dies mid-session.
  useEffect(() => {
    if (phase !== 'running' || !startedAt) return;
    saveDraft(draftKey, {
      questaoIds: questoes.map((q) => q.id!),
      currentIndex,
      answers,
      startedAt: startedAt.toISOString(),
    });
  }, [phase, draftKey, questoes, currentIndex, answers, startedAt]);

  const handleStart = () => {
    setStartedAt(new Date());
    setPhase('running');
  };

  const handleRestartFromScratch = () => {
    clearDraft(draftKey);
    setAnswers({});
    setCurrentIndex(0);
    setStartedAt(new Date());
    setShowResumedBanner(false);
  };

  const handleAnswerChange = (selected: number[]) => {
    if (!currentQuestao?.id) return;
    setAnswers((prev) => ({ ...prev, [currentQuestao.id!]: selected }));
  };

  const finish = () => {
    if (!startedAt) return;

    let acertos = 0;
    const erros: TentativaErro[] = [];

    for (const questao of questoes) {
      const selecionadas = answers[questao.id!] ?? [];
      if (sameAnswerSet(selecionadas, questao.respostaCorreta)) {
        acertos += 1;
      } else {
        erros.push({ questaoId: questao.id!, selecionadas });
      }
    }

    const completedAt = new Date();
    clearDraft(draftKey);
    onFinish({
      acertos,
      total,
      erros,
      startedAt,
      completedAt,
      duracaoSegundos: Math.round((completedAt.getTime() - startedAt.getTime()) / 1000),
    });
  };

  const handleNext = () => {
    if (isLast) {
      if (answeredCount < total) {
        setConfirmFinish(true);
      } else {
        finish();
      }
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (total === 0) return null;

  if (phase === 'intro') {
    return (
      <div className="simulados-page">
        <div className="timer-page-header">
          <div className="materias-page-heading">
            <button className="timer-btn-icon" onClick={onBack} title="Voltar">
              <ArrowLeft size={20} />
            </button>
            <h1 className="timer-page-title">{title}</h1>
          </div>
        </div>

        <div className="simulado-intro-card">
          <span className="simulado-intro-count">{total} questões</span>
          <p className="simulado-intro-hint">
            {introHint ?? 'Responda no seu ritmo. Você pode voltar e revisar suas respostas antes de finalizar.'}
          </p>
          <button className="btn-primary" onClick={handleStart}>
            <Play size={18} /> Começar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="simulados-page">
      {showResumedBanner && (
        <div className="recovery-banner">
          <span>Retomando de onde você parou.</span>
          <button type="button" onClick={handleRestartFromScratch}>
            Começar do zero
          </button>
          <button
            type="button"
            className="recovery-banner-close"
            onClick={() => setShowResumedBanner(false)}
            title="Dispensar"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="quiz-progress-bar">
        <div
          className="quiz-progress-fill"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <QuestionCard
        key={currentQuestao.id}
        questao={currentQuestao}
        index={currentIndex}
        total={total}
        selected={answers[currentQuestao.id!] ?? []}
        onChange={handleAnswerChange}
      />

      <div className="quiz-nav">
        <button
          className="btn-secondary"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          <ArrowLeft size={18} /> Anterior
        </button>
        <button className="btn-primary quiz-nav-next" onClick={handleNext}>
          {isLast ? 'Finalizar' : 'Próxima'}
          {!isLast && <ArrowRight size={18} />}
        </button>
      </div>

      {confirmFinish && (
        <ConfirmDialog
          title="Finalizar"
          message={`Você tem ${total - answeredCount} questão(ões) sem resposta — elas serão contadas como erradas. Deseja finalizar mesmo assim?`}
          confirmLabel="Finalizar"
          onConfirm={finish}
          onCancel={() => setConfirmFinish(false)}
        />
      )}
    </div>
  );
}
