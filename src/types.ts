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
  /** Top margin applied to this element when it follows a sibling inside a constrained-layout flow. Spacing token key or raw CSS value. */
  marginBlockStart?: string;
}

/** Valid element keys in baseStyles config */
export type BaseStyleElement = 'body' | 'heading' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'caption' | 'button' | 'link';

/**
 * Definition for an element under `styles.elements.*` in theme.json and
 * its `:where(...)` rule in base-styles.css. `body` is excluded because its
 * theme.json output goes to top-level `styles.typography` / `styles.color`
 * instead of `styles.elements.body`, and its CSS output wraps a `body { }`
 * block rather than a `:where(...)` rule.
 */
export interface BaseElementDef {
  /** Key in baseStyles config */
  key: 'heading' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'caption' | 'button' | 'link';
  /** CSS selector — written verbatim into the generated stylesheet */
  cssSelector: string;
  /** Element key under styles.elements in theme.json */
  themeJsonKey: string;
  /** True for h1–h6: receives ensureFontStyle('normal') and supports marginBlockStart */
  isHeading?: boolean;
  /** Explicit hover selector when the element supports hoverColor → :hover. Element gets a theme.json `:hover` pseudo too. */
  hoverCssSelector?: string;
}

/**
 * Single source of truth for elements that get per-element styling. Adding a
 * new element is a one-entry change here; validation and every generator loop
 * over this registry rather than maintaining their own lists.
 */
export const ELEMENT_REGISTRY: BaseElementDef[] = [
  { key: 'heading', cssSelector: ':where(h1, h2, h3, h4, h5, h6)', themeJsonKey: 'heading' },
  { key: 'h1', cssSelector: ':where(h1)', themeJsonKey: 'h1', isHeading: true },
  { key: 'h2', cssSelector: ':where(h2)', themeJsonKey: 'h2', isHeading: true },
  { key: 'h3', cssSelector: ':where(h3)', themeJsonKey: 'h3', isHeading: true },
  { key: 'h4', cssSelector: ':where(h4)', themeJsonKey: 'h4', isHeading: true },
  { key: 'h5', cssSelector: ':where(h5)', themeJsonKey: 'h5', isHeading: true },
  { key: 'h6', cssSelector: ':where(h6)', themeJsonKey: 'h6', isHeading: true },
  { key: 'caption', cssSelector: ':where(figcaption)', themeJsonKey: 'caption' },
  { key: 'button', cssSelector: ':where(button)', themeJsonKey: 'button' },
  { key: 'link', cssSelector: ':where(a)', themeJsonKey: 'link', hoverCssSelector: ':where(a:hover)' },
];

/** Heading levels in output order — derived from the registry */
export const HEADING_KEYS = ELEMENT_REGISTRY.filter(e => e.isHeading).map(e => e.key) as Array<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'>;

/**
 * Typography properties on BaseStyleElementDef, in canonical output order.
 * Used by both the CSS generator (font-family/font-size/...) and the theme.json
 * generator (typography.fontFamily/fontSize/...) so the two outputs can't drift.
 */
export const TYPOGRAPHY_PROPERTIES: Array<'fontFamily' | 'fontSize' | 'fontStyle' | 'fontWeight' | 'lineHeight'> = [
  'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'lineHeight',
];

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
  /** Tightened gap applied between a heading and the next sibling. Spacing token key or raw CSS value. */
  afterHeading?: string;
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
  fluid?: { min: string; max: string };
  fontFace?: FontFaceEntry[];
}

/**
 * Fluid fontSize shorthand as written by user.
 * { "min": "0.875rem", "max": "1rem" } expands to { value: "1rem", fluid: { min, max } }.
 */
export interface FluidInput {
  min: string;
  max: string;
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
  /**
   * If true, category is SCSS-only — skipped by the CSS, WP CSS, and theme.json
   * generators. Exists solely to be opted into `output.scssVars`. Used by
   * `mediaQuery`, where breakpoints only make sense inside SCSS `@media` rules.
   */
  scssOnly?: boolean;
}

