import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ListChecks, Minus, Plus, Shuffle } from 'lucide-react';
import { db } from '../../db/database';
import { QuizRunner, type QuizResult } from '../simulados/QuizRunner';
import { peekDraftQuestionIds } from '../simulados/quizDraft';
import { sampleRandom } from '../banco-questoes/practiceUtils';
import type { Questao } from '../../types';

type Modo = 'quantidade' | 'todas';

const QUICK_PICKS = [10, 20, 30];
const MATERIA_PREPPER = 'CSA - ServiceNow';

/** Same flow as TemaPracticaPage, scoped to one Prepper domain instead of a course tema. */
export function DomainPracticaPrepperPage() {
  const [searchParams] = useSearchParams();
  const dominio = searchParams.get('nome') ?? '';
  const navigate = useNavigate();

  const questoesDoDominio = useLiveQuery(
    () => db.questoesPrepper.where('tema').equals(dominio).toArray(),
    [dominio],
  );

  const [modoAberto, setModoAberto] = useState<Modo>('quantidade');
  const [quantidade, setQuantidade] = useState(10);
  const [run, setRun] = useState<{ questoes: Questao[]; modo: Modo } | null>(null);

  const draftKey = `prepper-dominio-${dominio}`;
  const total = questoesDoDominio?.length ?? 0;

  // Same draft-resume safety net as TemaPracticaPage: `run` only lives in
  // this component's state, so a killed/reloaded tab needs the exact
  // sampled set reconstructed before QuizRunner can resume it.
  const resumeAttempted = useRef(false);
  useEffect(() => {
    if (resumeAttempted.current || run || !questoesDoDominio) return;
    resumeAttempted.current = true;

    const draftIds = peekDraftQuestionIds(draftKey);
    if (!draftIds || draftIds.length === 0) return;

    (async () => {
      const fetched = await db.questoesPrepper.bulkGet(draftIds);
      const valid = fetched.filter((q): q is Questao => !!q);
      if (valid.length === 0) return;
      const modo: Modo = valid.length === questoesDoDominio.length ? 'todas' : 'quantidade';
      setRun({ questoes: valid, modo });
    })();
  }, [draftKey, run, questoesDoDominio]);

  const handleFinish = async (result: QuizResult) => {
    if (!run) return;
    const praticaId = await db.praticasPrepper.add({
      tema: dominio,
      materia: MATERIA_PREPPER,
      modo: run.modo,
      ...result,
    });
    navigate(`/exame-prepper/questoes/resultado/${praticaId}`, { replace: true });
  };

  if (run) {
    return (
      <QuizRunner
        title={dominio}
        questoes={run.questoes}
        draftKey={draftKey}
        onBack={() => setRun(null)}
        onFinish={handleFinish}
      />
    );
  }

  if (!questoesDoDominio) {
    return <div className="simulados-page" />;
  }

  return (
    <div className="simulados-page">
      <div className="timer-page-header">
        <div className="materias-page-heading">
          <button className="timer-btn-icon" onClick={() => navigate('/exame-prepper/questoes')} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="timer-page-title">{dominio}</h1>
        </div>
      </div>

      {total === 0 ? (
        <div className="history-empty">
          <p>Nenhuma questão encontrada para este domínio.</p>
        </div>
      ) : (
        <>
          <p className="pratica-tema-count">{total} questões disponíveis</p>

          <div className="pratica-modo-list">
            <div className={`pratica-modo-card ${modoAberto === 'quantidade' ? 'pratica-modo-card--active' : ''}`}>
              <button className="pratica-modo-header" onClick={() => setModoAberto('quantidade')}>
                <Shuffle size={20} />
                <span className="pratica-modo-text">
                  <span className="pratica-modo-title">Praticar quantidade específica</span>
                  <span className="pratica-modo-desc">Sorteia questões aleatórias do domínio</span>
                </span>
              </button>
              {modoAberto === 'quantidade' && (
                <div className="pratica-modo-body">
                  <div className="pratica-quick-picks">
                    {QUICK_PICKS.filter((n) => n <= total).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`subject-chip ${quantidade === n ? 'subject-chip--selected' : ''}`}
                        onClick={() => setQuantidade(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="settings-stepper">
                    <button className="stepper-btn" onClick={() => setQuantidade((q) => Math.max(1, q - 5))}>
                      <Minus size={16} />
                    </button>
                    <span className="stepper-value">{Math.min(quantidade, total)}</span>
                    <button className="stepper-btn" onClick={() => setQuantidade((q) => Math.min(total, q + 5))}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => setRun({ questoes: sampleRandom(questoesDoDominio, quantidade), modo: 'quantidade' })}
                  >
                    Começar ({Math.min(quantidade, total)} questões)
                  </button>
                </div>
              )}
            </div>

            <div className={`pratica-modo-card ${modoAberto === 'todas' ? 'pratica-modo-card--active' : ''}`}>
              <button className="pratica-modo-header" onClick={() => setModoAberto('todas')}>
                <ListChecks size={20} />
                <span className="pratica-modo-text">
                  <span className="pratica-modo-title">Praticar todas</span>
                  <span className="pratica-modo-desc">Todas as {total} questões, em ordem</span>
                </span>
              </button>
              {modoAberto === 'todas' && (
                <div className="pratica-modo-body">
                  <button
                    className="btn-primary"
                    onClick={() =>
                      setRun({
                        questoes: [...questoesDoDominio].sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
                        modo: 'todas',
                      })
                    }
                  >
                    Começar ({total} questões)
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
