interface ChartTooltipPayloadEntry {
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadEntry[];
  label?: string | number;
  valueSuffix?: string;
  valueFormatter?: (value: number) => string;
}

/**
 * Shared recharts tooltip renderer: value leads (Strong), series identity
 * rides a short line-key rather than a filled box, and every value shown
 * here is also reachable via the chart's direct labels — this only enhances.
 */
export function ChartTooltip({ active, payload, label, valueSuffix = '', valueFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="chart-tooltip">
      {label !== undefined && <div className="chart-tooltip-label">{label}</div>}
      {payload.map((entry, i) => {
        const raw = typeof entry.value === 'number' ? entry.value : Number(entry.value);
        const display = valueFormatter && !Number.isNaN(raw) ? valueFormatter(raw) : entry.value;
        return (
          <div key={i} className="chart-tooltip-row">
            <span className="chart-tooltip-key" style={{ backgroundColor: entry.color }} />
            <span className="chart-tooltip-value">
              {display}
              {valueSuffix}
            </span>
          </div>
        );
      })}
    </div>
  );
}
