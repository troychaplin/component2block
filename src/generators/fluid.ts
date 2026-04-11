import type { FluidConfig, TokenEntry } from '../types.js';
import { DEFAULT_FLUID } from '../types.js';

/**
 * Parse a CSS length value into its numeric part and unit.
 * e.g. "1.125rem" → { num: 1.125, unit: "rem" }
 */
function parseLength(value: string): { num: number; unit: string } | null {
  const match = value.match(/^(-?\d*\.?\d+)(rem|em|px)$/);
  if (!match) return null;
  return { num: parseFloat(match[1]), unit: match[2] };
}

/** Parse a px length (e.g. "320px") and return just the numeric value. */
function parsePx(value: string): number | null {
  const match = /^(-?\d*\.?\d+)px$/.exec(value);
  return match ? parseFloat(match[1]) : null;
}

/** Round to 4 decimal places to avoid floating-point noise in generated CSS. */
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Build a clamp() value for fluid typography.
 *
 * The emitted formula is:
 *
 *   clamp(<min>, <min> + (<delta><unit> * ((100vw - <vwMin>px) / <vwRange>px)), <max>)
 *
 * Where:
 *   - `<min>` / `<max>` are the user's fluid range (same unit, rem/em/px)
 *   - `<delta>` = max - min, emitted with the shared unit
 *   - `<vwMin>` = minViewport in px (ratio is 0 at this width → value = min)
 *   - `<vwRange>` = maxViewport - minViewport in px (ratio is 1 at maxViewport → value = max)
 *
 * The denominator is a px length, so `(100vw - vwMin px) / vwRange px` resolves
 * to a unit-free ratio. Multiplied by the rem/em delta it produces a value in
 * the same unit as min/max, which adds cleanly to min. This is the formula
 * shape WordPress uses for its own fluid typography calculations.
 *
 * Returns null if the fluid range is missing, uses an unsupported unit, or
 * has mismatched units between min and max.
 */
export function buildFluidClamp(
  entry: TokenEntry,
  fluidConfig: FluidConfig = DEFAULT_FLUID,
): string | null {
  if (!entry.fluid) return null;

  const min = parseLength(entry.fluid.min);
  const max = parseLength(entry.fluid.max);
  if (!min || !max || min.unit !== max.unit) return null;

  const vwMin = parsePx(fluidConfig.minViewport);
  const vwMax = parsePx(fluidConfig.maxViewport);
  if (vwMin === null || vwMax === null || vwMax <= vwMin) return null;

  const delta = round4(max.num - min.num);
  const vwRange = round4(vwMax - vwMin);
  const unit = min.unit;

  return `clamp(${entry.fluid.min}, ${entry.fluid.min} + (${delta}${unit} * ((100vw - ${vwMin}px) / ${vwRange}px)), ${entry.fluid.max})`;
}
