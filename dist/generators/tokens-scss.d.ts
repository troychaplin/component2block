import type { C2bConfig, TokenGroup } from '../types.js';
/**
 * Generate `_variables.scss` content. Only emits categories listed in
 * `config.scssVars`, iterated in registry order so the file stays grouped
 * consistently. Returns `null` when `scssVars` is empty — the caller should
 * skip writing the file.
 */
export declare function generateTokensScss(config: C2bConfig): string | null;
/**
 * Build the `@mixin` blocks that wrap the viewport breakpoints in the same media
 * queries WordPress generates for `@mobile` / `@tablet` block styles.
 *
 * `@tablet` is a band (`mobile < width <= tablet`), not a max-width — written by
 * hand as `max-width: tablet` it would also match every mobile viewport, so these
 * mixins exist so consumers don't have to remember that. When only one breakpoint
 * is configured, core falls back to a single max-width query under that
 * breakpoint's own name, which is mirrored here.
 *
 * Mixin names are deliberately unprefixed: the file is meant to be `@use`d, which
 * namespaces them (`@include ds.mobile`).
 *
 * Returns an empty array when no viewport tokens are defined.
 */
export declare function buildViewportMixins(prefix: string, group: TokenGroup | undefined): string[];
//# sourceMappingURL=tokens-scss.d.ts.map