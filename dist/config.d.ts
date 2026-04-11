import type { C2bConfig, C2bConfigInput, TokenCategory, BaseStyleElementDef, BaseStylesConfig } from './types.js';
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
/** Classification result for a baseStyles value. */
export type BaseStyleValueClass = {
    kind: 'token';
    ref: ResolvedTokenRef;
} | {
    kind: 'raw';
} | {
    kind: 'invalid';
    category: TokenCategory | null;
    available: string[];
};
/**
 * Classify a baseStyles value. The returned classification is the single
 * source of truth used by both validation (which throws on `invalid`) and
 * resolution (which emits `var()` for tokens and passes through raw values).
 *
 * Lookup is strict: a value is only considered a token match if it exists in
 * the category mapped to its property. Cross-category matches are never made.
 */
export declare function classifyBaseStyleValue(value: string, property: string, tokens: C2bConfig['tokens']): BaseStyleValueClass;
/**
 * Resolve a baseStyles value for SCSS output. Tokens emit CSS variable refs
 * (`var(--{prefix}--{cssSegment}-{key})`), raw values pass through unchanged.
 * Assumes `validateBaseStyles()` has already run — invalid values fall
 * through to raw as a defensive fallback.
 */
export declare function resolveBaseStyleValueForScss(value: string, property: string, prefix: string, tokens: C2bConfig['tokens']): string;
/**
 * Resolve a baseStyles value for theme.json output.
 * - Preset tokens that are exposed to WordPress (have a slug, i.e. not cssOnly)
 *   emit `var(--wp--preset--{category}--{slug})`.
 * - cssOnly tokens in preset-capable categories emit the underlying value,
 *   since no corresponding `--wp--preset--*` variable will exist in WordPress.
 * - Custom-only category tokens (fontWeight, lineHeight, radius) emit the
 *   underlying value so WordPress receives valid CSS rather than a semantic slug.
 * - Raw values pass through unchanged.
 */
export declare function resolveBaseStyleValueForThemeJson(value: string, property: string, tokens: C2bConfig['tokens']): string;
/**
 * Walk the entire baseStyles config and validate every string value. Throws
 * on the first invalid value with a detailed error message listing what was
 * expected. Called during `validateConfig()`, so dangling token references
 * and typos are caught before any files are written.
 */
export declare function validateBaseStyles(baseStyles: BaseStylesConfig | undefined, tokens: C2bConfig['tokens']): void;
//# sourceMappingURL=config.d.ts.map