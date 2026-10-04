/**
 * The one-zone prototype's game rules (Phase 2). Pure like the simulation
 * core: no DOM, clock, Math.random or imports from outside src/game and
 * src/sim (enforced by tests/game-boundary.test.ts). The page in src/play
 * draws it and feeds it the player's decisions.
 */
export * from './tuning';
export * from './money';
export * from './clock';
export * from './catalogue';
export * from './sites';
export * from './market';
export * from './state';
export * from './events';
export * from './value';
export * from './engine';
export * from './save';
export * from './bots';
