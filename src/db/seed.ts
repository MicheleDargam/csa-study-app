import { db } from './database';
import { DEFAULT_MATERIAS } from '../features/materias/materiaColors';
import { BUNDLED_SIMULADOS, type QuestaoJSON } from '../data/simulados';
import { BUNDLED_AVULSAS } from '../data/avulsas';

/**
 * Seed the default CSA study subjects on first run only.
 * Safe to call multiple times (including concurrently, e.g. React
 * StrictMode's double-invoked effects) — the count-check and insert run
 * inside one transaction so a second overlapping call always sees the
 * rows the first one just added instead of racing to insert its own copy.
 */
export async function seedDefaultMaterias(): Promise<void> {
  await db.transaction('rw', db.subjects, async () => {
    const count = await db.subjects.count();
    if (count === 0) {
      await db.subjects.bulkAdd(
        DEFAULT_MATERIAS.map((materia) => ({ ...materia, createdAt: new Date() })),
      );
    }
  });
}

// Old default subject names (pre-unification) mapped to the tema name they
// conceptually correspond to. Renaming (not delete+recreate) keeps the
// subjectId stable, so any tasks/sessions already linked to it stay intact.
const MATERIA_RENAMES: Record<string, string> = {
  'Integrações': 'Integrations (Flow Designer)',
  'Reporting & Performance Analytics': 'Reporting',
  'User Interface': 'UI Fundamentals',
};

const MATERIAS_TEMAS_MIGRATION_FLAG = 'csa-materias-temas-migration-v1';

/**
 * One-time migration that aligns the "Matérias" list (Timer/Tarefas) with
 * the "temas" taxonomy used to tag questions in the Banco de Questões, so
 * hours studied and question performance can be compared for the same
 * topic instead of living on two disconnected lists. Renames subjects that
 * map 1:1 onto a tema (see MATERIA_RENAMES) and adds any tema not yet
 * represented as a new subject. Never deletes a subject — a few old
 * defaults (Now Platform, Service Portal, App Engine Studio) have no
 * matching tema and are left for the user to remove manually if unused.
 * Guarded by a localStorage flag so it only runs once per browser; safe to
 * call multiple times regardless (idempotent, and DB writes are wrapped in
 * one transaction so StrictMode's double-invoked effects can't race).
 */
export async function migrateMateriasParaTemas(): Promise<void> {
  if (localStorage.getItem(MATERIAS_TEMAS_MIGRATION_FLAG)) return;

  await db.transaction('rw', db.subjects, async () => {
    const subjects = await db.subjects.toArray();

    for (const [oldName, newName] of Object.entries(MATERIA_RENAMES)) {
      const match = subjects.find((s) => s.name === oldName);
      if (match?.id) {
        await db.subjects.update(match.id, { name: newName });
      }
    }

    const currentNames = new Set((await db.subjects.toArray()).map((s) => s.name));
    const missing = DEFAULT_MATERIAS.filter((m) => !currentNames.has(m.name));
    if (missing.length > 0) {
      await db.subjects.bulkAdd(missing.map((m) => ({ ...m, createdAt: new Date() })));
    }
  });

  localStorage.setItem(MATERIAS_TEMAS_MIGRATION_FLAG, '1');
}

// Exact `nome` values of the 7 raw course-batch Simulados (3-9) that were
// replaced by the deduplicated, topic-mixed "Curso Consolidado" set.
const OLD_CURSO_SIMULADO_NOMES = [
  'Simulado 3 - Curso (Questões 61-120)',
  'Simulado 4 - Curso (Questões 121-180)',
  'Simulado 5 - Curso (Questões 181-240)',
  'Simulado 6 - Curso (Questões 241-300)',
  'Simulado 7 - Curso (Questões 301-360)',
  'Simulado 8 - Curso (Questões 1-60)',
  'Simulado 9 - Curso (Questões 361-407)',
];

const CURSO_SIMULADOS_DEDUP_MIGRATION_FLAG = 'csa-curso-simulados-dedup-migration-v1';

/**
 * One-time migration that removes the 7 raw "Simulado N - Curso (Questões
 * X-Y)" records (their questoes and attempt history included) once they've
 * been replaced by the deduplicated "Curso Consolidado" set under the same
 * Simulado 3-9 slots. Without this, a browser that already imported the old
 * batches would keep their (sometimes duplicate) questoes rows around
 * forever — seedSimulados() only ever adds/updates by nome, it never
 * deletes, so the old rows would silently linger and keep showing up in
 * Banco de Questões even after the new consolidated files are seeded.
 * Simulados 1 and 2 are untouched. Guarded by a localStorage flag so it
 * only runs once per browser; DB writes are wrapped in one transaction so
 * StrictMode's double-invoked effects can't race.
 */
