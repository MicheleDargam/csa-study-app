import { WEEKDAY_LABELS } from '../tarefas/taskUtils';

export const TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6];

export function currentHHMM(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** True when today is a scheduled day and the scheduled time has already passed. */
export function jaPassouHojeNoHorario(diasSemana: number[], horario: string, now = new Date()): boolean {
  if (!diasSemana.includes(now.getDay())) return false;
  return currentHHMM(now) >= horario;
}

export function formatDiasSemana(dias: number[]): string {
  if (dias.length === 7) return 'Todo dia';
  if (dias.length === 0) return 'Nenhum dia selecionado';

  const sorted = [...dias].sort((a, b) => a - b);
  const isDiasUteis = sorted.length === 5 && sorted.every((d, i) => d === i + 1);
  if (isDiasUteis) return 'Dias de semana';

  const isFimDeSemana = sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6;
  if (isFimDeSemana) return 'Fim de semana';

  return sorted.map((d) => WEEKDAY_LABELS[d]).join(', ');
}
