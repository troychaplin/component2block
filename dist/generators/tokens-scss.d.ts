import type { C2bConfig, TokenGroup } from '../types.js';
/**
 * Generate `_variables.scss` content. Only emits categories listed in
 * `config.scssVars`, iterated in registry order so the file stays grouped
 * consistently. Returns `null` when `scssVars` is empty — the caller should
 * skip writing the file.
 */
export declare function generateTokensScss(config: C2bConfig): string | null;
/**
 * Build the `@mixin` blocks wrapping the viewport breakpoints as media queries.
 *
 * The breakpoint values are the ones WordPress reads from `settings.viewport` to
 * size its own responsive block styles, so component CSS written with these
 * mixins changes at the same widths the editor does. The mixins themselves are
 * SCSS-only — nothing in WordPress consumes them.
 *
 * Each breakpoint yields a complementary pair: `below-x` uses `<=` and `above-x`
 * uses `>`, so no viewport width ever matches both. That is what removes the need
 * for the usual `- 0.02px` offset between a hand-written max/min pair.
 *
 * Mixin names are deliberately unprefixed: the file is meant to be `@use`d, which
 * namespaces them (`@include ds.above-tablet`).
 *
 * Returns an empty array when no viewport tokens are defined.
 */
export declare function buildViewportMixins(prefix: string, group: TokenGroup | undefined): string[];
//# sourceMappingURL=tokens-scss.d.ts.map