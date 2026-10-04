/**
 * The historical calendar (design §4.8): news lines, and cards that pause
 * the game. Timing follows the real calendar; the effects that change rules
 * (the market opening, premiums, the credit squeeze, the grid upgrade) live
 * in the engine and the tuning, so this file is only what the player reads.
 * Dates marked [unverified] in the design stay so.
 */

export interface HistoricalEvent {
  readonly id: string;
  readonly at: readonly [number, number, number];
  /** A card pauses the game; otherwise it is a news line. */
  readonly card: boolean;
  readonly title: string;
  readonly body: readonly string[];
}

export const EVENTS: readonly HistoricalEvent[] = [
  {
    id: 'nordpool',
    at: [1999, 7, 1],
    card: true,
    title: 'Western Denmark joins the Nordic power exchange',
    body: [
      'From today power is sold hour by hour, at the price where supply meets demand. The chart on the right now moves through the day.',
      'Turbines already running keep their fixed tariff for 10 years from the day they started.',
      'New turbines earn the hourly price, plus a premium of €13/MWh for their first 12,000 full-load hours.',
      'Wind sells most in windy hours — when everyone else’s turbines are running too, and the price is lower.',
    ],
  },
  {
    id: 'hurricane',
    at: [1999, 12, 3],
    card: false,
    title: 'A hurricane crosses Denmark. Turbines trip off, but the grid holds.',
    body: [],
  },
  {
    id: 'carbon',
    at: [2005, 1, 1],
    card: false,
    title: 'The EU carbon market starts: coal and gas plants now pay for their CO₂, so they bid higher — and wind earns more.',
    body: [],
  },
  {
    id: 'carbon-crash',
    at: [2007, 3, 1],
    card: false,
    title: 'The carbon price has crashed to almost nothing: coal is cheap to run again.',
    body: [],
  },
  {
    id: 'premium-2008',
    at: [2008, 1, 1],
    card: false,
    title: 'New rules: turbines online from today earn the hourly price plus €33/MWh for their first 22,000 full-load hours.',
    body: [],
  },
  {
    id: 'crisis',
    at: [2008, 10, 1],
    card: true,
    title: 'The financial crisis',
    body: [
      'Banks are frightened. For the next two years they lend at most 60% of a project’s cost, and every new loan costs 1.5 points more.',
      'Loans you already have keep their rate.',
      'Cash in hand is worth more than usual now.',
    ],
  },
  {
    id: 'negative',
    at: [2009, 10, 1],
    card: false,
    title: 'Prices can now fall below zero: on windy nights, sellers pay to keep producing. Your premium still pays on top.',
    body: [],
  },
  {
    id: 'grid-heath',
    at: [2010, 1, 1],
    card: false,
    title: 'The grid on the central heath is upgraded: room for 120 MW of new projects there.',
    body: [],
  },
  {
    id: 'crisis-end',
    at: [2010, 10, 1],
    card: false,
    title: 'Banks lend 80% of a project’s cost again.',
    body: [],
  },
  {
    id: 'solar-boom',
    at: [2012, 6, 1],
    card: false,
    title: 'Rooftop solar is booming: panels cost a third of what they did in 2005.',
    body: [],
  },
  {
    id: 'premium-end',
    at: [2017, 1, 1],
    card: false,
    title: 'New turbines no longer get a premium: from today they earn the hourly price alone.',
    body: [],
  },
  {
    id: 'gas-climb',
    at: [2021, 9, 1],
    card: false,
    title: 'Gas prices are climbing fast across Europe.',
    body: [],
  },
  {
    id: 'gas-peak',
    at: [2022, 8, 1],
    card: false,
    title: 'Power prices hit records as the gas crisis peaks.',
    body: [],
  },
  {
    id: 'windless',
    at: [2024, 12, 6],
    card: false,
    title: 'Forecast: a cold, windless week ahead over northern Europe.',
    body: [],
  },
];
