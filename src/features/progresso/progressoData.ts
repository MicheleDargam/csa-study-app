import { db } from '../../db/database';
import { getCurrentWeekDates, toDateKey } from '../tarefas/taskUtils';
import type { SessaoPratica } from '../../types';

/**
 * Centralized read layer for the Progresso module. Every function here only
 * reads from tables other features already write to (sessions, tentativas,
 * praticas, tentativasPrepper) — this module creates no data of its own.
 * Functions named *Prepper mirror a CSA one exactly but read the separate
 * Exame Prepper tables, so its stats can be shown in their own tab without
 * ever summing into the CSA numbers.
 */

export type Periodo = 'semana' | 'mes';

export const LIMITE_ATENCAO = 60;

function getStartOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getRangeStart(periodo: Periodo): Date {
  return periodo === 'semana' ? getCurrentWeekDates()[0] : getStartOfMonth();
}

function computeStreak(studyDateKeys: string[]): number {
  const uniqueDays = new Set(studyDateKeys);
  if (uniqueDays.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  // Not studied yet today? The streak is still "alive" through yesterday.
  if (!uniqueDays.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (uniqueDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ---- Dashboard overview ----

export interface VisaoGeral {
  horasSemana: number;
  horasMes: number;
  questoesRespondidas: number;
  taxaAcerto: number; // 0-1
  streak: number;
}

export async function getVisaoGeral(): Promise<VisaoGeral> {
  const [sessions, tentativas, praticas, tentativasPrepper, praticasPrepper] = await Promise.all([
    db.sessions.toArray(),
    db.tentativas.toArray(),
    db.praticas.toArray(),
    db.tentativasPrepper.toArray(),
    db.praticasPrepper.toArray(),
  ]);

  const studySessions = sessions.filter((s) => s.type === 'study');
  const weekStart = getCurrentWeekDates()[0];
  const monthStart = getStartOfMonth();

  const secondsSince = (start: Date) =>
    studySessions
      .filter((s) => s.startedAt >= start)
      .reduce((sum, s) => sum + s.duration, 0);

  // Combined across CSA (tentativas/praticas) and Exame Prepper — this is the
  // one place the two intentionally add up, since it's just an overall
  // "how much have I practiced" total; everything below this tile is split
  // by trilha (CSA vs Prepper) instead of summed.
  const questoesRespondidas =
    tentativas.reduce((sum, t) => sum + t.total, 0) +
    praticas.reduce((sum, p) => sum + p.total, 0) +
    tentativasPrepper.reduce((sum, t) => sum + t.total, 0) +
    praticasPrepper.reduce((sum, p) => sum + p.total, 0);
  const acertosTotais =
    tentativas.reduce((sum, t) => sum + t.acertos, 0) +
    praticas.reduce((sum, p) => sum + p.acertos, 0) +
    tentativasPrepper.reduce((sum, t) => sum + t.acertos, 0) +
    praticasPrepper.reduce((sum, p) => sum + p.acertos, 0);

  return {
    horasSemana: secondsSince(weekStart) / 3600,
    horasMes: secondsSince(monthStart) / 3600,
    questoesRespondidas,
    taxaAcerto: questoesRespondidas > 0 ? acertosTotais / questoesRespondidas : 0,
    streak: computeStreak(studySessions.map((s) => toDateKey(s.startedAt))),
  };
}

// ---- Horas de estudo por matéria ----

export interface HorasPorMateria {
  subjectId: number;
  subjectName: string;
  subjectColor: string;
  hours: number;
}

export async function getHorasPorMateria(periodo: Periodo): Promise<HorasPorMateria[]> {
  const start = getRangeStart(periodo);
  const sessions = await db.sessions.where('startedAt').aboveOrEqual(start).toArray();
  const studySessions = sessions.filter((s) => s.type === 'study');

  const map = new Map<number, HorasPorMateria>();
  for (const s of studySessions) {
    const existing = map.get(s.subjectId);
    if (existing) {
      existing.hours += s.duration / 3600;
    } else {
      map.set(s.subjectId, {
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        subjectColor: s.subjectColor,
        hours: s.duration / 3600,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
}

// ---- Desempenho em simulados ----

export interface SimuladoResumo {
  simuladoId: number;
  simuladoNome: string;
  tentativas: number;
}

export async function getSimuladosComTentativas(): Promise<SimuladoResumo[]> {
  const [simulados, tentativas] = await Promise.all([db.simulados.toArray(), db.tentativas.toArray()]);

  const counts = new Map<number, number>();
  for (const t of tentativas) {
    counts.set(t.simuladoId, (counts.get(t.simuladoId) ?? 0) + 1);
  }

  return simulados
    .filter((s) => (counts.get(s.id!) ?? 0) > 0)
    .map((s) => ({ simuladoId: s.id!, simuladoNome: s.nome, tentativas: counts.get(s.id!) ?? 0 }));
}

export interface SimuladoTentativaPonto {
  numero: number;
  percent: number;
  acertos: number;
  total: number;
  completedAt: Date;
}

export async function getEvolucaoSimulado(simuladoId: number): Promise<SimuladoTentativaPonto[]> {
  const tentativas = await db.tentativas.where('simuladoId').equals(simuladoId).sortBy('completedAt');
  return tentativas.map((t, i) => ({
    numero: i + 1,
    percent: t.total > 0 ? Math.round((t.acertos / t.total) * 100) : 0,
    acertos: t.acertos,
    total: t.total,
    completedAt: t.completedAt,
  }));
}

// ---- Same two, for Exame Prepper's separate tables ----

export async function getSimuladosPrepperComTentativas(): Promise<SimuladoResumo[]> {
  const [simulados, tentativas] = await Promise.all([
    db.simuladosPrepper.toArray(),
    db.tentativasPrepper.toArray(),
  ]);

  const counts = new Map<number, number>();
  for (const t of tentativas) {
    counts.set(t.simuladoId, (counts.get(t.simuladoId) ?? 0) + 1);
  }

  return simulados
    .filter((s) => (counts.get(s.id!) ?? 0) > 0)
    .map((s) => ({ simuladoId: s.id!, simuladoNome: s.nome, tentativas: counts.get(s.id!) ?? 0 }));
}

export async function getEvolucaoSimuladoPrepper(simuladoId: number): Promise<SimuladoTentativaPonto[]> {
  const tentativas = await db.tentativasPrepper.where('simuladoId').equals(simuladoId).sortBy('completedAt');
  return tentativas.map((t, i) => ({
    numero: i + 1,
    percent: t.total > 0 ? Math.round((t.acertos / t.total) * 100) : 0,
    acertos: t.acertos,
    total: t.total,
    completedAt: t.completedAt,
  }));
}

// ---- Desempenho por tema (Banco de Questões) ----

export interface TemaDesempenho {
  tema: string;
  acertos: number;
  total: number;
  percent: number;
}

export async function getDesempenhoPorTema(): Promise<TemaDesempenho[]> {
  const praticas = await db.praticas.toArray();

  const map = new Map<string, { acertos: number; total: number }>();
  for (const p of praticas) {
    const existing = map.get(p.tema) ?? { acertos: 0, total: 0 };
    existing.acertos += p.acertos;
    existing.total += p.total;
    map.set(p.tema, existing);
  }

  return Array.from(map.entries())
    .map(([tema, v]) => ({
      tema,
      acertos: v.acertos,
      total: v.total,
      percent: v.total > 0 ? Math.round((v.acertos / v.total) * 100) : 0,
    }))
    .sort((a, b) => a.percent - b.percent); // weakest topics first
}

// ---- Comparação mensal por tema (mês atual vs mês passado) ----
//
// This is a pure aggregation over the same `praticas` rows already used by
// getDesempenhoPorTema — nothing is ever snapshotted, reset, or archived.
// "Virar o mês" naturally happens because every SessaoPratica already
// carries its own completedAt: querying by calendar-month range IS the
// monthly cycle, so redoing a tema's questions next month automatically
// shows up as a new data point to compare against.

export interface TemaComparativoMensal {
  tema: string;
  percentAtual: number | null; // null = no practice this month yet
  totalAtual: number;
  percentAnterior: number | null; // null = wasn't practiced last month
  totalAnterior: number;
}

function getMonthBounds(monthsAgo: number, from = new Date()): { start: Date; end: Date } {
  const start = new Date(from.getFullYear(), from.getMonth() - monthsAgo, 1);
  const end = new Date(from.getFullYear(), from.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

function aggregateTemaInRange(
  praticas: SessaoPratica[],
  start: Date,
  end: Date,
): Map<string, { acertos: number; total: number }> {
  const map = new Map<string, { acertos: number; total: number }>();
  for (const p of praticas) {
    if (p.completedAt >= start && p.completedAt < end) {
      const existing = map.get(p.tema) ?? { acertos: 0, total: 0 };
      existing.acertos += p.acertos;
      existing.total += p.total;
      map.set(p.tema, existing);
    }
  }
  return map;
}

export async function getDesempenhoPorTemaComparativoMensal(): Promise<TemaComparativoMensal[]> {
  const praticas = await db.praticas.toArray();
  const atual = getMonthBounds(0);
  const anterior = getMonthBounds(1);

  const mapAtual = aggregateTemaInRange(praticas, atual.start, atual.end);
  const mapAnterior = aggregateTemaInRange(praticas, anterior.start, anterior.end);

  const temas = new Set([...mapAtual.keys(), ...mapAnterior.keys()]);

  return Array.from(temas)
    .map((tema) => {
      const a = mapAtual.get(tema);
      const p = mapAnterior.get(tema);
      return {
        tema,
        totalAtual: a?.total ?? 0,
        percentAtual: a && a.total > 0 ? Math.round((a.acertos / a.total) * 100) : null,
        totalAnterior: p?.total ?? 0,
        percentAnterior: p && p.total > 0 ? Math.round((p.acertos / p.total) * 100) : null,
      };
    })
    .sort((a, b) => {
      // Weakest current-month performance first; not-yet-practiced-this-month sorts last
      if (a.percentAtual === null && b.percentAtual === null) return 0;
      if (a.percentAtual === null) return 1;
      if (b.percentAtual === null) return -1;
      return a.percentAtual - b.percentAtual;
    });
}
