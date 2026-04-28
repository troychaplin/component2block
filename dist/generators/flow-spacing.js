import { resolveBaseStyleValueForScss } from '../config.js';
const HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
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
export function appendFlowSpacingRules(lines, baseStyles, prefix, tokens) {
    // Per-heading top margins inside constrained flow.
    // `> * + hN` only matches when the heading has a preceding sibling, so a
    // first-child heading falls through to the existing :first-child reset.
    for (const level of HEADING_LEVELS) {
        const value = baseStyles[level]?.marginBlockStart;
        if (value === undefined)
            continue;
        const resolved = resolveBaseStyleValueForScss(value, 'marginBlockStart', prefix, tokens);
        lines.push('');
        lines.push(`.is-layout-constrained > * + ${level} {`);
        lines.push(`  margin-block-start: ${resolved};`);
        lines.push('}');
    }
    // Tighten the gap immediately after a heading. Selector ties on specificity
    // with the block-gap rule, so callers must emit this after appendBlockGapRules.
    if (baseStyles.spacing?.afterHeading !== undefined) {
        const resolved = resolveBaseStyleValueForScss(baseStyles.spacing.afterHeading, 'afterHeading', prefix, tokens);
        lines.push('');
        lines.push('.is-layout-constrained > :is(h1, h2, h3, h4, h5, h6) + * {');
        lines.push(`  margin-block-start: ${resolved};`);
        lines.push('}');
    }
}
/**
 * True when at least one flow-spacing property is configured. Used to decide
 * whether typography.css has any content to emit.
 */
export function hasFlowSpacing(baseStyles) {
    if (!baseStyles)
        return false;
    if (baseStyles.spacing?.afterHeading !== undefined)
        return true;
    for (const level of HEADING_LEVELS) {
        if (baseStyles[level]?.marginBlockStart !== undefined)
            return true;
    }
    return false;
}
//# sourceMappingURL=flow-spacing.js.map