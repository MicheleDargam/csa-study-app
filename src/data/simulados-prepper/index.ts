import type { SimuladoJSON } from '../simulados';

// Exame Prepper: questions from an outside source, kept fully separate from
// the CSA course's own Simulados/Banco de Questões. Same JSON shape as
// src/data/simulados/ (see SimuladoJSON/QuestaoJSON there) — one file per
// "Simulado Prepper", added here as they're assembled from the incoming
// question batches.
//
// Empty for now. To add a batch: drop a new JSON file in this folder (same
// shape as an existing simulado_*.json), import it above and add it to this
// array, then git push — seedSimuladosPrepper() picks it up automatically.
export const BUNDLED_SIMULADOS_PREPPER: SimuladoJSON[] = [];
