import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Database, History } from 'lucide-react';
import { db } from '../../db/database';
import { PREPPER_DOMAINS } from './domainStats';

interface DomainGroup {
  domain: string;
  count: number;
}

/**
 * Same idea as Banco de Questões (practice by grouping, not a fixed exam),
 * but for Exame Prepper — grouped by domain instead of tema/matéria, since
 * every Prepper question already carries one of the 6 CSA domains in its
 * own `tema` field and shares the same `materia`, so a matéria breakdown
 * wouldn't say anything a domain one doesn't already.
 */
export function QuestoesPrepperPage() {
  const navigate = useNavigate();
  const questoes = useLiveQuery(() => db.questoesPrepper.toArray(), []);

  const porDominio = useMemo<DomainGroup[]>(() => {
    const counts = new Map<string, number>();
    for (const q of questoes ?? []) {
      counts.set(q.tema, (counts.get(q.tema) ?? 0) + 1);
    }
    const known = PREPPER_DOMAINS.filter((d) => counts.has(d)).map((d) => ({ domain: d, count: counts.get(d)! }));
    const unknown = [...counts.keys()]
      .filter((d) => !(PREPPER_DOMAINS as readonly string[]).includes(d))
      .map((d) => ({ domain: d, count: counts.get(d)! }));
    return [...known, ...unknown];
  }, [questoes]);

  return (
    <div className="simulados-page">
      <div className="timer-page-header">
        <div className="materias-page-heading">
          <button className="timer-btn-icon" onClick={() => navigate('/exame-prepper')} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="timer-page-title">Questões Prepper</h1>
        </div>
        <Link to="historico" className="timer-btn-icon" title="Histórico de prática">
          <History size={20} />
        </Link>
      </div>

      {questoes?.length === 0 ? (
        <div className="history-empty">
          <Database size={32} className="history-empty-icon" />
          <p>Nenhuma questão disponível ainda.</p>
        </div>
      ) : (
        <div className="materias-list">
          {porDominio.map((item) => (
            <button
              key={item.domain}
              className="tema-row"
              onClick={() => navigate(`dominio?nome=${encodeURIComponent(item.domain)}`)}
            >
              <span className="tema-row-name">{item.domain}</span>
              <span className="tema-row-count">{item.count} questões</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
