import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle } from 'lucide-react';
import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDesempenhoPorTema, LIMITE_ATENCAO } from './progressoData';
import { ChartTooltip } from './ChartTooltip';
import { CHART_AXIS_TEXT, STATUS_GOOD, STATUS_WARNING } from './chartTheme';

export function TemaDesempenhoChart() {
  const dados = useLiveQuery(() => getDesempenhoPorTema(), []);

  return (
    <div className="progresso-card">
      <h2 className="progresso-card-title">Desempenho por tema</h2>
      <p className="progresso-card-subtitle">Taxa de acerto nas práticas do Banco de Questões</p>

      {!dados || dados.length === 0 ? (
        <p className="progresso-empty">Nenhuma sessão de prática registrada ainda.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(140, dados.length * 40)}>
            <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 4 }}>
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fill: CHART_AXIS_TEXT, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="tema"
                tick={{ fill: CHART_AXIS_TEXT, fontSize: 11 }}
                width={128}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine x={LIMITE_ATENCAO} stroke={CHART_AXIS_TEXT} strokeDasharray="4 4" />
              <Tooltip content={<ChartTooltip valueSuffix="%" />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="percent" barSize={16} radius={[0, 4, 4, 0]}>
                {dados.map((d) => (
                  <Cell key={d.tema} fill={d.percent < LIMITE_ATENCAO ? STATUS_WARNING : STATUS_GOOD} />
                ))}
                <LabelList
                  dataKey="percent"
                  position="right"
                  formatter={(v) => `${Number(v)}%`}
                  fill={CHART_AXIS_TEXT}
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="progresso-tema-legend">
            <span className="progresso-tema-legend-item">
              <span className="progresso-tema-legend-dot" style={{ backgroundColor: STATUS_GOOD }} />
              {LIMITE_ATENCAO}% ou mais
            </span>
            <span className="progresso-tema-legend-item">
              <span className="progresso-tema-legend-dot" style={{ backgroundColor: STATUS_WARNING }} />
              <AlertTriangle size={12} /> abaixo de {LIMITE_ATENCAO}% — revisar
            </span>
          </div>
        </>
      )}
    </div>
  );
}
