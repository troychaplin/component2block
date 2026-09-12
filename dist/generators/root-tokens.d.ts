import type { C2bConfig } from '../types.js';
/**
 * Root spacing tokens derived from `baseStyles.spacing`: the root padding axes
 * (`padding-x`, `padding-y`), the four sides, and `block-gap`. Keys are relative
 * to the `root` segment, so `padding-x` becomes `--{prefix}--root-padding-x`.
 *
 * tokens.css and tokens.wp.css declare these on :root and tokens.js mirrors
 * them, so components can reuse the page gutter anywhere — including WordPress
 * block themes, which don't load layout.css.
 *
 * A side that isn't set on its own, or matches its axis, aliases the axis token
 * (`var(--{prefix}--root-padding-x)`), so one axis value drives both sides.
 */
export declare function buildRootTokens(config: C2bConfig): Array<{
    key: string;
    value: string;
}>;
/**
 * Append the root spacing tokens to a `:root { }` body under a `Root Spacing`
 * label. `separate` adds a blank line first, for when category groups precede it.
 */
export declare function appendRootTokens(lines: string[], config: C2bConfig, separate: boolean): void;
//# sourceMappingURL=root-tokens.d.ts.map