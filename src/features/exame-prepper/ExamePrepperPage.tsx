import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { FileQuestion, History, RefreshCw } from 'lucide-react';
import { db } from '../../db/database';
import { seedSimuladosPrepper } from '../../db/seed';
import { formatPercent } from '../simulados/simuladoUtils';
import { DomainBreakdownCard } from './DomainBreakdownCard';
import { domainStatsAcrossAllAttempts } from './domainStats';

/**
 * Landing page for Exame Prepper — questions imported from an outside
 * source, kept in their own simuladosPrepper/questoesPrepper/tentativasPrepper
 * tables so they never mix with the CSA course's own Simulados/Banco de
 * Questões or its Progresso stats. Mirrors SimuladosPage's layout/flow
 * exactly; only the data source and labels ("Simulados Prepper") differ.
 */
export function ExamePrepperPage() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);

  const simulados = useLiveQuery(() => db.simuladosPrepper.toArray(), []);
  const tentativas = useLiveQuery(() => db.tentativasPrepper.toArray(), []);
  const domainStats = useLiveQuery(() => domainStatsAcrossAllAttempts(), []);

  const statsFor = (simuladoId?: number) => {
    const attempts = (tentativas ?? []).filter((t) => t.simuladoId === simuladoId);
    if (attempts.length === 0) return null;
    const best = attempts.reduce((max, t) => (t.acertos / t.total > max.acertos / max.total ? t : max));
    return { count: attempts.length, best };
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await seedSimuladosPrepper();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="simulados-page">
      <div className="timer-page-header">
        <div>
          <h1 className="timer-page-title">
            Exame Prepper <span className="title-badge">CSA</span>
          </h1>
          <p className="timer-page-subtitle">Questões Prepper, separadas dos simulados do curso</p>
        </div>
        <div className="header-actions">
          <Link to="historico" className="timer-btn-icon" title="Histórico de tentativas">
            <History size={20} />
          </Link>
        </div>
      </div>

      {domainStats && domainStats.length > 0 && (
        <DomainBreakdownCard
          title="Desempenho por domínio"
          subtitle="Acumulado de todas as tentativas de Simulados Prepper"
          stats={domainStats}
          emptyMessage="Nenhuma questão respondida ainda."
        />
      )}

      {simulados?.length === 0 ? (
        <div className="history-empty">
          <FileQuestion size={32} className="history-empty-icon" />
          <p>Nenhum Simulado Prepper disponível ainda.</p>
          <button className="btn-secondary simulados-import-btn" onClick={handleImport} disabled={importing}>
            <RefreshCw size={16} className={importing ? 'spin' : ''} />
            {importing ? 'Importando...' : 'Importar simulados'}
          </button>
        </div>
      ) : (
        <div className="simulados-list">
          {simulados?.map((simulado) => {
            const stats = statsFor(simulado.id);
            return (
              <button
                key={simulado.id}
                className="simulado-card"
                onClick={() => navigate(`${simulado.id}`)}
              >
                <div className="simulado-card-icon">
                  <FileQuestion size={22} />
                </div>
                <div className="simulado-card-info">
                  <span className="simulado-card-name">{simulado.nome}</span>
                  <span className="simulado-card-meta">
                    {simulado.totalQuestoes} questões
                    {stats && ` · ${stats.count} tentativa${stats.count > 1 ? 's' : ''} · melhor ${formatPercent(stats.best.acertos, stats.best.total)}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
