import simulado1 from './simulado_1_csa.json';
import simulado2 from './simulado_2_csa.json';
import simulado3 from './simulado_3_curso_61_120.json';
import simulado4 from './simulado_4_curso_121_180.json';

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
export const BUNDLED_SIMULADOS: SimuladoJSON[] = [simulado1, simulado2, simulado3, simulado4];
