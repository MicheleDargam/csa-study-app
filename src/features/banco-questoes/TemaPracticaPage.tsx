import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ListChecks, Minus, Plus, Shuffle } from 'lucide-react';
import { db } from '../../db/database';
import { QuizRunner, type QuizResult } from '../simulados/QuizRunner';
import { sampleRandom } from './practiceUtils';
import type { Questao } from '../../types';

type Modo = 'quantidade' | 'todas';

const QUICK_PICKS = [10, 20, 30];

export function TemaPracticaPage() {
  const [searchParams] = useSearchParams();
  const tema = searchParams.get('nome') ?? '';
  const materia = searchParams.get('materia') ?? '';
  const navigate = useNavigate();

  const questoesDoTema = useLiveQuery(
    () => db.questoes.where('tema').equals(tema).and((q) => !materia || q.materia === materia).toArray(),
    [tema, materia],
  );

  const [modoAberto, setModoAberto] = useState<Modo>('quantidade');
  const [quantidade, setQuantidade] = useState(10);
  const [run, setRun] = useState<{ questoes: Questao[]; modo: Modo } | null>(null);

  const total = questoesDoTema?.length ?? 0;

  const handleFinish = async (result: QuizResult) => {
    if (!run) return;
    const praticaId = await db.praticas.add({
      tema,
      materia,
      modo: run.modo,
      ...result,
    });
    navigate(`/simulados/banco/resultado/${praticaId}`, { replace: true });
  };

  if (run) {
    return (
      <QuizRunner
        title={tema}
        questoes={run.questoes}
        onBack={() => setRun(null)}
        onFinish={handleFinish}
      />
    );
  }

  if (!questoesDoTema) {
    return <div className="simulados-page" />;
  }

  return (
    <div className="simulados-page">
      <div className="timer-page-header">
        <div className="materias-page-heading">
          <button className="timer-btn-icon" onClick={() => navigate('/simulados/banco')} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="timer-page-title">{tema}</h1>
        </div>
      </div>

      {total === 0 ? (
        <div className="history-empty">
          <p>Nenhuma questão encontrada para este tema.</p>
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
                  <span className="pratica-modo-desc">Sorteia questões aleatórias do tema</span>
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
                    onClick={() => setRun({ questoes: sampleRandom(questoesDoTema, quantidade), modo: 'quantidade' })}
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
                        questoes: [...questoesDoTema].sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
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
