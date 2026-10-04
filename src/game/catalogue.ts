/**
 * What can be built, and when (design §4.3, numbers §6). Slice 1 has rooftop
 * panels and wind turbines; solar parks and batteries come in later slices.
 */
import { interp, type Keyframes } from '../sim';
import { OM_SOLAR_PER_KW, OM_WIND_PER_KW } from './tuning';

export type AssetKind = 'wind' | 'rooftop';

export const MODEL_IDS = ['roof5', 'roof10', 'roof50', 'w225', 'w500', 'w600', 'w2000', 'w3000', 'w4000'] as const;
export type ModelId = (typeof MODEL_IDS)[number];

export interface Model {
  readonly id: ModelId;
  readonly kind: AssetKind;
  readonly label: string;
  /** Size of one unit, MW. */
  readonly unitMw: number;
  /** First and last calendar year it can be ordered. */
  readonly fromYear: number;
  readonly untilYear: number;
  /** Capacity factor in a normal year on a ×1.00 site. [tuning] */
  readonly meanCf: number;
  readonly lifetimeYears: number;
  readonly buildMonths: number;
  /** Fixed operating cost, € per kW a year. */
  readonly omPerKw: number;
}

/** Wind turbine cost, €/kW: ~1,000 in 1995 and 2024 with a mid-2000s bump. [report] for 2024; rest [unverified] */
const WIND_COST: Keyframes = [
  [1995, 1000],
  [2003, 900],
  [2006, 1150],
  [2009, 1350],
  [2013, 1250],
  [2018, 1100],
  [2024, 1000],
];
/** Rooftop solar system cost, €/kW: ~€10/W in 1995, €1.8/W in 2012. [unverified] */
const ROOFTOP_COST: Keyframes = [
  [1995, 10000],
  [2000, 7000],
  [2005, 5500],
  [2010, 3000],
  [2012, 1800],
  [2015, 1500],
  [2020, 1200],
  [2025, 1000],
];

const rooftop = (id: ModelId, kw: number): Model => ({
  id,
  kind: 'rooftop',
  label: `Rooftop solar ${kw} kWp`,
  unitMw: kw / 1000,
  fromYear: 1995,
  untilYear: 2025,
  meanCf: 0.105,
  lifetimeYears: 30,
  buildMonths: 1,
  omPerKw: OM_SOLAR_PER_KW,
});

const turbine = (id: ModelId, kw: number, fromYear: number, untilYear: number, meanCf: number, lifetimeYears: number, buildMonths: number): Model => ({
  id,
  kind: 'wind',
  label: kw < 1000 ? `${kw} kW turbine` : `${kw / 1000} MW turbine`,
  unitMw: kw / 1000,
  fromYear,
  untilYear,
  meanCf,
  lifetimeYears,
  buildMonths,
  omPerKw: OM_WIND_PER_KW,
});

export const MODELS: Readonly<Record<ModelId, Model>> = {
  roof5: rooftop('roof5', 5),
  roof10: rooftop('roof10', 10),
  roof50: rooftop('roof50', 50),
  // Capacity factors 22% (1995 turbines) → 35% (2020s turbines), before the site's rating. [tuning]
  w225: turbine('w225', 225, 1995, 2003, 0.2, 20, 3),
  w500: turbine('w500', 500, 1995, 2003, 0.22, 20, 3),
  w600: turbine('w600', 600, 1995, 2003, 0.23, 20, 3),
  w2000: turbine('w2000', 2000, 2000, 2010, 0.28, 25, 6),
  w3000: turbine('w3000', 3000, 2008, 2016, 0.32, 25, 6),
  w4000: turbine('w4000', 4000, 2015, 2025, 0.36, 25, 6),
};

/** Cost of one kW ordered in a (fractional) year, euro. */
export function costPerKw(model: Model, year: number): number {
  return interp(model.kind === 'wind' ? WIND_COST : ROOFTOP_COST, year);
}

/** Models that can be ordered in a calendar year, for a kind. */
export function modelsFor(kind: AssetKind, year: number): Model[] {
  return MODEL_IDS.map((id) => MODELS[id]).filter((m) => m.kind === kind && year >= m.fromYear && year <= m.untilYear);
}
