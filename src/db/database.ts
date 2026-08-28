import Dexie, { type EntityTable } from 'dexie';
import type {
  Subject,
  StudySession,
  Task,
  Simulado,
  Questao,
  TentativaSimulado,
  SessaoPratica,
  Lembrete,
} from '../types';

class StudyTimerDB extends Dexie {
  subjects!: EntityTable<Subject, 'id'>;
  sessions!: EntityTable<StudySession, 'id'>;
  tasks!: EntityTable<Task, 'id'>;
  simulados!: EntityTable<Simulado, 'id'>;
  questoes!: EntityTable<Questao, 'id'>;
  tentativas!: EntityTable<TentativaSimulado, 'id'>;
  praticas!: EntityTable<SessaoPratica, 'id'>;
  lembretes!: EntityTable<Lembrete, 'id'>;
  // Exame Prepper: same shapes as simulados/questoes/tentativas above, kept
  // in their own tables (not the Banco de Questões ones) on purpose — these
  // hold questions from an outside source and must never mix into the
  // existing question bank or its stats.
  simuladosPrepper!: EntityTable<Simulado, 'id'>;
  questoesPrepper!: EntityTable<Questao, 'id'>;
  tentativasPrepper!: EntityTable<TentativaSimulado, 'id'>;
  // Questões Prepper: practice-by-domain over questoesPrepper, same shape
  // and purpose as `praticas` above but scoped to the Prepper pool.
  praticasPrepper!: EntityTable<SessaoPratica, 'id'>;

