import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getEvolucaoSimulado, getSimuladosComTentativas, type SimuladoResumo, type SimuladoTentativaPonto } from './progressoData';
import { ChartTooltip } from './ChartTooltip';
import { CHART_ACCENT, CHART_AXIS_TEXT, CHART_GRID, CHART_TOOLTIP_BG } from './chartTheme';
import { formatAttemptDate } from '../simulados/simuladoUtils';

interface SimuladoEvolucaoChartProps {
  title?: string;
  emptyMessage?: string;
  /** Defaults to the CSA tables — pass the Prepper equivalents to reuse this chart there. */
  getResumos?: () => Promise<SimuladoResumo[]>;
  getEvolucao?: (simuladoId: number) => Promise<SimuladoTentativaPonto[]>;
}

export function SimuladoEvolucaoChart({
  title = 'Desempenho nos simulados',
  emptyMessage = 'Nenhuma tentativa de simulado registrada ainda.',
  getResumos = getSimuladosComTentativas,
  getEvolucao = getEvolucaoSimulado,
}: SimuladoEvolucaoChartProps) {
  const resumos = useLiveQuery(() => getResumos(), [getResumos]);
  const [selecionado, setSelecionado] = useState<number | null>(null);

  useEffect(() => {
    if (selecionado === null && resumos && resumos.length > 0) {
      setSelecionado(resumos[0].simuladoId);
    }
  }, [resumos, selecionado]);

  const pontos = useLiveQuery(
    () => (selecionado !== null ? getEvolucao(selecionado) : Promise.resolve([])),
    [selecionado, getEvolucao],
  );

  return (
    <div className="progresso-card">
      <h2 className="progresso-card-title">{title}</h2>

      {!resumos || resumos.length === 0 ? (
        <p className="progresso-empty">{emptyMessage}</p>
      ) : (
        <>
          <div className="subject-chips progresso-simulado-chips">
            {resumos.map((r) => (
              <button
                key={r.simuladoId}
                type="button"
                className={`subject-chip ${selecionado === r.simuladoId ? 'subject-chip--selected' : ''}`}
                onClick={() => setSelecionado(r.simuladoId)}
              >
                {r.simuladoNome}
              </button>
            ))}
          </div>

          {pontos && pontos.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={pontos} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID} />
                  <XAxis
                    dataKey="numero"
                    tickFormatter={(v: number) => `#${v}`}
                    tick={{ fill: CHART_AXIS_TEXT, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{ fill: CHART_AXIS_TEXT, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip content={<ChartTooltip valueSuffix="%" />} cursor={{ stroke: CHART_GRID }} />
                  <Line
                    type="monotone"
                    dataKey="percent"
                    stroke={CHART_ACCENT}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHART_ACCENT, strokeWidth: 2, stroke: CHART_TOOLTIP_BG }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="progresso-attempt-list">
                {[...pontos].reverse().map((p) => (
                  <div key={p.numero} className="progresso-attempt-row">
                    <span className="progresso-attempt-numero">Tentativa {p.numero}</span>
                    <span className="progresso-attempt-data">{formatAttemptDate(p.completedAt)}</span>
                    <span className="progresso-attempt-score">
                      {p.acertos}/{p.total} · {p.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
