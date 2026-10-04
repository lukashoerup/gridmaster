/** Seeded generators for the toy: one independent stream per (seed, label). */
import { Rng, hashStream, hashString } from '../../sim';

export function rngFor(seed: number, label: string, ...ids: number[]): Rng {
  const h = hashString(label);
  return new Rng([hashStream(seed, h, 1, ...ids), hashStream(seed, h, 2, ...ids), hashStream(seed, h, 3, ...ids), hashStream(seed, h, 4, ...ids)]);
}
