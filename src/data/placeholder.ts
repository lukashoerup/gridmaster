/**
 * Loads the placeholder data files and validates them into simulation inputs.
 * This is the only place that knows where the data lives; the simulation
 * itself only sees validated `WorldInputs`.
 */
import capacity from '../../data/placeholder/capacity.json';
import fuels from '../../data/placeholder/fuels.json';
import links from '../../data/placeholder/links.json';
import support from '../../data/placeholder/support.json';
import technologies from '../../data/placeholder/technologies.json';
import weather from '../../data/placeholder/weather.json';
import zones from '../../data/placeholder/zones.json';
import { validateInputs, type RawDataFiles, type WorldInputs } from '../sim';

export const placeholderRaw: RawDataFiles = { zones, technologies, fuels, capacity, links, support, weather };

let cached: WorldInputs | null = null;

/** The validated placeholder inputs (validated once, then reused). */
export function loadPlaceholderInputs(): WorldInputs {
  if (cached === null) cached = validateInputs(placeholderRaw);
  return cached;
}
