/**
 * The board's rules (toy 2, src/board/rules) stay pure like the simulation
 * core: no clock, randomness, DOM or host globals, and imports only from
 * src/board/rules and src/sim. The page in src/board/ui draws and times.
 */
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob('../src/board/rules/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const FORBIDDEN: readonly RegExp[] = [
  /\bMath\.random\b/,
  /\bDate\b/,
  /\bperformance\b/,
  /\bwindow\b/,
  /\bdocument\b/,
  /\bnavigator\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bindexedDB\b/,
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bWorker\b/,
  /\bsetTimeout\b/,
  /\bsetInterval\b/,
  /\brequestAnimationFrame\b/,
  /\bqueueMicrotask\b/,
  /\bconsole\b/,
  /\bprocess\b/,
  /\brequire\s*\(/,
  /\bimport\s*\(/,
  /\bglobalThis\b/,
  /\bcrypto\b/,
  /\btoLocale\w*\(/,
  /\bIntl\b/,
];

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function normalise(path: string): string {
  const parts: string[] = [];
  for (const seg of path.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/');
}

describe('board boundary', () => {
  const files = Object.keys(sources).sort();

  it('finds the game sources', () => {
    expect(files.some((f) => f.endsWith('/game.ts'))).toBe(true);
  });

  it('imports only from src/board/rules and src/sim', () => {
    const importRe = /(?:import|export)\s[^'"]*?\sfrom\s*['"]([^'"]+)['"]/g;
    const bareImportRe = /^\s*import\s*['"]([^'"]+)['"]/gm;
    for (const file of files) {
      const code = stripComments(sources[file] ?? '');
      const dir = file.slice(0, file.lastIndexOf('/'));
      const specifiers: string[] = [];
      for (const m of code.matchAll(importRe)) specifiers.push(m[1] ?? '');
      for (const m of code.matchAll(bareImportRe)) specifiers.push(m[1] ?? '');
      for (const spec of specifiers) {
        expect(spec.startsWith('./') || spec.startsWith('../'), `${file} imports a package: ${spec}`).toBe(true);
        const resolved = normalise(`${dir}/${spec}`);
        expect(resolved.startsWith('src/board/rules/') || resolved === 'src/sim', `${file} imports outside src/board/rules and src/sim: ${spec}`).toBe(true);
      }
    }
  });

  it('uses no clock, randomness, locale, DOM or host globals', () => {
    for (const file of files) {
      const code = stripComments(sources[file] ?? '');
      for (const re of FORBIDDEN) {
        const m = re.exec(code);
        expect(m, `${file} uses forbidden ${re.source}: ${m?.[0] ?? ''}`).toBeNull();
      }
    }
  });
});