  constructor() {
    super('CSAStudyTimerDB');

    this.version(1).stores({
      subjects: '++id, name, createdAt',
      sessions: '++id, subjectId, startedAt, [subjectId+startedAt]',
    });

    // v2: adds daily/weekly tasks, linked to a subject and optionally to a timer session
    this.version(2).stores({
      subjects: '++id, name, createdAt',
      sessions: '++id, subjectId, startedAt, [subjectId+startedAt]',
      tasks: '++id, subjectId, date, [subjectId+date]',
    });

    // v3: adds practice exams (simulados) — questions and completed attempts
    this.version(3).stores({
      subjects: '++id, name, createdAt',
      sessions: '++id, subjectId, startedAt, [subjectId+startedAt]',
      tasks: '++id, subjectId, date, [subjectId+date]',
      simulados: '++id, &nome, createdAt',
      questoes: '++id, simuladoId, [simuladoId+ordem]',
      tentativas: '++id, simuladoId, completedAt, [simuladoId+completedAt]',
    });

    // v4: adds Banco de Questões — practice by tema/materia over the same
    // questoes already stored for simulados, plus its own attempt history
    this.version(4).stores({
      subjects: '++id, name, createdAt',
      sessions: '++id, subjectId, startedAt, [subjectId+startedAt]',
      tasks: '++id, subjectId, date, [subjectId+date]',
      simulados: '++id, &nome, createdAt',
      questoes: '++id, simuladoId, tema, materia, [simuladoId+ordem]',
      tentativas: '++id, simuladoId, completedAt, [simuladoId+completedAt]',
      praticas: '++id, tema, materia, completedAt, [tema+completedAt]',
    });

    // v5: externalId becomes a unique index, so standalone question batches
    // (no simuladoId, e.g. loose material from a professor) can be deduped
    // by their original id the same way simulados are deduped by nome
    this.version(5).stores({
      subjects: '++id, name, createdAt',
      sessions: '++id, subjectId, startedAt, [subjectId+startedAt]',
      tasks: '++id, subjectId, date, [subjectId+date]',
      simulados: '++id, &nome, createdAt',
      questoes: '++id, &externalId, simuladoId, tema, materia, [simuladoId+ordem]',
      tentativas: '++id, simuladoId, completedAt, [simuladoId+completedAt]',
      praticas: '++id, tema, materia, completedAt, [tema+completedAt]',
    });

    // v6: adds Lembretes (study-time + pending-tasks reminders). `ativo` is a
    // boolean and IndexedDB can't index boolean keys, so it's read via
    // toArray() + filter, not a Dexie index.
    this.version(6).stores({
      subjects: '++id, name, createdAt',
      sessions: '++id, subjectId, startedAt, [subjectId+startedAt]',
      tasks: '++id, subjectId, date, [subjectId+date]',
      simulados: '++id, &nome, createdAt',
      questoes: '++id, &externalId, simuladoId, tema, materia, [simuladoId+ordem]',
      tentativas: '++id, simuladoId, completedAt, [simuladoId+completedAt]',
      praticas: '++id, tema, materia, completedAt, [tema+completedAt]',
      lembretes: '++id, tipo',
    });

    // v7: adds Exame Prepper — a self-contained set of simulados/questoes/
    // tentativas tables for questions imported from an outside source, kept
    // fully separate from the existing Banco de Questões data and from the
    // Progresso charts (which only ever read the v3/v4 tables above).
    this.version(7).stores({
      subjects: '++id, name, createdAt',
      sessions: '++id, subjectId, startedAt, [subjectId+startedAt]',
      tasks: '++id, subjectId, date, [subjectId+date]',
      simulados: '++id, &nome, createdAt',
      questoes: '++id, &externalId, simuladoId, tema, materia, [simuladoId+ordem]',
      tentativas: '++id, simuladoId, completedAt, [simuladoId+completedAt]',
      praticas: '++id, tema, materia, completedAt, [tema+completedAt]',
      lembretes: '++id, tipo',
      simuladosPrepper: '++id, &nome, createdAt',
      questoesPrepper: '++id, &externalId, simuladoId, tema, materia, [simuladoId+ordem]',
      tentativasPrepper: '++id, simuladoId, completedAt, [simuladoId+completedAt]',
    });

    // v8: adds Questões Prepper — practice-by-domain over questoesPrepper
    // (mirrors praticas/Banco de Questões), plus a "Gerar Simulado" flow
    // that draws a fresh 60-question exam (10 per domain) on the fly; both
    // read/write the existing Prepper tables above, so only one new table
    // (praticasPrepper) is needed here.
    this.version(8).stores({
      subjects: '++id, name, createdAt',
      sessions: '++id, subjectId, startedAt, [subjectId+startedAt]',
      tasks: '++id, subjectId, date, [subjectId+date]',
      simulados: '++id, &nome, createdAt',
      questoes: '++id, &externalId, simuladoId, tema, materia, [simuladoId+ordem]',
      tentativas: '++id, simuladoId, completedAt, [simuladoId+completedAt]',
      praticas: '++id, tema, materia, completedAt, [tema+completedAt]',
      lembretes: '++id, tipo',
      simuladosPrepper: '++id, &nome, createdAt',
      questoesPrepper: '++id, &externalId, simuladoId, tema, materia, [simuladoId+ordem]',
      tentativasPrepper: '++id, simuladoId, completedAt, [simuladoId+completedAt]',
      praticasPrepper: '++id, tema, materia, completedAt, [tema+completedAt]',
    });
  }
}

export const db = new StudyTimerDB();

/**
 * Delete a subject and cascade-delete its tasks; any lembrete linked to it
 * keeps existing but loses the matéria tag (its schedule is still valid on
 * its own, so deleting the whole reminder would be more destructive than
 * the user asked for). Study sessions keep their own snapshotted
 * subjectName/subjectColor, so past history stays intact and readable even
 * after the subject is gone.
 */
export async function deleteSubjectCascade(subjectId: number): Promise<void> {
  await db.transaction('rw', db.subjects, db.tasks, db.lembretes, async () => {
    await db.tasks.where('subjectId').equals(subjectId).delete();

    const lembretes = await db.lembretes.toArray();
    for (const lembrete of lembretes) {
      if (lembrete.subjectId === subjectId && lembrete.id) {
        await db.lembretes.update(lembrete.id, { subjectId: undefined });
      }
    }

    await db.subjects.delete(subjectId);
  });
}
