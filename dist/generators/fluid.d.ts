import type { FluidConfig, TokenEntry } from '../types.js';
/**
 * Build a clamp() value for fluid typography matching the shape WordPress
 * emits from `settings.typography.fluid` in theme.json:
 *
 *   clamp(<min>, <min> + ((1vw - <minVwRem>rem) * <rate>), <max>)
 *
 * Why this shape (and not the mathematically-equivalent `((100vw - minVw) /
 * range)` form)? WordPress writes exactly this structure into `:root` for
 * every fluid font size, so emitting the same shape from our tokens.css /
 * tokens.wp.css means both CSS variables land side-by-side with identical
 * bodies — no divergence when they're compared in devtools.
 *
 * Derivation:
 *   - `1vw` equals (viewport_px / 100). At viewport = minViewport that's
 *     `minVwPx/100 px`, which at a 16px root is `minVwPx/1600 rem`.
 *     → `minVwRem = minVwPx / 1600`
 *   - At minViewport, `(1vw - minVwRem rem)` = 0, so the clamp sits at `min`.
 *   - At maxViewport, `(1vw - minVwRem rem)` = `maxVwRem - minVwRem`, and we
 *     want `min + delta = max`, so `rate = delta / (maxVwRem - minVwRem)`.
 *
 * Fluid output requires rem or em units for min/max. Token values in other
 * units (px, %, etc.) fall back to the static value — WordPress behaves the
 * same way, and mixing `1vw` (a length) with a px min/max in this formula
 * shape produces ambiguous output.
 *
 * Returns null when the entry has no fluid range, when min/max use different
 * or unsupported units, or when the viewport anchors are invalid.
 */
export declare function buildFluidClamp(entry: TokenEntry, fluidConfig?: FluidConfig): string | null;
//# sourceMappingURL=fluid.d.ts.map