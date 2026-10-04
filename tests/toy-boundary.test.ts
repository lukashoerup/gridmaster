/**
 * The rules of the round 1 toys stay pure like the simulation core: no
 * clock, randomness, DOM or host globals, and imports only from their own
 * rules folder and src/sim. The pages (src/toy/page, src/board/page) do the
 * drawing, the timing and the storage.
 */
import { describe, expect, it } from 'vitest';

const TOYS: readonly { name: string; dir: string; sources: Record<string, string>; marker: string }[] = [
  { name: 'toy 1 (Hubs)', dir: 'src/toy/rules/', marker: '/engine.ts', sources: import.meta.glob('../src/toy/rules/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string> },
];

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

for (const toy of TOYS) {
  describe(`${toy.name} boundary`, () => {
    const files = Object.keys(toy.sources).sort();

    it('finds the rules', () => {
      expect(files.some((f) => f.endsWith(toy.marker))).toBe(true);
    });

    it('imports only from its rules and src/sim', () => {
      const importRe = /(?:import|export)\s[^'"]*?\sfrom\s*['"]([^'"]+)['"]/g;
      const bareImportRe = /^\s*import\s*['"]([^'"]+)['"]/gm;
      for (const file of files) {
        const code = stripComments(toy.sources[file] ?? '');
        const dir = file.slice(0, file.lastIndexOf('/'));
        const specifiers: string[] = [];
        for (const m of code.matchAll(importRe)) specifiers.push(m[1] ?? '');
        for (const m of code.matchAll(bareImportRe)) specifiers.push(m[1] ?? '');
        for (const spec of specifiers) {
          expect(spec.startsWith('./') || spec.startsWith('../'), `${file} imports a package: ${spec}`).toBe(true);
          const resolved = normalise(`${dir}/${spec}`);
          expect(resolved.startsWith(toy.dir) || resolved === 'src/sim', `${file} imports outside ${toy.dir} and src/sim: ${spec}`).toBe(true);
        }
      }
    });

    it('uses no clock, randomness, locale, DOM or host globals', () => {
      for (const file of files) {
        const code = stripComments(toy.sources[file] ?? '');
        for (const re of FORBIDDEN) {
          const m = re.exec(code);
          expect(m, `${file} uses forbidden ${re.source}: ${m?.[0] ?? ''}`).toBeNull();
        }
      }
    });
  });
}
