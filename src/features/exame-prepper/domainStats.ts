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

/**
 * A generated exam ("Gerar Simulado") has no real simuladoId to look its
 * roster up by — it stores the exact questaoIds it drew instead, so this
 * falls back to that whenever present. Fixed Simulados Prepper keep working
 * off simuladoId as before.
 */
async function getRosterForTentativa(t: TentativaSimulado): Promise<Questao[]> {
  if (t.questaoIds && t.questaoIds.length > 0) {
    const fetched = await db.questoesPrepper.bulkGet(t.questaoIds);
    return fetched.filter((q): q is Questao => !!q);
  }
  return db.questoesPrepper.where('simuladoId').equals(t.simuladoId).toArray();
}

/** Per-domain correct/total for a single Exame Prepper attempt (fixed or generated). */
export async function domainStatsForAttempt(tentativa: TentativaSimulado): Promise<DomainStat[]> {
  const questoes = await getRosterForTentativa(tentativa);
  const byDomain = new Map<string, DomainStat>();
  tallyByDomain(questoes, tentativa.erros, byDomain);
  return sortByDomainOrder([...byDomain.values()]);
}

/** Per-domain correct/total summed across every Exame Prepper attempt ever taken. */
export async function domainStatsAcrossAllAttempts(): Promise<DomainStat[]> {
  const tentativas: TentativaSimulado[] = await db.tentativasPrepper.toArray();
  const byDomain = new Map<string, DomainStat>();

  // Cache each fixed simulado's question roster — the same exam may be
  // retaken more than once, and its roster doesn't change between attempts.
  // Generated attempts each drew their own one-off set, so they're never
  // worth caching.
  const rosterCache = new Map<number, Questao[]>();
  for (const t of tentativas) {
    let questoes: Questao[];
    if (t.questaoIds && t.questaoIds.length > 0) {
      questoes = await getRosterForTentativa(t);
    } else {
      questoes = rosterCache.get(t.simuladoId) ?? (await getRosterForTentativa(t));
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
