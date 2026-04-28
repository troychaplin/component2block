import type { C2bConfig } from '../types.js';
/**
 * Emit base-styles.css — per-element typography and color rules. Layout
 * utilities (block-gap, layout-constrained, has-global-padding, alignfull)
 * live in layout.css; flow-spacing rules (heading top margins, after-heading)
 * live in typography.css.
 *
 * Returns null when no element styling is configured.
 */
export declare function generateBaseStylesCss(config: C2bConfig): string | null;
//# sourceMappingURL=base-styles-css.d.ts.map