/**
 * Central registry mapping token category names to their output behavior.
 * Adding a new category here is all that's needed to support it across all generators.
 */
/**
 * Maps user-facing config category names to internal flat category names.
 * Categories not in this map use their key as-is (e.g. "fontSize" → "fontSize").
 */
export const INPUT_CATEGORY_MAP: Record<string, TokenCategory> = {
  color: 'colorPalette',
  gradient: 'colorGradient',
};

export const CATEGORY_REGISTRY: Record<string, CategoryDef> = {
  colorPalette: {
    cssSegment: 'color',
    label: 'Colors',
    order: 0,
    themeJson: { path: 'color.palette', valueKey: 'color' },
    wpPreset: '--wp--preset--color',
  },
  colorGradient: {
    cssSegment: 'gradient',
    label: 'Gradients',
    order: 1,
    themeJson: { path: 'color.gradients', valueKey: 'gradient' },
    wpPreset: '--wp--preset--gradient',
  },
  spacing: {
    cssSegment: 'spacing',
    label: 'Spacing',
    order: 2,
    themeJson: { path: 'spacing.spacingSizes', valueKey: 'size' },
    wpPreset: '--wp--preset--spacing',
  },
  fontFamily: {
    cssSegment: 'font-family',
    label: 'Font Families',
    order: 3,
    themeJson: { path: 'typography.fontFamilies', valueKey: 'fontFamily' },
    wpPreset: '--wp--preset--font-family',
  },
  fontSize: {
    cssSegment: 'font-size',
    label: 'Font Sizes',
    order: 4,
    themeJson: { path: 'typography.fontSizes', valueKey: 'size' },
    wpPreset: '--wp--preset--font-size',
  },
  shadow: {
    cssSegment: 'shadow',
    label: 'Shadows',
    order: 5,
    themeJson: { path: 'shadow.presets', valueKey: 'shadow' },
    wpPreset: '--wp--preset--shadow',
    custom: 'shadow',
  },
  fontWeight: {
    cssSegment: 'font-weight',
    label: 'Font Weights',
    order: 6,
    custom: 'fontWeight',
  },
  lineHeight: {
    cssSegment: 'line-height',
    label: 'Line Heights',
    order: 7,
    custom: 'lineHeight',
  },
  radius: {
    cssSegment: 'radius',
    label: 'Border Radius',
    order: 8,
    custom: 'radius',
  },
  transition: {
    cssSegment: 'transition',
    label: 'Transitions',
    order: 9,
    custom: 'transition',
  },
  zIndex: {
    cssSegment: 'z',
    label: 'Z-Index',
    order: 10,
    exclude: true,
  },
  layout: {
    cssSegment: 'layout',
    label: 'Layout',
    order: 11,
    directMap: true,
    themeJson: { path: 'layout', valueKey: 'direct' },
  },
  mediaQuery: {
    cssSegment: 'media-query',
    label: 'Media Queries',
    order: 12,
    scssOnly: true,
  },
};

export type TokenCategory =
  | 'colorPalette' | 'colorGradient' | 'spacing' | 'fontFamily' | 'fontSize'
  | 'shadow' | 'fontWeight' | 'lineHeight' | 'radius' | 'transition' | 'zIndex'
  | 'layout' | 'mediaQuery';

/** All valid category names, derived from the registry */
export const VALID_CATEGORIES = Object.keys(CATEGORY_REGISTRY) as TokenCategory[];

/** Categories sorted by their output order */
export const CATEGORY_ORDER = [...VALID_CATEGORIES].sort(
  (a, b) => CATEGORY_REGISTRY[a].order - CATEGORY_REGISTRY[b].order,
);

