import type { C2bConfig, C2bConfigInput, TokenCategory, BaseStyleElementDef } from './types.js';
export declare function loadConfig(configPath?: string): C2bConfig;
export declare function validateConfig(input: C2bConfigInput): C2bConfig;
export interface ResolvedTokenRef {
    category: TokenCategory;
    key: string;
    slug?: string;
    cssSegment: string;
    wpPreset?: string;
}
/**
 * Check if a value matches a token key in any category.
 * Returns resolution info if found, null if it's a raw value.
 *
 * When `preferCategory` is provided, that category is checked first.
 * This resolves ambiguity when the same key exists in multiple categories
 * (e.g. "large" in both fontSize and spacing).
 */
export declare function resolveTokenRef(value: string, tokens: C2bConfig['tokens'], preferCategory?: TokenCategory): ResolvedTokenRef | null;
/**
 * Resolve a baseStyles value to a CSS var() reference for SCSS output.
 * Token keys become var(--{prefix}--{cssSegment}-{key}).
 * Raw values pass through unchanged.
 */
export declare function resolveForScss(value: string, prefix: string, tokens: C2bConfig['tokens'], preferCategory?: TokenCategory): string;
/**
 * Resolve a baseStyles value to a CSS var() reference for theme.json output.
 * Token keys become var(--wp--preset--{wpCategory}--{slug}).
 * Uses slug when available (e.g. spacing slug "60"), falls back to key.
 * Raw values pass through unchanged.
 */
export declare function resolveForThemeJson(value: string, tokens: C2bConfig['tokens'], preferCategory?: TokenCategory): string;
/**
 * For individual heading elements, ensure fontStyle is present.
 * If the config doesn't specify fontStyle, default to "normal".
 */
export declare function ensureFontStyle(def: BaseStyleElementDef): BaseStyleElementDef;
//# sourceMappingURL=config.d.ts.map