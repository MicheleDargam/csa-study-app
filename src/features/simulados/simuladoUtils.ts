import type { Questao } from '../../types';

/** Multi-select questions have more than one correct index in the answer key. */
export function isMultiSelect(questao: Questao): boolean {
  return questao.respostaCorreta.length > 1;
}

/** Order-independent set equality, used to grade both single and multi-select questions. */
export function sameAnswerSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, i) => value === sortedB[i]);
}

export function formatPercent(acertos: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((acertos / total) * 100)}%`;
}

export function formatAttemptDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** MM:SS for the in-progress exam timer. */
export function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
