import type { Weight, Category } from './types';

const PARCLE_BASE = 'https://api.parcle.ai/v1';

function getKey(): string | null {
  try {
    return localStorage.getItem('PARCLE_API_KEY');
  } catch {
    return null;
  }
}

/**
 * Store a law as a dialog memory in Parcle. Silent fail — never throws.
 */
export async function storeLawInParcle(
  title: string,
  rationale: string,
  weight: Weight,
  category: Category,
): Promise<void> {
  const key = getKey();
  if (!key) return;

  try {
    await fetch(`${PARCLE_BASE}/ingest/dialog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Architectural decision proposed: ${title} (${category})`,
          },
          {
            role: 'assistant',
            content: `LAW established. Weight: ${weight}. Rationale: ${rationale}`,
          },
        ],
        metadata: { type: 'architectural_law', weight, category },
      }),
    });
  } catch {
    // silent fail — Parcle is optional
  }
}

/**
 * Search Parcle memory for conflicts with a proposed feature.
 * Returns { answer, confidence } or null on failure / missing key.
 */
export async function checkConflictInParcle(
  feature: string,
): Promise<{ answer: string; confidence: number } | null> {
  const key = getKey();
  if (!key) return null;

  try {
    const res = await fetch(`${PARCLE_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        query: `Does this conflict with any prior architectural decision? Feature: ${feature}`,
        limit: 5,
      }),
    });

    if (!res.ok) return null;

    const data: unknown = await res.json();
    return parseParcleResponse(data);
  } catch {
    return null;
  }
}

function parseParcleResponse(
  data: unknown,
): { answer: string; confidence: number } | null {
  if (typeof data !== 'object' || data === null) return null;
  const obj = data as Record<string, unknown>;

  // Try common response shapes defensively.
  let answer = '';
  let confidence = 0;

  if (typeof obj.answer === 'string') {
    answer = obj.answer;
  } else if (typeof obj.summary === 'string') {
    answer = obj.summary;
  }

  if (typeof obj.confidence === 'number') {
    confidence = obj.confidence;
  } else if (typeof obj.score === 'number') {
    confidence = obj.score;
  }

  // Fall back to results array if present.
  const results = obj.results ?? obj.matches ?? obj.data;
  if (Array.isArray(results) && results.length > 0) {
    const texts: string[] = [];
    let maxScore = 0;
    for (const r of results) {
      if (typeof r === 'object' && r !== null) {
        const rr = r as Record<string, unknown>;
        if (typeof rr.content === 'string') texts.push(rr.content);
        else if (typeof rr.text === 'string') texts.push(rr.text);
        if (typeof rr.score === 'number') maxScore = Math.max(maxScore, rr.score);
      }
    }
    if (!answer && texts.length > 0) answer = texts.join(' \n ');
    if (confidence === 0) confidence = maxScore;
  }

  if (!answer && confidence === 0) return null;
  return { answer, confidence };
}
