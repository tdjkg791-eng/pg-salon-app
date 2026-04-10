export type ParsedIntent =
  | { kind: 'weight'; weightKg: number; slot: 'morning' | 'evening' | 'unknown' }
  | { kind: 'menstrual_start' }
  | { kind: 'day_complete' }
  | { kind: 'text'; text: string };

const PURE_NUMBER_RE = /^\s*(\d{1,3}(?:\.\d+)?)\s*(?:kg|キロ)?\s*$/i;

export function parseLineMessage(text: string, receivedAt: Date): ParsedIntent {
  const trimmed = text.trim();

  const numMatch = trimmed.match(PURE_NUMBER_RE);
  if (numMatch) {
    const weightKg = parseFloat(numMatch[1]);
    const hour = receivedAt.getHours();
    let slot: 'morning' | 'evening' | 'unknown' = 'unknown';
    if (hour < 7 || text.includes('朝')) {
      slot = 'morning';
    } else if (hour >= 18 || text.includes('晩') || text.includes('夜')) {
      slot = 'evening';
    }
    return { kind: 'weight', weightKg, slot };
  }

  if (text.includes('生理')) {
    return { kind: 'menstrual_start' };
  }

  if (text.includes('終わり')) {
    return { kind: 'day_complete' };
  }

  return { kind: 'text', text };
}