export async function migrateDedupCursoSimulados(): Promise<void> {
  if (localStorage.getItem(CURSO_SIMULADOS_DEDUP_MIGRATION_FLAG)) return;

  await db.transaction('rw', db.simulados, db.questoes, db.tentativas, async () => {
    for (const nome of OLD_CURSO_SIMULADO_NOMES) {
      const simulado = await db.simulados.where('nome').equals(nome).first();
      if (!simulado?.id) continue;

      await db.questoes.where('simuladoId').equals(simulado.id).delete();
      await db.tentativas.where('simuladoId').equals(simulado.id).delete();
      await db.simulados.delete(simulado.id);
    }
  });

  localStorage.setItem(CURSO_SIMULADOS_DEDUP_MIGRATION_FLAG, '1');
}

// externalIds of questoes removed from the bundled JSON because they were
// word-for-word duplicates of another question already covered elsewhere
// (mostly material_professor_1.json restating a question that was also
// already in a Simulado, plus a handful of Curso Consolidado questions that
// duplicated one already in Simulado 2). Found by comparing every bundled
// question's normalized enunciado against every other one (2026-08-27).
const DUPLICATE_QUESTOES_EXTERNAL_IDS = [
  'mat_q01', 'mat_q02', 'mat_q03', 'mat_q04', 'mat_q05', 'mat_q06', 'mat_q07', 'mat_q08',
  'mat_q09', 'mat_q10', 'mat_q11', 'mat_q12', 'mat_q13', 'mat_q14', 'mat_q15', 'mat_q16',
  'mat_q17', 'mat_q18', 'mat_q19', 'mat_q20', 'mat_q21', 'mat_q22', 'mat_q23', 'mat_q24',
  'mat_q25', 'mat_q26', 'mat_q27', 'mat_q28', 'mat_q29', 'mat_q30', 'mat_q31', 'mat_q32',
  'mat_q33', 'mat_q40', 'mat_q41', 'mat_q42', 'mat_q43', 'mat_q44', 'mat_q45', 'mat_q46',
  'mat_q47', 'mat_q48', 'mat_q49', 'mat_q50', 'mat_q51', 'mat_q52', 'mat_q54', 'mat_q55',
  'mat_q56', 'mat_q57', 'mat_q58', 'mat_q59', 'mat_q60', 'mat_q61', 'mat_q62', 'mat_q63',
  'mat_q64', 'mat_q65', 'mat_q66', 'mat_q67', 'mat_q68', 'mat_q69', 'mat_q70', 'mat_q71',
  'mat_q72', 'mat_q73', 'mat_q74', 'mat_q76', 'mat_q77', 'mat_q78', 'mat_q79', 'mat_q80',
  'mat_q81', 'mat_q82', 'mat_q83', 'mat_q84', 'mat_q85', 'mat_q86', 'mat_q87', 'mat_q88',
  'mat_q89', 'mat_q90', 'mat_q91', 'mat_q92', 'mat_q93', 'mat_q94', 'mat_q95', 'mat_q96',
  'mat_q97', 'mat_q98', 'mat_q99', 'mat_q100', 'mat_q101', 'mat_q102',
  'curso3_q33', 'curso3_q37', 'curso3_q60',
  'curso5_q39',
  'curso6_q34', 'curso6_q42', 'curso6_q45',
  'curso7_q13', 'curso7_q32', 'curso7_q44', 'curso7_q58',
  'curso8_q60',
];

const DUPLICATE_QUESTOES_MIGRATION_FLAG = 'csa-duplicate-questoes-migration-v1';

/**
 * One-time migration that deletes the questoes rows listed in
 * DUPLICATE_QUESTOES_EXTERNAL_IDS from a browser that already imported them
 * before the bundled JSON was deduplicated. Without this, seedSimulados()/
 * seedAvulsas() only ever insert-or-update by externalId — they never
 * delete a row just because it was dropped from the source JSON — so a
 * browser that saw the old files would keep showing the duplicates in
 * Banco de Questões forever. Any past tentativa that scored one of these
 * questions wrong keeps its stale questaoId reference, but ResultadoView
 * already filters out erros whose questao no longer resolves, so old
 * attempt history stays intact (just minus that one review row) instead of
 * breaking. Guarded by a localStorage flag so it only runs once per
 * browser; DB writes are wrapped in one transaction so StrictMode's
 * double-invoked effects can't race.
 */
export async function migrateRemoveDuplicateQuestoes(): Promise<void> {
  if (localStorage.getItem(DUPLICATE_QUESTOES_MIGRATION_FLAG)) return;

  await db.transaction('rw', db.questoes, async () => {
    await db.questoes.where('externalId').anyOf(DUPLICATE_QUESTOES_EXTERNAL_IDS).delete();
  });

  localStorage.setItem(DUPLICATE_QUESTOES_MIGRATION_FLAG, '1');
}

type UpsertResult = 'inserted' | 'updated' | 'unchanged';

