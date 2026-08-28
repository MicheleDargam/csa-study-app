import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db/database';
import { QuizRunner, type QuizResult } from '../simulados/QuizRunner';
import { peekDraftQuestionIds } from '../simulados/quizDraft';
import { sampleRandom, shuffle } from '../banco-questoes/practiceUtils';
import { formatAttemptDate } from '../simulados/simuladoUtils';
import { PREPPER_DOMAINS } from './domainStats';
import type { Questao } from '../../types';

const DRAFT_KEY = 'exame-prepper-gerado';
const QUESTOES_POR_DOMINIO = 10;

/** Draws QUESTOES_POR_DOMINIO random questions from each of the 6 domains (60 total), shuffled together. */
async function gerarSimulado(): Promise<Questao[]> {
  const todas = await db.questoesPrepper.toArray();
  const porDominio = new Map<string, Questao[]>();
  for (const q of todas) {
    const lista = porDominio.get(q.tema) ?? [];
    lista.push(q);
    porDominio.set(q.tema, lista);
  }

  let sorteadas: Questao[] = [];
  for (const dominio of PREPPER_DOMAINS) {
    sorteadas = sorteadas.concat(sampleRandom(porDominio.get(dominio) ?? [], QUESTOES_POR_DOMINIO));
  }
  return shuffle(sorteadas);
}

/**
 * "Gerar Simulado": an on-the-fly 60-question exam (10 per domain) instead
 * of one of the 6 fixed Simulados Prepper. Never becomes a permanent card —
 * its result just lands in the same Histórico/Progresso as everything else,
 * tagged with simuladoId 0 and its own drawn questaoIds (see
 * domainStats.ts's getRosterForTentativa) so the per-domain breakdown still
 * works without a real simulado to look the roster up by.
 */
export function SimuladoGeradoPage() {
  const navigate = useNavigate();
  const [questoes, setQuestoes] = useState<Questao[] | null>(null);
  const initAttempted = useRef(false);

  // Same draft-resume safety net as the other quiz-launching pages: if a
  // draft for this exact key is pending, reconstruct that same 60 questions
  // instead of drawing a brand new random set out from under an in-progress attempt.
  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    (async () => {
      const draftIds = peekDraftQuestionIds(DRAFT_KEY);
      if (draftIds && draftIds.length > 0) {
        const fetched = await db.questoesPrepper.bulkGet(draftIds);
        const valid = fetched.filter((q): q is Questao => !!q);
        if (valid.length === draftIds.length) {
          setQuestoes(valid);
          return;
        }
      }
      setQuestoes(await gerarSimulado());
    })();
  }, []);

  const handleFinish = async (result: QuizResult) => {
    if (!questoes) return;
    const tentativaId = await db.tentativasPrepper.add({
      simuladoId: 0,
      simuladoNome: `Simulado Gerado - ${formatAttemptDate(new Date())}`,
      questaoIds: questoes.map((q) => q.id!),
      ...result,
    });
    navigate(`/exame-prepper/resultado/${tentativaId}`, { replace: true });
  };

  if (!questoes) {
    return <div className="simulados-page" />;
  }

  return (
    <QuizRunner
      title="Simulado Gerado"
      questoes={questoes}
      introHint="60 questões sorteadas agora, 10 de cada domínio do CSA."
      draftKey={DRAFT_KEY}
      onBack={() => navigate('/exame-prepper')}
      onFinish={handleFinish}
    />
  );
}
