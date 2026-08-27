import { db } from '../../db/database';
import type { Questao, TentativaErro, TentativaSimulado } from '../../types';

// The 6 official CSA exam domains, in the order the certification's own
// score report lists them — questoesPrepper.tema is expected to hold one of
// these exact strings per question so the breakdown below can group by it.
export const PREPPER_DOMAINS = [
  'Platform Overview and Navigation',
  'Instance Configuration',
  'Configuring Applications for Collaboration',
  'Self Service & Automation',
  'Database Management and Platform Security',
  'Data Migration and Integration',
] as const;

export interface DomainStat {
  domain: string;
  correct: number;
  total: number;
}

/** Sort by the fixed PREPPER_DOMAINS order; anything unrecognized goes last. */
function sortByDomainOrder(stats: DomainStat[]): DomainStat[] {
  const rank = (domain: string) => {
    const i = PREPPER_DOMAINS.indexOf(domain as (typeof PREPPER_DOMAINS)[number]);
    return i === -1 ? PREPPER_DOMAINS.length : i;
  };
  return [...stats].sort((a, b) => rank(a.domain) - rank(b.domain));
}

function tallyByDomain(questoes: Questao[], erros: TentativaErro[], byDomain: Map<string, DomainStat>): void {
  const wrongIds = new Set(erros.map((e) => e.questaoId));
  for (const q of questoes) {
    const entry = byDomain.get(q.tema) ?? { domain: q.tema, correct: 0, total: 0 };
    entry.total += 1;
    if (q.id && !wrongIds.has(q.id)) entry.correct += 1;
    byDomain.set(q.tema, entry);
  }
}

/** Per-domain correct/total for a single Simulado Prepper attempt. */
export async function domainStatsForAttempt(simuladoId: number, erros: TentativaErro[]): Promise<DomainStat[]> {
  const questoes = await db.questoesPrepper.where('simuladoId').equals(simuladoId).toArray();
  const byDomain = new Map<string, DomainStat>();
  tallyByDomain(questoes, erros, byDomain);
  return sortByDomainOrder([...byDomain.values()]);
}

/** Per-domain correct/total summed across every Exame Prepper attempt ever taken. */
export async function domainStatsAcrossAllAttempts(): Promise<DomainStat[]> {
  const tentativas: TentativaSimulado[] = await db.tentativasPrepper.toArray();
  const byDomain = new Map<string, DomainStat>();

  // Cache each simulado's question roster — the same exam may be retaken
  // more than once, and its roster doesn't change between attempts.
  const rosterCache = new Map<number, Questao[]>();
  for (const t of tentativas) {
    let questoes = rosterCache.get(t.simuladoId);
    if (!questoes) {
      questoes = await db.questoesPrepper.where('simuladoId').equals(t.simuladoId).toArray();
      rosterCache.set(t.simuladoId, questoes);
    }
    tallyByDomain(questoes, t.erros, byDomain);
  }

  return sortByDomainOrder([...byDomain.values()]);
}

export function formatDomainPercent(stat: DomainStat): string {
  if (stat.total === 0) return '0%';
  return `${Math.round((stat.correct / stat.total) * 100)}%`;
}
