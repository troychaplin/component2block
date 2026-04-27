import type { C2bConfig } from '../types.js';
/**
 * Emit typography.css for the WordPress output directory.
 *
 * Contains the same flow-spacing rules as base-styles.scss (per-heading top
 * margin, after-heading tightening, list-item rhythm), but as plain CSS so a
 * block theme can enqueue it directly. References `var(--{prefix}--spacing-*)`
 * variables that tokens.css already defines in the same context.
 *
 * Returns null when no flow-spacing properties are configured — caller should
 * skip writing the file rather than emit an empty stylesheet.
 */
export declare function generateTypographyCss(config: C2bConfig): string | null;
//# sourceMappingURL=typography-css.d.ts.map