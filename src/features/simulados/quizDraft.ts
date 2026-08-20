/**
 * Persists in-progress quiz answers to localStorage so a phone locking up,
 * the browser reclaiming a backgrounded tab, or an accidental reload never
 * wipes an unfinished Simulado/Banco de Questões attempt — only a final
 * submit (or an explicit "começar do zero") clears the draft.
 */
export interface QuizDraft {
  questaoIds: number[];
  currentIndex: number;
  answers: Record<number, number[]>;
  startedAt: string; // ISO
}

function storageKey(draftKey: string): string {
  return `csa-quiz-draft:${draftKey}`;
}

/**
 * Read a draft's question ids without validating them against a specific
 * question list. Used by callers whose question set isn't known yet at
 * mount time (e.g. Banco de Questões' randomly-sampled runs), so they can
 * reconstruct the same set before rendering QuizRunner.
 */
export function peekDraftQuestionIds(draftKey: string): number[] | null {
  try {
    const raw = localStorage.getItem(storageKey(draftKey));
    if (!raw) return null;
    const draft: QuizDraft = JSON.parse(raw);
    return draft.questaoIds.length > 0 ? draft.questaoIds : null;
  } catch {
    return null;
  }
}

/**
 * Load a draft only if its question set exactly matches the given ids
 * (same length, same order) — a mismatch means the draft belongs to a
 * different simulado/sample and should be ignored rather than shown as a
 * confusing partial resume.
 */
export function loadMatchingDraft(draftKey: string, questaoIds: number[]): QuizDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(draftKey));
    if (!raw) return null;
    const draft: QuizDraft = JSON.parse(raw);
    if (
      draft.questaoIds.length !== questaoIds.length ||
      draft.questaoIds.some((id, i) => id !== questaoIds[i])
    ) {
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveDraft(draftKey: string, draft: QuizDraft): void {
  try {
    localStorage.setItem(storageKey(draftKey), JSON.stringify(draft));
  } catch {
    // Storage full/unavailable — resuming just won't work, not fatal.
  }
}

export function clearDraft(draftKey: string): void {
  localStorage.removeItem(storageKey(draftKey));
}
