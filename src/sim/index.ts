/**
 * The simulation core. Pure: no DOM, no clock, no Math.random, no imports
 * from outside this folder (enforced by tests/boundary.test.ts).
 */
export { Rng, hashStream, hashString, mix32, type RngState } from './rng';
export {
  type DateYMD,
  daysInYear,
  daysInMonth,
  dailyFromMonthly,
  hoursInYear,
  hourOfYear,
  hourFromDate,
  dayOfYear,
  dayOfWeek,
  monthOfDay,
  labelForHour,
  parseDate,
  isLeapYear,
} from './calendar';
export {
  TECHS,
  FUELS,
  interp,
  annualPath,
  validateInputs,
  type TechId,
  type FuelId,
  type ZoneId,
  type Keyframes,
  type WorldInputs,
  type ZoneInput,
  type TechInput,
  type LinkInput,
  type RawDataFiles,
} from './inputs';
export { SyntheticWeather, cholesky, type WeatherSource, type WeatherYear } from './weather';
export { demandSeries } from './demand';
export { ClearingEngine, TRANCHE, type Tranche, type LinkSpec } from './market';
export { zoneStats, priceDuration, meanByHourOfDay, CAPTURE_RATE_MIN_MEAN_PRICE, type ZoneStats, type TechStat } from './stats';
export { Hasher } from './hash';
export {
  World,
  MAX_SEED,
  hashYearResult,
  type WorldState,
  type YearResult,
  type ZoneYear,
  type LinkYear,
  type StackRecord,
  type SimulateOptions,
  type CapacityAddition,
} from './world';
