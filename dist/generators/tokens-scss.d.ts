import type { C2bConfig } from '../types.js';
/**
 * Generate `_variables.scss` content. Only emits categories listed in
 * `config.scssVars`, iterated in registry order so the file stays grouped
 * consistently. Returns `null` when `scssVars` is empty — the caller should
 * skip writing the file.
 */
export declare function generateTokensScss(config: C2bConfig): string | null;
//# sourceMappingURL=tokens-scss.d.ts.map