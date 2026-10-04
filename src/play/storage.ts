/**
 * The browser save: one slot in localStorage. Storage can be missing or
 * refuse (private windows, blocked site data, embedded previews), so every
 * call is guarded and the game plays on without it.
 */
const KEY = 'gridmaster.play.save';

export function readSave(): string | null {
  try {
    return globalThis.localStorage?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

export function writeSave(text: string): boolean {
  try {
    globalThis.localStorage?.setItem(KEY, text);
    return true;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
