import type { C2bConfig } from '../types.js';
/**
 * Emit layout.css — root padding/block-gap CSS variables on `body` plus the
 * layout-utility rules (block-gap on constrained/flex/grid, layout constraint
 * for content/wide widths, has-global-padding helpers, alignfull bleed).
 *
 * Per-element typography lives in base-styles.css; flow-spacing rules live in
 * typography.css. This file is the layout-only output.
 *
 * Returns null when no layout-relevant config is present.
 */
export declare function generateLayoutCss(config: C2bConfig): string | null;
//# sourceMappingURL=layout-css.d.ts.map