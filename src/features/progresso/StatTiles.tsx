import { CheckCircle2, Clock, Flame } from 'lucide-react';
import type { VisaoGeral } from './progressoData';

interface StatTilesProps {
  data: VisaoGeral;
}

function formatHours(hours: number): string {
  if (hours < 0.05) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  return `${hours.toFixed(1)}h`;
}

export function StatTiles({ data }: StatTilesProps) {
  const tiles = [
    { icon: Clock, label: 'Horas esta semana', value: formatHours(data.horasSemana) },
    { icon: Clock, label: 'Horas este mês', value: formatHours(data.horasMes) },
    {
      icon: CheckCircle2,
      label: 'Questões respondidas',
      value: String(data.questoesRespondidas),
      sub: `${Math.round(data.taxaAcerto * 100)}% de acerto`,
    },
    {
      icon: Flame,
      label: 'Sequência de estudo',
      value: String(data.streak),
      sub: data.streak === 1 ? 'dia seguido' : 'dias seguidos',
    },
  ];

  return (
    <div className="stat-tiles-grid">
      {tiles.map((tile) => (
        <div key={tile.label} className="stat-tile">
          <tile.icon size={16} className="stat-tile-icon" />
          <span className="stat-tile-value">{tile.value}</span>
          <span className="stat-tile-label">{tile.label}</span>
          {tile.sub && <span className="stat-tile-sub">{tile.sub}</span>}
        </div>
      ))}
    </div>
  );
}
