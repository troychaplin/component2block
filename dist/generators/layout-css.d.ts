import type { C2bConfig } from '../types.js';
/**
 * Emit layout.css — the layout-utility rules: block-gap on constrained/flex/grid,
 * layout constraint for content/wide widths, has-global-padding helpers,
 * alignfull bleed.
 *
 * The root padding and block-gap custom properties these rules read are tokens,
 * declared on :root in tokens.css (see root-tokens.ts) so they also exist where
 * this file isn't loaded. Per-element typography lives in base-styles.css;
 * flow-spacing rules live in typography.css.
 *
 * Returns null when no layout-relevant config is present.
 */
export declare function generateLayoutCss(config: C2bConfig): string | null;
//# sourceMappingURL=layout-css.d.ts.map