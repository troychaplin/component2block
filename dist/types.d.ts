export interface FontFaceEntry {
    weight: string;
    style: string;
    src: string;
}
/** Valid typography CSS properties for baseStyles element definitions */
export type BaseStyleProperty = 'fontFamily' | 'fontSize' | 'fontWeight' | 'lineHeight' | 'fontStyle';
/** A single element definition within baseStyles */
export interface BaseStyleElementDef {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    fontStyle?: string;
    color?: string;
    background?: string;
    hoverColor?: string;
}
/** Valid element keys in baseStyles config */
export type BaseStyleElement = 'body' | 'heading' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'caption' | 'button' | 'link';
/** Padding values for each side */
export interface BaseStylesSpacingPadding {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
}
/** Spacing section within baseStyles */
export interface BaseStylesSpacing {
    blockGap?: string;
    padding?: BaseStylesSpacingPadding;
}
/** The full baseStyles config section */
export type BaseStylesConfig = Partial<Record<BaseStyleElement, BaseStyleElementDef>> & {
    spacing?: BaseStylesSpacing;
};
export interface TokenEntry {
    value: string;
    name?: string;
    slug?: string;
    cssOnly?: boolean;
    fluid?: {
        min: string;
        max: string;
    };
    fontFace?: FontFaceEntry[];
}
export type TokenGroup = Record<string, TokenEntry>;
/**
 * Defines how a token category maps to CSS variables,
 * WordPress preset CSS variables, and theme.json output.
 */
export interface CategoryDef {
    /** CSS variable segment: e.g. "color" → --prefix-color-*, "font-family" → --prefix-font-family-* */
    cssSegment: string;
    /** Human-readable label for CSS comments */
    label: string;
    /** Output order in generated CSS files */
    order: number;
    /**
     * Where named tokens (with name+slug) go in theme.json settings.
     * - `path`: dot-separated path under settings, e.g. "color.palette" or "shadow.presets"
     * - `valueKey`: the property name for the token value in the preset object, e.g. "color", "size", "shadow"
     *
     * Omit for categories that don't produce theme.json presets (fontWeight, lineHeight, etc.)
     */
    themeJson?: {
        path: string;
        valueKey: string;
    };
    /** WordPress preset CSS variable prefix, e.g. "--wp--preset--color". Omit = hardcoded in wp css. */
    wpPreset?: string;
    /** Key under settings.custom for tokens without a native preset mapping, e.g. "fontWeight" */
    custom?: string;
    /** If true, category is excluded from theme.json entirely (e.g. zIndex) */
    exclude?: boolean;
    /** If true, tokens map directly to a settings object (not a preset array). Used by layout. */
    directMap?: boolean;
}
/**
 * Central registry mapping token category names to their output behavior.
 * Adding a new category here is all that's needed to support it across all generators.
 */
/**
 * Maps user-facing config category names to internal flat category names.
 * Categories not in this map use their key as-is (e.g. "fontSize" → "fontSize").
 */
export declare const INPUT_CATEGORY_MAP: Record<string, TokenCategory>;
export declare const CATEGORY_REGISTRY: Record<string, CategoryDef>;
export type TokenCategory = 'colorPalette' | 'colorGradient' | 'spacing' | 'fontFamily' | 'fontSize' | 'shadow' | 'fontWeight' | 'lineHeight' | 'radius' | 'transition' | 'zIndex' | 'layout';
/** All valid category names, derived from the registry */
export declare const VALID_CATEGORIES: TokenCategory[];
/** Categories sorted by their output order */
export declare const CATEGORY_ORDER: TokenCategory[];
/** Internal config after normalization — uses flat category keys like colorPalette */
export interface C2bConfig {
    prefix: string;
    tokensPath: string;
    outDir: string;
    wpThemeable: boolean;
    tokens: Partial<Record<TokenCategory, TokenGroup>>;
    baseStyles?: BaseStylesConfig;
}
/**
 * Token entry as written by user — can be a string (shorthand) or full object.
 * String "value" expands to { value: "value" }.
 */
export type TokenEntryInput = string | TokenEntry;
/** Token group as written by user — supports string shorthand for values */
export type TokenGroupInput = Record<string, TokenEntryInput>;
/**
 * Config as written by the user:
 * - Categories at top level (no "tokens" wrapper)
 * - "color" maps to colorPalette, "gradient" maps to colorGradient
 * - Token values can be strings (shorthand) or full objects
 * - slug is auto-derived from key, name is auto-derived from key (title-case)
 */
export interface C2bConfigInput {
    prefix: string;
    tokensPath?: string;
    outDir?: string;
    wpThemeable?: boolean;
    baseStyles?: BaseStylesConfig;
    [category: string]: string | boolean | BaseStylesConfig | TokenGroupInput | undefined;
}
/**
 * Convert a kebab-case key to camelCase.
 * e.g. "content-size" → "contentSize"
 */
export declare function kebabToCamel(str: string): string;
/**
 * Convert a kebab-case key to Title Case.
 * e.g. "primary-hover" → "Primary Hover"
 */
export declare function kebabToTitle(str: string): string;
/**
 * Convert a camelCase key to kebab-case.
 * e.g. "fontFamily" → "font-family"
 */
export declare function camelToKebab(str: string): string;
//# sourceMappingURL=types.d.ts.map