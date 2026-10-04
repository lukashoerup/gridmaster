/**
 * Seeded pseudo-random numbers for the simulation.
 *
 * sfc32 ("small fast counter"), 128 bits of state, implemented in-house so
 * that the whole state can be saved into a game save and restored exactly.
 * The simulation never touches Math.random.
 */

/** The complete generator state: four unsigned 32-bit integers. */
export type RngState = readonly [number, number, number, number];

/** 32-bit integer mixer (the finaliser of a splitmix-style hash). */
export function mix32(x: number): number {
  x = x | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

/**
 * Combine a seed with any number of stream identifiers into one 32-bit hash.
 * Used so that e.g. the weather of (seed, year) is reproducible on its own,
 * independent of whatever was drawn for earlier years.
 */
export function hashStream(seed: number, ...ids: number[]): number {
  let h = mix32(seed ^ 0x5bd1e995);
  for (const id of ids) {
    h = mix32((h ^ Math.imul(id | 0, 0x9e3779b1)) + 0x7f4a7c15);
  }
  return h;
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(state: RngState) {
    this.a = state[0] >>> 0;
    this.b = state[1] >>> 0;
    this.c = state[2] >>> 0;
    this.d = state[3] >>> 0;
  }

  /** A generator for a named stream of a seed, e.g. `Rng.fromSeed(seed, year, STREAM_WIND)`. */
  static fromSeed(seed: number, ...ids: number[]): Rng {
    const h = hashStream(seed, ...ids);
    const rng = new Rng([mix32(h + 0x1), mix32(h + 0x2), mix32(h + 0x3), mix32(h + 0x4)]);
    for (let i = 0; i < 15; i++) rng.nextUint32();
    return rng;
  }

  /** Save the state (plain numbers, JSON-safe). */
  state(): RngState {
    return [this.a, this.b, this.c, this.d];
  }

  /** Restore a state saved with `state()`. */
  restore(state: RngState): void {
    this.a = state[0] >>> 0;
    this.b = state[1] >>> 0;
    this.c = state[2] >>> 0;
    this.d = state[3] >>> 0;
  }

  nextUint32(): number {
    const t = (((this.a + this.b) | 0) + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  /** Uniform in [0, 1). */
  next(): number {
    return this.nextUint32() / 4294967296;
  }

  /** Uniform in [lo, hi). */
  uniform(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next();
  }

  /**
   * Standard normal via Box–Muller. No caching of the second value, so the
   * state is exactly the four integers and nothing else.
   */
  gaussian(): number {
    let u = this.next();
    if (u < 1e-12) u = 1e-12;
    const v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
}
