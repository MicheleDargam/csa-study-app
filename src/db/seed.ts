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
