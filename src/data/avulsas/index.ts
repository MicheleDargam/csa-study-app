import type { QuestaoJSON } from '../simulados';
import materialProfessor1 from './material_professor_1.json';

export interface AvulsasJSON {
  origem: string;
  questoes: QuestaoJSON[];
}

// Loose question batches that don't belong to any fixed simulado (e.g.
// professor-provided material). They only ever surface in Banco de
// Questões, grouped by tema/materia like everything else in questoes.
export const BUNDLED_AVULSAS: AvulsasJSON[] = [materialProfessor1];
