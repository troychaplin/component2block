import type { FluidConfig, TokenEntry } from '../types.js';
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
export declare function buildFluidClamp(entry: TokenEntry, fluidConfig?: FluidConfig): string | null;
//# sourceMappingURL=fluid.d.ts.map