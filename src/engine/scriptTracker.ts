/**
 * Tracks spoken words against a written script so the prompter scrolls at the
 * speaker's pace rather than a fixed speed.
 *
 * Speech recognition output is not the script. It arrives lowercased and
 * unpunctuated, mishears words, drops filler, and revises itself as more audio
 * arrives. So matching is fuzzy and forward-biased:
 *
 *  - Only a window ahead of the current position is searched. A presenter who
 *    repeats a word that also appears in paragraph one must not send the
 *    prompter back to the top.
 *  - The cursor never moves backwards. Recognisers routinely revise the tail of
 *    their transcript, and letting that rewind the script makes the prompter
 *    jitter on screen, which is worse than lagging slightly.
 *  - A match has to clear a similarity floor. Advancing on a weak match drifts
 *    the prompter ahead of the speaker, which is the failure people notice.
 */

export interface TrackerOptions {
  /** How far ahead of the cursor to look for the next match. */
  windowSize?: number;
  /** Minimum normalised similarity for a token to count as matched. */
  threshold?: number;
}

const DEFAULTS: Required<TrackerOptions> = { windowSize: 12, threshold: 0.8 };

/** Strips punctuation and case so script tokens compare against raw speech. */
export const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

/** Levenshtein distance, iterative with a single row to stay allocation-light. */
export const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
};

/** 1 for identical, 0 for nothing in common. */
export const similarity = (a: string, b: string): number => {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - levenshtein(a, b) / longest;
};

/**
 * Advances the cursor to the furthest script token the speech plausibly reached.
 *
 * Returns the new cursor, never less than the one passed in.
 */
export const advanceCursor = (
  scriptTokens: string[],
  spokenTokens: string[],
  cursor: number,
  options: TrackerOptions = {},
): number => {
  const { windowSize, threshold } = { ...DEFAULTS, ...options };
  if (!scriptTokens.length || !spokenTokens.length) return cursor;

  let position = cursor;
  // Bound the work per tick. The transcript grows for the whole take, so
  // matching all of it on every result makes each tick progressively more
  // expensive during exactly the long recordings this app is for. For in-order
  // speech the outcome is the same either way -- this is a cost guard, not a
  // behavioural one, and no unit test distinguishes it.
  const recent = spokenTokens.slice(-windowSize);

  for (const spoken of recent) {
    const end = Math.min(position + windowSize, scriptTokens.length);
    let bestIndex = -1;
    let bestScore = threshold;
    for (let i = position; i < end; i++) {
      const score = similarity(scriptTokens[i], spoken);
      // Strictly greater: on a tie the earliest candidate wins, which keeps the
      // prompter behind the speaker rather than ahead of them.
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    if (bestIndex >= 0) position = bestIndex + 1;
  }
  // Forward-only is structural, not a clamp: the search starts at the cursor
  // and every match sets position past itself, so this can only grow. A
  // Math.max here would be redundant and no test could tell it from its
  // absence.
  return Math.min(position, scriptTokens.length);
};

/** Vertical offset, in lines, for a cursor position. */
export const cursorToLine = (cursor: number, tokensPerLine: number): number =>
  tokensPerLine > 0 ? Math.floor(cursor / tokensPerLine) : 0;
