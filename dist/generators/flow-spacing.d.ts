import type { C2bConfig, BaseStylesConfig } from '../types.js';
/**
 * Shared source of truth for flow-spacing CSS rules — per-heading top margin
 * and after-heading tightening. Emitted identically into both base-styles.scss
 * (React-side) and typography.css (WP-side).
 *
 * Selectors deliberately use `.is-layout-constrained` (not `:where(...)`) so
 * the rules carry enough specificity to win against WordPress's auto-generated
 * per-block layout rules (e.g. `.wp-container-...-is-layout-XXX > * + *`,
 * specificity 0,1,0). The heading list inside the after-heading rule uses
 * `:is(...)` so the element-name specificity (0,0,1) is added on top.
 *
 * Each rule is appended to the provided line buffer, prefixed with a blank
 * separator line. Sections without configured values are skipped silently.
 */
export declare function appendFlowSpacingRules(lines: string[], baseStyles: BaseStylesConfig, prefix: string, tokens: C2bConfig['tokens']): void;
/**
 * True when at least one flow-spacing property is configured. Used to decide
 * whether typography.css has any content to emit.
 */
export declare function hasFlowSpacing(baseStyles: BaseStylesConfig | undefined): boolean;
//# sourceMappingURL=flow-spacing.d.ts.map