import { supabase } from './supabase';
import { storeLawInParcle, checkConflictInParcle } from './parcle';
import type { Law, AuditEntry, ActionType, CheckResult } from './types';

export async function getLaws(): Promise<Law[]> {
  const { data, error } = await supabase
    .from('laws')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Law[];
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as AuditEntry[];
}

export async function storeAudit(
  action_type: ActionType,
  title: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase
    .from('audit_log')
    .insert({ action_type, title, details });

  if (error) throw error;
}

export type NewLaw = Omit<Law, 'created_at' | 'health' | 'check_count'> &
  Partial<Pick<Law, 'health' | 'check_count'>>;

export async function storeLaw(law: NewLaw): Promise<Law> {
  const payload = {
    id: law.id,
    title: law.title,
    description: law.description,
    category: law.category,
    rationale: law.rationale,
    weight: law.weight,
    depends_on: law.depends_on ?? [],
    health: law.health ?? 'HEALTHY',
    check_count: law.check_count ?? 0,
  };

  const { data, error } = await supabase
    .from('laws')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  await storeLawInParcle(law.title, law.rationale, law.weight, law.category);
  await storeAudit('LAW_ADDED', law.title, {
    id: law.id,
    weight: law.weight,
    category: law.category,
  });

  return data as Law;
}

const CONFLICT_TERMS = [
  'conflict',
  'contradict',
  'violates',
  'violate',
  'inconsistent',
  'previously',
  'different',
];

function containsConflictTerm(text: string): boolean {
  const lower = text.toLowerCase();
  return CONFLICT_TERMS.some((t) => lower.includes(t));
}

function countMentionedLaws(answer: string, laws: Law[]): Law[] {
  const lower = answer.toLowerCase();
  return laws.filter((law) => {
    const title = law.title.toLowerCase();
    const cat = law.category.toLowerCase();
    return (
      lower.includes(law.id.toLowerCase()) ||
      lower.includes(title) ||
      lower.includes(cat)
    );
  });
}

/**
 * Local keyword fallback used when Parcle is unavailable.
 * Matches the feature text against law titles and categories.
 */
function localFallbackCheck(feature: string, laws: Law[]): CheckResult {
  const lower = feature.toLowerCase();
  const tokens = lower.split(/[^a-z0-9]+/).filter((t) => t.length > 2);

  const matched: Law[] = [];
  for (const law of laws) {
    const titleWords = law.title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const catWord = law.category.toLowerCase();
    const hit =
      titleWords.some((w) => w.length > 2 && lower.includes(w)) ||
      tokens.includes(catWord) ||
      lower.includes(law.title.toLowerCase());
    if (hit) matched.push(law);
  }

  // Detect "alternative tech" style contradictions for matched categories.
  const negativeHints = [
    'instead of',
    'replace',
    'switch to',
    'migrate',
    'drop',
    'remove',
    'no longer',
    'without',
  ];
  const hasNegative = negativeHints.some((h) => lower.includes(h));

  if (matched.length > 0 && hasNegative) {
    const violatedLaw = matched.reduce((a, b) =>
      weightRank(a.weight) >= weightRank(b.weight) ? a : b,
    );
    if (matched.length > 1) {
      return {
        state: 'CASCADE',
        answer: `Local check: feature touches multiple governed areas (${matched
          .map((l) => l.id)
          .join(', ')}) with a substitution intent.`,
        confidence: 0.5,
        violatedLaw,
        cascadeLaws: matched,
      };
    }
    return {
      state: 'CONFLICT',
      answer: `Local check: feature appears to contradict ${violatedLaw.id} — ${violatedLaw.title}.`,
      confidence: 0.5,
      violatedLaw,
    };
  }

  return {
    state: 'CLEAR',
    answer:
      matched.length > 0
        ? `Local check: aligns with existing laws (${matched
            .map((l) => l.id)
            .join(', ')}).`
        : 'Local check: no governed area matched. Proceed.',
    confidence: 0.3,
    cascadeLaws: matched.length > 0 ? matched : undefined,
  };
}

function weightRank(w: Law['weight']): number {
  if (w === 'CRITICAL') return 3;
  if (w === 'STANDARD') return 2;
  return 1;
}

export async function checkConflict(
  feature: string,
  laws: Law[],
): Promise<CheckResult> {
  let result: CheckResult;

  const parcle = await checkConflictInParcle(feature);

  if (parcle) {
    const { answer, confidence } = parcle;
    const mentioned = countMentionedLaws(answer, laws);
    const isConflict = confidence > 0.4 && containsConflictTerm(answer);
    const isCascade = confidence > 0.6 && mentioned.length > 1;

    if (isCascade) {
      result = {
        state: 'CASCADE',
        answer,
        confidence,
        violatedLaw: mentioned[0],
        cascadeLaws: mentioned,
      };
    } else if (isConflict) {
      result = {
        state: 'CONFLICT',
        answer,
        confidence,
        violatedLaw: mentioned[0],
      };
    } else {
      result = {
        state: 'CLEAR',
        answer,
        confidence,
        cascadeLaws: mentioned.length > 0 ? mentioned : undefined,
      };
    }
  } else {
    // Parcle unavailable / failed → local fallback.
    result = localFallbackCheck(feature, laws);
  }

  // Audit the check outcome.
  if (result.state === 'CONFLICT' || result.state === 'CASCADE') {
    await storeAudit('CONFLICT_DETECTED', feature, {
      state: result.state,
      confidence: result.confidence,
      violatedLaw: result.violatedLaw?.id ?? null,
      cascadeLaws: result.cascadeLaws?.map((l) => l.id) ?? [],
    });
  } else {
    await storeAudit('CHECK_PASSED', feature, {
      confidence: result.confidence,
    });
  }

  // Best-effort: bump check_count on involved laws.
  void bumpCheckCounts(result, laws);

  return result;
}

async function bumpCheckCounts(result: CheckResult, laws: Law[]): Promise<void> {
  const involved = new Set<string>();
  if (result.violatedLaw) involved.add(result.violatedLaw.id);
  result.cascadeLaws?.forEach((l) => involved.add(l.id));
  if (involved.size === 0) return;

  await Promise.all(
    Array.from(involved).map(async (id) => {
      const law = laws.find((l) => l.id === id);
      if (!law) return;
      await supabase
        .from('laws')
        .update({ check_count: (law.check_count ?? 0) + 1 })
        .eq('id', id);
    }),
  );
}

export function computeHealthScore(audit: AuditEntry[]): number {
  let conflicts = 0;
  let amendments = 0;
  let prevented = 0;

  for (const entry of audit) {
    if (entry.action_type === 'CONFLICT_DETECTED') conflicts++;
    else if (entry.action_type === 'AMENDMENT_PROPOSED') amendments++;
    else if (entry.action_type === 'BUILD_CANCELLED') prevented++;
  }

  const score = 100 - conflicts * 15 - amendments * 5 + prevented * 2;
  return Math.max(0, Math.min(100, score));
}

export function generateLawId(laws: Law[]): string {
  let max = 0;
  for (const law of laws) {
    const match = /^LAW-(\d+)$/.exec(law.id);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  const next = max + 1;
  return `LAW-${String(next).padStart(3, '0')}`;
}