/**
 * Insert a question by its externalId, or sync its content fields if it's
 * already in the DB but drifted from the source JSON (answer key
 * corrections, a fixed nota, reworded text, etc.). This is what lets
 * fixing a JSON file and redeploying actually correct data that was
 * already imported into someone's browser — a plain "skip if exists"
 * dedup would leave the old, wrong content there forever.
 * `simuladoId` is only passed for questions belonging to a fixed simulado;
 * omitted for standalone/avulsas questions.
 */
async function upsertQuestao(q: QuestaoJSON, ordem: number, simuladoId?: number): Promise<UpsertResult> {
  const existing = await db.questoes.where('externalId').equals(q.id).first();

  const fields = {
    materia: q.materia,
    tema: q.tema,
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    respostaCorreta: q.resposta_correta,
    nota: q.nota,
    enunciadoPt: q.enunciado_pt,
    alternativasPt: q.alternativas_pt,
  };

  if (!existing) {
    await db.questoes.add({ externalId: q.id, simuladoId, ordem, ...fields });
    return 'inserted';
  }

  const changed =
    existing.materia !== fields.materia ||
    existing.tema !== fields.tema ||
    existing.enunciado !== fields.enunciado ||
    existing.nota !== fields.nota ||
    existing.enunciadoPt !== fields.enunciadoPt ||
    JSON.stringify(existing.alternativas) !== JSON.stringify(fields.alternativas) ||
    JSON.stringify(existing.respostaCorreta) !== JSON.stringify(fields.respostaCorreta) ||
    JSON.stringify(existing.alternativasPt) !== JSON.stringify(fields.alternativasPt);

  if (changed) {
    await db.questoes.update(existing.id!, fields);
    return 'updated';
  }

  return 'unchanged';
}

/**
 * Load the bundled simulado JSON files into IndexedDB, one Simulado record
 * per file plus its Questao records. Each file is matched independently by
 * name — a new simulado gets created once, but its questoes are always
 * re-synced against the source (via upsertQuestao) so answer-key fixes
 * reach browsers that already imported it. Files are never merged/deduped
 * against each other.
 */
export async function seedSimulados(): Promise<void> {
  for (const raw of BUNDLED_SIMULADOS) {
    await db.transaction('rw', db.simulados, db.questoes, async () => {
      let simulado = await db.simulados.where('nome').equals(raw.simulado).first();

      if (!simulado) {
        const newId = (await db.simulados.add({
          nome: raw.simulado,
          totalQuestoes: raw.questoes.length,
          createdAt: new Date(),
        })) as number;
        simulado = { id: newId, nome: raw.simulado, totalQuestoes: raw.questoes.length, createdAt: new Date() };
      } else if (simulado.totalQuestoes !== raw.questoes.length) {
        await db.simulados.update(simulado.id!, { totalQuestoes: raw.questoes.length });
      }

      for (let index = 0; index < raw.questoes.length; index++) {
        await upsertQuestao(raw.questoes[index], index, simulado.id);
      }
    });
  }
}

/**
 * Seed the single built-in "tarefas pendentes" reminder on first run only.
 * Starts paused (ativo: false) — the user opts in explicitly, which is also
 * when notification permission gets requested.
 */
export async function seedLembretePadrao(): Promise<void> {
  await db.transaction('rw', db.lembretes, async () => {
    const exists = await db.lembretes.where('tipo').equals('tarefas-pendentes').count();
    if (exists === 0) {
      await db.lembretes.add({
        tipo: 'tarefas-pendentes',
        horario: '21:00',
        diasSemana: [0, 1, 2, 3, 4, 5, 6],
        ativo: false,
        createdAt: new Date(),
      });
    }
  });
}

export interface AvulsasImportSummary {
  origem: string;
  novas: number;
  atualizadas: number;
  ignoradas: number;
}

/**
 * Load loose question batches (no fixed simulado — e.g. professor material)
 * into the same `questoes` table used by simulados, but without a
 * simuladoId, so they only ever surface in Banco de Questões. Matched by
 * each question's externalId via upsertQuestao — new ones are inserted,
 * previously-imported ones get their answer key/nota/text corrected if the
 * source JSON changed, and untouched ones are left alone.
 */
export async function seedAvulsas(): Promise<AvulsasImportSummary[]> {
  const summaries: AvulsasImportSummary[] = [];

  for (const batch of BUNDLED_AVULSAS) {
    let novas = 0;
    let atualizadas = 0;
    let ignoradas = 0;

    await db.transaction('rw', db.questoes, async () => {
      for (let index = 0; index < batch.questoes.length; index++) {
        const result = await upsertQuestao(batch.questoes[index], index);
        if (result === 'inserted') novas += 1;
        else if (result === 'updated') atualizadas += 1;
        else ignoradas += 1;
      }
    });

    summaries.push({ origem: batch.origem, novas, atualizadas, ignoradas });
  }

  return summaries;
}
