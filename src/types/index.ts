export interface Subject {
  id?: number;
  name: string;
  color: string;
  createdAt: Date;
}

export interface StudySession {
  id?: number;
  subjectId: number;
  subjectName: string;
  subjectColor: string;
  taskId?: number;
  taskTitle?: string;
  type: 'study' | 'break';
  duration: number; // in seconds
  startedAt: Date;
  completedAt: Date;
}

export interface Task {
  id?: number;
  title: string;
  subjectId: number;
  date: string; // local date key, format YYYY-MM-DD
  status: 'pending' | 'done';
  createdAt: Date;
  completedAt?: Date;
}

export interface Lembrete {
  id?: number;
  tipo: 'horario' | 'tarefas-pendentes';
  titulo?: string; // custom label; only meaningful for tipo 'horario'
  horario: string; // "HH:MM", 24h
  diasSemana: number[]; // 0=Dom .. 6=Sáb
  subjectId?: number; // optional matéria link; only meaningful for tipo 'horario'
  ativo: boolean;
  createdAt: Date;
  ultimoDisparoData?: string; // YYYY-MM-DD — guards against firing twice the same day
}

export interface TimerSettings {
  studyDuration: number; // in minutes (default: 25)
  breakDuration: number; // in minutes (default: 5)
}

export type TimerPhase = 'idle' | 'study' | 'break';
export type TimerStatus = 'running' | 'paused' | 'stopped';

export interface Simulado {
  id?: number;
  nome: string; // e.g. "Simulado 1 - CSA ServiceNow" — dedup key on import
  totalQuestoes: number;
  createdAt: Date;
}

export interface Questao {
  id?: number;
  // Absent for standalone questions imported outside any simulado (e.g. loose
  // material from a professor) — those only ever surface in Banco de Questões.
  simuladoId?: number;
  externalId: string; // original id from the source JSON (e.g. "sim1_q01"), globally unique
  materia: string;
  tema: string;
  enunciado: string;
  alternativas: string[];
  respostaCorreta: number[]; // indices into alternativas; length > 1 = multi-select
  nota?: string; // optional caveat about the answer key, shown during review
  ordem: number; // preserves original question order within the simulado
  enunciadoPt?: string; // PT-BR translation, shown alongside the English text when toggled
  alternativasPt?: string[]; // same order/length as `alternativas`
}

export interface TentativaErro {
  questaoId: number;
  selecionadas: number[];
}

export interface TentativaSimulado {
  id?: number;
  simuladoId: number;
  simuladoNome: string;
  acertos: number;
  total: number;
  erros: TentativaErro[];
  startedAt: Date;
  completedAt: Date;
  duracaoSegundos: number;
}

/**
 * A practice session from the Banco de Questões module — same shape as
 * TentativaSimulado (acertos/total/erros/tempo) so both feed the future
 * progress charts uniformly, but scoped by tema instead of simuladoId.
 */
export interface SessaoPratica {
  id?: number;
  tema: string;
  materia: string;
  modo: 'quantidade' | 'todas';
  acertos: number;
  total: number;
  erros: TentativaErro[];
  startedAt: Date;
  completedAt: Date;
  duracaoSegundos: number;
}
