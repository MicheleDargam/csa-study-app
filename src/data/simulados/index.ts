import simulado1 from './simulado_1_csa.json';
import simulado2 from './simulado_2_csa.json';
import simulado3 from './simulado_3_curso_consolidado.json';
import simulado4 from './simulado_4_curso_consolidado.json';
import simulado5 from './simulado_5_curso_consolidado.json';
import simulado6 from './simulado_6_curso_consolidado.json';
import simulado7 from './simulado_7_curso_consolidado.json';
import simulado8 from './simulado_8_curso_consolidado.json';
import simulado9 from './simulado_9_curso_consolidado.json';

export interface QuestaoJSON {
  id: string;
  materia: string;
  tema: string;
  enunciado: string;
  alternativas: string[];
  resposta_correta: number[];
  nota?: string;
  enunciado_pt?: string;
  alternativas_pt?: string[];
  imagem?: string; // path under public/, e.g. "prepper-images/q123.png"
}

export interface SimuladoJSON {
  simulado: string;
  questoes: QuestaoJSON[];
}

// Simulados 3-9 hold the deduplicated, topic-mixed "Curso Consolidado" set:
// all 407 questions from the 7 raw course batches (Simulados 3-9's earlier
// content) were merged, exact-repeat question stems removed (386 unique
// remained), and redistributed into 6 simulados of 60 + 1 of 26 with each
// subject spread evenly across them. Simulados 1 and 2 are untouched.
export const BUNDLED_SIMULADOS: SimuladoJSON[] = [simulado1, simulado2, simulado3, simulado4, simulado5, simulado6, simulado7, simulado8, simulado9];
