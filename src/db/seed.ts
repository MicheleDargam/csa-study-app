import { db } from './database';
import { DEFAULT_MATERIAS } from '../features/materias/materiaColors';
import { BUNDLED_SIMULADOS } from '../data/simulados';
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

/**
 * Load the bundled simulado JSON files into IndexedDB, one Simulado record
 * per file plus its Questao records. Each file is checked independently by
 * name, so re-running (app start, or the "Importar" button) only inserts
 * simulados that aren't in the database yet — existing ones are left alone
 * and files are never merged/deduped against each other.
 */
export async function seedSimulados(): Promise<void> {
  for (const raw of BUNDLED_SIMULADOS) {
    await db.transaction('rw', db.simulados, db.questoes, async () => {
      const alreadyImported = await db.simulados.where('nome').equals(raw.simulado).count();
      if (alreadyImported > 0) return;

      // Dexie's key type mirrors Questao['id'] (optional in the interface),
      // but a successful add() always resolves with the real numeric key.
      const simuladoId = (await db.simulados.add({
        nome: raw.simulado,
        totalQuestoes: raw.questoes.length,
        createdAt: new Date(),
      })) as number;

      await db.questoes.bulkAdd(
        raw.questoes.map((q, index) => ({
          simuladoId,
          externalId: q.id,
          materia: q.materia,
          tema: q.tema,
          enunciado: q.enunciado,
          alternativas: q.alternativas,
          respostaCorreta: q.resposta_correta,
          nota: q.nota,
          ordem: index,
        })),
      );
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
  ignoradas: number;
}

/**
 * Load loose question batches (no fixed simulado — e.g. professor material)
 * into the same `questoes` table used by simulados, but without a
 * simuladoId, so they only ever surface in Banco de Questões. Dedup is by
 * each question's original externalId, checked one at a time inside a
 * transaction (safe against concurrent/StrictMode double-invocation) so
 * re-running only inserts the ones that are actually missing.
 */
export async function seedAvulsas(): Promise<AvulsasImportSummary[]> {
  const summaries: AvulsasImportSummary[] = [];

  for (const batch of BUNDLED_AVULSAS) {
    let novas = 0;
    let ignoradas = 0;

    await db.transaction('rw', db.questoes, async () => {
      for (let index = 0; index < batch.questoes.length; index++) {
        const q = batch.questoes[index];
        const exists = await db.questoes.where('externalId').equals(q.id).count();
        if (exists > 0) {
          ignoradas += 1;
          continue;
        }

        await db.questoes.add({
          externalId: q.id,
          materia: q.materia,
          tema: q.tema,
          enunciado: q.enunciado,
          alternativas: q.alternativas,
          respostaCorreta: q.resposta_correta,
          nota: q.nota,
          ordem: index,
          // no simuladoId: standalone question, not tied to any simulado
        });
        novas += 1;
      }
    });

    summaries.push({ origem: batch.origem, novas, ignoradas });
  }

  return summaries;
}
