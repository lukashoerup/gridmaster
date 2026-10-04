/**
 * Headless speed: one simulated year, four zones. Target under 1 s; the
 * assertion is generous for slow CI runners, the measured time is printed.
 */
import { describe, expect, it } from 'vitest';
import { loadPlaceholderInputs } from '../src/data/placeholder';
import { SyntheticWeather, World } from '../src/sim';

describe('speed', () => {
  it('simulates one year of four zones well under the limit', () => {
    const inputs = loadPlaceholderInputs();
    const weather = new SyntheticWeather(inputs);
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const world = new World(inputs, weather, 1 + i);
      const t0 = performance.now();
      world.simulateYear(2019);
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)] ?? NaN;
    console.log(`speed: one year, four zones: median ${median.toFixed(0)} ms (min ${times[0]?.toFixed(0)} ms, max ${times[times.length - 1]?.toFixed(0)} ms)`);
    expect(median).toBeLessThan(3000);
  });
});
