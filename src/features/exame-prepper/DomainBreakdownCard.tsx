import { LIMITE_ATENCAO } from '../progresso/progressoData';
import { STATUS_GOOD, STATUS_WARNING } from '../progresso/chartTheme';
import { formatDomainPercent, type DomainStat } from './domainStats';

interface DomainBreakdownCardProps {
  title: string;
  subtitle?: string;
  stats: DomainStat[];
  emptyMessage: string;
}

/**
 * Plain CSS bar list (not recharts) since this renders on the eagerly-loaded
 * Exame Prepper page — ProgressoPage is the only place recharts gets pulled
 * in, precisely so it stays out of the main bundle (see App.tsx).
 */
export function DomainBreakdownCard({ title, subtitle, stats, emptyMessage }: DomainBreakdownCardProps) {
  return (
    <div className="progresso-card">
      <h2 className="progresso-card-title">{title}</h2>
      {subtitle && <p className="progresso-card-subtitle">{subtitle}</p>}

      {stats.length === 0 ? (
        <p className="progresso-empty">{emptyMessage}</p>
      ) : (
        <div className="domain-stat-list">
          {stats.map((stat) => {
            const percent = stat.total === 0 ? 0 : Math.round((stat.correct / stat.total) * 100);
            const color = percent < LIMITE_ATENCAO ? STATUS_WARNING : STATUS_GOOD;
            return (
              <div key={stat.domain} className="domain-stat-row">
                <div className="domain-stat-row-header">
                  <span className="domain-stat-name">{stat.domain}</span>
                  <span className="domain-stat-percent">{formatDomainPercent(stat)}</span>
                </div>
                <div className="domain-stat-bar">
                  <div className="domain-stat-fill" style={{ width: `${percent}%`, backgroundColor: color }} />
                </div>
                <span className="domain-stat-count">
                  {stat.correct}/{stat.total} corretas
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
