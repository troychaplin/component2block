import type { C2bConfig, BaseStylesConfig } from '../types.js';
import { resolveBaseStyleValueForScss } from '../config.js';

const HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/**
 * Shared source of truth for flow-spacing CSS rules — per-heading top margin,
 * after-heading tightening, and list-item rhythm. Emitted identically into
 * both base-styles.scss (React-side) and typography.css (WP-side).
 *
 * Each rule is appended to the provided line buffer, prefixed with a blank
 * separator line. Sections without configured values are skipped silently.
 */
export function appendFlowSpacingRules(
  lines: string[],
  baseStyles: BaseStylesConfig,
  prefix: string,
  tokens: C2bConfig['tokens'],
): void {
  // Per-heading top margins inside constrained flow.
  // `> * + hN` only matches when the heading has a preceding sibling, so a
  // first-child heading falls through to the existing :first-child reset.
  for (const level of HEADING_LEVELS) {
    const value = baseStyles[level]?.marginBlockStart;
    if (value === undefined) continue;
    const resolved = resolveBaseStyleValueForScss(value, 'marginBlockStart', prefix, tokens);
    lines.push('');
    lines.push(`:where(.is-layout-constrained) > * + ${level} {`);
    lines.push(`  margin-block-start: ${resolved};`);
    lines.push('}');
  }

  // Tighten the gap immediately after a heading. Selector ties on specificity
  // with the block-gap rule, so callers must emit this after appendBlockGapRules.
  if (baseStyles.spacing?.afterHeading !== undefined) {
    const resolved = resolveBaseStyleValueForScss(
      baseStyles.spacing.afterHeading, 'afterHeading', prefix, tokens,
    );
    lines.push('');
    lines.push(':where(.is-layout-constrained) > :where(h1, h2, h3, h4, h5, h6) + * {');
    lines.push(`  margin-block-start: ${resolved};`);
    lines.push('}');
  }

  // List-item rhythm — <li> isn't a direct child of .is-layout-constrained,
  // so the block-gap rule doesn't apply to it. Global by design.
  if (baseStyles.spacing?.listItem !== undefined) {
    const resolved = resolveBaseStyleValueForScss(
      baseStyles.spacing.listItem, 'listItem', prefix, tokens,
    );
    lines.push('');
    lines.push('li + li {');
    lines.push(`  margin-block-start: ${resolved};`);
    lines.push('}');
  }
}

/**
 * True when at least one flow-spacing property is configured. Used to decide
 * whether typography.css has any content to emit.
 */
export function hasFlowSpacing(baseStyles: BaseStylesConfig | undefined): boolean {
  if (!baseStyles) return false;
  if (baseStyles.spacing?.afterHeading !== undefined) return true;
  if (baseStyles.spacing?.listItem !== undefined) return true;
  for (const level of HEADING_LEVELS) {
    if (baseStyles[level]?.marginBlockStart !== undefined) return true;
  }
  return false;
}
