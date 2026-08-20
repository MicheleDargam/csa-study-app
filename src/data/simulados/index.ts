import simulado1 from './simulado_1_csa.json';
import simulado2 from './simulado_2_csa.json';
import simulado3 from './simulado_3_curso_61_120.json';
import simulado4 from './simulado_4_curso_121_180.json';
import simulado5 from './simulado_5_curso_181_240.json';
import simulado6 from './simulado_6_curso_241_300.json';
import simulado7 from './simulado_7_curso_301_360.json';
import simulado8 from './simulado_8_curso_1_60.json';

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
}

export interface SimuladoJSON {
  simulado: string;
  questoes: QuestaoJSON[];
}

// Each JSON file is one independent simulado — never merged or deduped
// against another file, even when questions look similar across them.
export const BUNDLED_SIMULADOS: SimuladoJSON[] = [simulado1, simulado2, simulado3, simulado4, simulado5, simulado6, simulado7, simulado8];
