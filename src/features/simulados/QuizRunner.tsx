import { useState } from 'react';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { sameAnswerSet } from './simuladoUtils';
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
  onBack: () => void;
  onFinish: (result: QuizResult) => void;
}

type Phase = 'intro' | 'running';

/**
 * Generic one-question-at-a-time quiz engine: intro screen, progress bar,
 * navigation, scoring and the "unanswered questions" confirm dialog.
 * Feature-agnostic — Simulados and Banco de Questões both drive it with
 * their own question list and decide what to do with the result.
 */
export function QuizRunner({ title, questoes, introHint, onBack, onFinish }: QuizRunnerProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);

  const total = questoes.length;
  const currentQuestao = questoes[currentIndex];
  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length;
  const isLast = currentIndex === total - 1;

  const handleStart = () => {
    setStartedAt(new Date());
    setPhase('running');
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
      <div className="quiz-progress-bar">
        <div
          className="quiz-progress-fill"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <QuestionCard
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