/**
 * Fluid typography viewport anchors. These define the viewport widths at
 * which a fluid font size locks to its min and max values respectively.
 * Values must be CSS lengths with a `px` unit.
 */
export interface FluidConfig {
  minViewport: string;
  maxViewport: string;
}

/** Default viewport anchors used when `fluid` is not set in config. */
export const DEFAULT_FLUID: FluidConfig = {
  minViewport: '320px',
  maxViewport: '1600px',
};

/** Internal config after normalization — uses flat category keys like colorPalette */
export interface C2bConfig {
  prefix: string;
  srcDir: string;
  themeDir: string;
  themeable: boolean;
  /** Directory containing font source files organized by family slug (e.g. public/fonts). When set, enables font file copying to dist. */
  fontsDir?: string;
  /** Whether to copy font files to dist and generate a dist-level fonts.css. Defaults to true when fontsDir is set. */
  bundleFonts: boolean;
  /**
   * Token categories to emit as SCSS variables in `_variables.scss`.
   * Normalized to internal category names (e.g. "color" → "colorPalette").
   * Always populated by the validator (default `[]`); optional here so
   * hand-written test fixtures can omit it. Empty or omitted means no
   * SCSS file is written.
   */
  scssVars?: TokenCategory[];
  tokens: Partial<Record<TokenCategory, TokenGroup>>;
  baseStyles?: BaseStylesConfig;
  /** Fluid typography viewport anchors. Always populated by the validator; optional here so hand-written test fixtures can omit it. */
  fluid?: FluidConfig;
}

/** Output configuration group */
export interface OutputConfig {
  srcDir?: string;
  themeDir?: string;
  themeable?: boolean;
  /** Directory containing font source files organized by family slug (e.g. public/fonts) */
  fontsDir?: string;
  /** Whether to bundle font files in dist. Defaults to true when fontsDir is set. */
  bundleFonts?: boolean;
  /**
   * List of token categories to emit as SCSS variables in `_variables.scss`.
   * Accepts user-facing category names (e.g. "color", "mediaQuery"). Omit or set
   * to an empty array to skip SCSS output entirely. Unknown category names
   * throw at config load time.
   */
  scssVars?: string[];
}

/**
 * Token entry as written by user — can be a string (shorthand) or full object.
 * String shorthand behavior depends on the category:
 * - Preset categories (color, gradient, shadow, fontFamily, fontSize): registers as preset
 * - Custom-only categories (fontWeight, radius): CSS-only
 * - Excluded categories (zIndex): CSS-only
 */
export type TokenEntryInput = string | FluidInput | TokenEntry;

/** Token group as written by user — supports string and fluid shorthand */
export type TokenGroupInput = Record<string, TokenEntryInput>;

/**
 * Config as written by the user:
 * - Token categories under a "tokens" wrapper
 * - Output settings under an "output" wrapper
 * - "color" maps to colorPalette, "gradient" maps to colorGradient
 * - Token values can be strings (shorthand), fluid shorthand, or full objects
 * - slug is auto-derived from key, name is auto-derived from key (title-case)
 * - String shorthand registers as preset for preset-capable categories
 */
export interface C2bConfigInput {
  prefix: string;
  output?: OutputConfig;
  tokens?: Record<string, TokenGroupInput>;
  baseStyles?: BaseStylesConfig;
  /** Fluid typography viewport anchors. Both fields optional; defaults to 320px / 1600px. */
  fluid?: Partial<FluidConfig>;
  /** @deprecated Use tokens wrapper */
  [category: string]: string | boolean | OutputConfig | BaseStylesConfig | TokenGroupInput | undefined;
}

/**
 * Convert a kebab-case key to camelCase.
 * e.g. "content-size" → "contentSize"
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Convert a kebab-case key to Title Case.
 * e.g. "primary-hover" → "Primary Hover"
 */
export function kebabToTitle(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert a camelCase key to kebab-case.
 * e.g. "fontFamily" → "font-family"
 */
export function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
