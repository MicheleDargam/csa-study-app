import type { SimuladoJSON } from '../simulados';
import simuladoPrepper1 from './simulado_1_prepper.json';
import simuladoPrepper2 from './simulado_2_prepper.json';
import simuladoPrepper3 from './simulado_3_prepper.json';
import simuladoPrepper4 from './simulado_4_prepper.json';
import simuladoPrepper5 from './simulado_5_prepper.json';
import simuladoPrepper6 from './simulado_6_prepper.json';

// Exame Prepper: questions from an outside source, kept fully separate from
// the CSA course's own Simulados/Banco de Questões. Same JSON shape as
// src/data/simulados/ (see SimuladoJSON/QuestaoJSON there) — one file per
// "Simulado Prepper".
//
// Simulados 1-6 hold the first 366 questions gathered from the source site
// (Doc1-Doc4, screenshotted one question at a time), split into even
// 61-question chunks in their original order. Each question's `tema` holds
// one of the 6 official CSA exam domains (see PREPPER_DOMAINS in
// domainStats.ts) — Claude classified these from each question's content,
// since the source site only shows domain in its own aggregate score
// report, not per question. A handful of externalIds (prep_q049,
// prep_q173, prep_q191, prep_q362, prep_q370) are intentionally absent:
// the user skipped questions on the source site that had no marked answer,
// plus one exact duplicate (prep_q173 restated prep_q172 verbatim).
export const BUNDLED_SIMULADOS_PREPPER: SimuladoJSON[] = [
  simuladoPrepper1,
  simuladoPrepper2,
  simuladoPrepper3,
  simuladoPrepper4,
  simuladoPrepper5,
  simuladoPrepper6,
];
