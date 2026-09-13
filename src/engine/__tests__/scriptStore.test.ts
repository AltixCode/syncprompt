/**
 * The recording ceiling is the paywall, so it is pinned here rather than left
 * to a screen to enforce.
 */
import { useScriptStore, FREE_RECORD_SECONDS } from '../../store/useScriptStore';

const reset = () => useScriptStore.setState({ script: '', tokens: [], cursor: 0, isPro: false, fontSize: 30 });

describe('useScriptStore', () => {
  beforeEach(reset);

  it('caps a free recording and lifts the cap for Pro', () => {
    expect(useScriptStore.getState().recordLimitSeconds()).toBe(FREE_RECORD_SECONDS);
    useScriptStore.getState().setIsPro(true);
    expect(useScriptStore.getState().recordLimitSeconds()).toBe(Number.POSITIVE_INFINITY);
  });

  it('re-tokenises on edit so the tracker and the rendered script agree', () => {
    useScriptStore.getState().setScript('Hello there, world!');
    expect(useScriptStore.getState().tokens).toEqual(['hello', 'there', 'world']);
  });

  it('rewinds the cursor when the script changes', () => {
    useScriptStore.getState().setScript('one two three');
    useScriptStore.getState().setCursor(2);
    useScriptStore.getState().setScript('completely different words');
    // Keeping a stale cursor would start the prompter mid-script on a new take.
    expect(useScriptStore.getState().cursor).toBe(0);
  });

  it('clamps the font size to a legible range', () => {
    useScriptStore.getState().setFontSize(500);
    expect(useScriptStore.getState().fontSize).toBe(64);
    useScriptStore.getState().setFontSize(1);
    expect(useScriptStore.getState().fontSize).toBe(18);
  });
});
