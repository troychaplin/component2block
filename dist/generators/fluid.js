import { DEFAULT_FLUID } from '../types.js';
/** WordPress assumes a 16px root font size when converting px→rem at emit time. */
const ROOT_FONT_PX = 16;
/**
 * Parse a CSS length value into its numeric part and unit.
 * e.g. "1.125rem" → { num: 1.125, unit: "rem" }
 */
function parseLength(value) {
    const match = value.match(/^(-?\d*\.?\d+)(rem|em|px)$/);
    if (!match)
        return null;
    return { num: parseFloat(match[1]), unit: match[2] };
}
/** Parse a px length (e.g. "320px") and return just the numeric value. */
function parsePx(value) {
    const match = /^(-?\d*\.?\d+)px$/.exec(value);
    return match ? parseFloat(match[1]) : null;
}
/** Round to 4 decimal places to avoid floating-point noise in generated CSS. */
function round4(n) {
    return Math.round(n * 10000) / 10000;
}
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
export function buildFluidClamp(entry, fluidConfig = DEFAULT_FLUID) {
    if (!entry.fluid)
        return null;
    const min = parseLength(entry.fluid.min);
    const max = parseLength(entry.fluid.max);
    if (!min || !max || min.unit !== max.unit)
        return null;
    if (min.unit !== 'rem' && min.unit !== 'em')
        return null;
    const vwMinPx = parsePx(fluidConfig.minViewport);
    const vwMaxPx = parsePx(fluidConfig.maxViewport);
    if (vwMinPx === null || vwMaxPx === null || vwMaxPx <= vwMinPx)
        return null;
    const minVwRem = vwMinPx / 100 / ROOT_FONT_PX;
    const maxVwRem = vwMaxPx / 100 / ROOT_FONT_PX;
    const rate = (max.num - min.num) / (maxVwRem - minVwRem);
    const minVwRemRounded = round4(minVwRem);
    const rateRounded = round4(rate);
    const unit = min.unit;
    return `clamp(${entry.fluid.min}, ${entry.fluid.min} + ((1vw - ${minVwRemRounded}${unit}) * ${rateRounded}), ${entry.fluid.max})`;
}
//# sourceMappingURL=fluid.js.map