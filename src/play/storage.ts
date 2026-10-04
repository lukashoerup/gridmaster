/**
 * The browser save: one slot in localStorage. Storage can be missing or
 * refuse (private windows, blocked site data, embedded previews), so every
 * call is guarded and the game plays on without it.
 */
const KEY = 'gridmaster.play.save';
/** Round 1's tuned comparison mode (`play.html?tuned=1`) keeps its own slot, so the two never resume each other. */
const TUNED_KEY = 'gridmaster.play.save.tuned';

/** True when the page was opened as `play.html?tuned=1`. */
export function tunedMode(): boolean {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('tuned') === '1';
  } catch {
    return false;
  }
}

const key = (): string => (tunedMode() ? TUNED_KEY : KEY);

export function readSave(): string | null {
  try {
    return globalThis.localStorage?.getItem(key()) ?? null;
  } catch {
    return null;
  }
}

export function writeSave(text: string): boolean {
  try {
    globalThis.localStorage?.setItem(key(), text);
    return true;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    globalThis.localStorage?.removeItem(key());
  } catch {
    // nothing to clear
  }
}
