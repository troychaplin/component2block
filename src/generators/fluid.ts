import type { TokenEntry } from '../types.js';

/** WordPress fluid typography defaults */
const FLUID_MIN_VIEWPORT = 320;
const FLUID_MAX_VIEWPORT = 1600;
const FLUID_VIEWPORT_RANGE = FLUID_MAX_VIEWPORT - FLUID_MIN_VIEWPORT;

/**
 * Parse a CSS length value into its numeric part and unit.
 * e.g. "1.125rem" → { num: 1.125, unit: "rem" }
 */
function parseLength(value: string): { num: number; unit: string } | null {
  const match = value.match(/^([0-9.]+)(rem|em|px)$/);
  if (!match) return null;
  return { num: parseFloat(match[1]), unit: match[2] };
}

/**
 * Build a clamp() value matching WordPress's fluid typography formula.
 * clamp(min, min + (maxNum - minNum) * ((100vw - 320px) / 1280), max)
 */
export function buildFluidClamp(entry: TokenEntry): string | null {
  if (!entry.fluid) return null;

  const min = parseLength(entry.fluid.min);
  const max = parseLength(entry.fluid.max);
  if (!min || !max || min.unit !== max.unit) return null;

  const range = max.num - min.num;
  // Round to avoid floating point noise
  const rangeRounded = Math.round(range * 10000) / 10000;

  return `clamp(${entry.fluid.min}, ${entry.fluid.min} + ((${rangeRounded}) * ((100vw - ${FLUID_MIN_VIEWPORT}px) / ${FLUID_VIEWPORT_RANGE})), ${entry.fluid.max})`;
}
