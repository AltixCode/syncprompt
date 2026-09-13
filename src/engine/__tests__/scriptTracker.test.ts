/**
 * These pin the behaviours that make a voice-tracked prompter usable. Each
 * failure mode below still "works" in a demo and falls apart on a real take.
 */
import { advanceCursor, similarity, tokenize, cursorToLine } from '../scriptTracker';

const script = tokenize(
  'Welcome back to the channel. Today we are building a teleprompter that follows your voice.',
);

describe('tokenize', () => {
  it('strips punctuation and case so script tokens compare against raw speech', () => {
    // Recognisers return unpunctuated lowercase text; comparing against
    // "Welcome" or "channel." would never match.
    expect(tokenize('Welcome back, friends!')).toEqual(['welcome', 'back', 'friends']);
  });

  it("keeps apostrophes, which carry meaning in contractions", () => {
    expect(tokenize("don't stop")).toEqual(["don't", 'stop']);
  });
});

describe('similarity', () => {
  it('scores identical words 1', () => expect(similarity('voice', 'voice')).toBe(1));
  it('scores a near miss high', () => expect(similarity('teleprompter', 'teleprompte')).toBeGreaterThan(0.9));
  it('scores unrelated words low', () => expect(similarity('voice', 'zebra')).toBeLessThan(0.4));
  it('treats two empty strings as equal', () => expect(similarity('', '')).toBe(1));
});

describe('advanceCursor', () => {
  it('advances as the speaker reads', () => {
    const cursor = advanceCursor(script, tokenize('welcome back to the channel'), 0);
    expect(cursor).toBeGreaterThanOrEqual(5);
  });

  it('tolerates a misheard word', () => {
    // "channel" misheard as "chanel" must not stall the prompter.
    const cursor = advanceCursor(script, tokenize('welcome back to the chanel'), 0);
    expect(cursor).toBeGreaterThanOrEqual(5);
  });

  it('never moves backwards when the recogniser revises its transcript', () => {
    // Recognisers rewrite the tail of their transcript as more audio arrives.
    // Re-hearing the opening line must not rewind a prompter that is already
    // eight words in -- on screen that reads as the script jumping backwards.
    const ahead = advanceCursor(script, tokenize('today we are building'), 8);
    expect(ahead).toBeGreaterThan(8);
    const revised = advanceCursor(script, tokenize('welcome back to the channel'), ahead);
    expect(revised).toBeGreaterThanOrEqual(ahead);
  });

  it('does not jump ahead to a match beyond the search window', () => {
    // A word that appears far later in the script must not yank the prompter
    // there: the presenter is still near the top, and skipping a paragraph
    // mid-take is unrecoverable.
    const long = tokenize(`${'filler '.repeat(40)}pomegranate`);
    const cursor = advanceCursor(long, tokenize('pomegranate'), 0, { windowSize: 12 });
    expect(cursor).toBeLessThanOrEqual(12);
  });

  it('honours a widened window when one is asked for', () => {
    const long = tokenize(`${'filler '.repeat(20)}pomegranate`);
    const cursor = advanceCursor(long, tokenize('pomegranate'), 0, { windowSize: 40 });
    expect(cursor).toBe(long.length);
  });

  it('does not jump to an earlier repeat of the same word', () => {
    const repeated = tokenize('the quick fox and the slow fox');
    // Cursor already past the first "fox"; hearing "fox" again must not rewind.
    const cursor = advanceCursor(repeated, tokenize('fox'), 5);
    expect(cursor).toBeGreaterThanOrEqual(5);
  });

  it('ignores speech that matches nothing', () => {
    const cursor = advanceCursor(script, tokenize('zebra xylophone quartz'), 3);
    expect(cursor).toBe(3);
  });

  it('does not race past the end of the script', () => {
    const cursor = advanceCursor(script, tokenize(script.join(' ')), 0);
    expect(cursor).toBeLessThanOrEqual(script.length);
  });

  it('handles empty input on either side', () => {
    expect(advanceCursor(script, [], 4)).toBe(4);
    expect(advanceCursor([], tokenize('hello'), 0)).toBe(0);
  });

  it('will not advance on a weak match', () => {
    // "wolcame" is close enough to look tempting but below the floor; advancing
    // on it drifts the prompter ahead of the speaker.
    expect(advanceCursor(tokenize('welcome back'), ['zzzzzzz'], 0)).toBe(0);
  });
});

describe('cursorToLine', () => {
  it('maps a cursor to its line', () => expect(cursorToLine(14, 7)).toBe(2));
  it('does not divide by zero', () => expect(cursorToLine(14, 0)).toBe(0));
});
