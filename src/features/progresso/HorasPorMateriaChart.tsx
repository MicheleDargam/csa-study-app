import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getHorasPorMateria, type Periodo } from './progressoData';
import { ChartTooltip } from './ChartTooltip';
import { CHART_AXIS_TEXT, CHART_GRID } from './chartTheme';

export function HorasPorMateriaChart() {
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const dados = useLiveQuery(() => getHorasPorMateria(periodo), [periodo]);

  return (
    <div className="progresso-card">
      <div className="progresso-card-header">
        <h2 className="progresso-card-title">Horas de estudo por matéria</h2>
        <div className="segmented-control progresso-mini-toggle">
          <button
            className={`segmented-btn ${periodo === 'semana' ? 'segmented-btn--active' : ''}`}
            onClick={() => setPeriodo('semana')}
          >
            Semana
          </button>
          <button
            className={`segmented-btn ${periodo === 'mes' ? 'segmented-btn--active' : ''}`}
            onClick={() => setPeriodo('mes')}
          >
            Mês
          </button>
        </div>
      </div>

      {!dados || dados.length === 0 ? (
        <p className="progresso-empty">
          Nenhuma sessão de estudo registrada {periodo === 'semana' ? 'esta semana' : 'este mês'} ainda.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(120, dados.length * 44)}>
          <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 4 }}>
            <CartesianGrid horizontal={false} stroke={CHART_GRID} />
            <XAxis
              type="number"
              tick={{ fill: CHART_AXIS_TEXT, fontSize: 11 }}
              tickFormatter={(v: number) => `${v}h`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="subjectName"
              tick={{ fill: CHART_AXIS_TEXT, fontSize: 12 }}
              width={112}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip valueFormatter={(v) => v.toFixed(1)} valueSuffix="h" />}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="hours" barSize={18} radius={[0, 4, 4, 0]}>
              {dados.map((d) => (
                <Cell key={d.subjectId} fill={d.subjectColor} />
              ))}
              <LabelList
                dataKey="hours"
                position="right"
                formatter={(v) => `${Number(v).toFixed(1)}h`}
                fill={CHART_AXIS_TEXT}
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
