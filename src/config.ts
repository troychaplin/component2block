import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { C2bConfig, C2bConfigInput, FluidConfig, TokenCategory, TokenEntry, TokenEntryInput, TokenGroup, TokenGroupInput, BaseStyleElementDef, BaseStylesConfig, FluidInput } from './types.js';
import { CATEGORY_REGISTRY, DEFAULT_FLUID, INPUT_CATEGORY_MAP, VALID_CATEGORIES, kebabToTitle } from './types.js';

const DEFAULTS = {
  tokensPath: 'src/styles/tokens.css',
  wpDir: 'dist/wp',
} as const;

/** Reserved config keys that are not token categories (legacy flat format) */
const CONFIG_KEYS = ['prefix', 'tokensPath', 'outDir', 'wpThemeable', 'output', 'tokens', 'baseStyles', 'fluid'] as const;

export function loadConfig(configPath?: string): C2bConfig {
  const resolvedPath = resolve(configPath ?? 'c2b.config.json');

  let raw: string;
  try {
    raw = readFileSync(resolvedPath, 'utf-8');
  } catch {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  let input: C2bConfigInput;
  try {
    input = JSON.parse(raw) as C2bConfigInput;
  } catch {
    throw new Error(`Invalid JSON in config file: ${resolvedPath}`);
  }

  return validateConfig(input);
}

/**
 * Check if an input looks like a fluid shorthand: { min: string, max: string }
 * without a "value" key. Distinguishes from a full TokenEntry object.
 */
function isFluidInput(input: unknown): input is FluidInput {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return (
    typeof obj.min === 'string' &&
    typeof obj.max === 'string' &&
    !('value' in obj)
  );
}

/**
 * Determine if string shorthand should register as a preset for this category.
 * Preset-capable categories (those with wpPreset) register strings as presets.
 * Custom-only and excluded categories keep strings as CSS-only.
 */
function isPresetCategory(internalCategory: string): boolean {
  const def = CATEGORY_REGISTRY[internalCategory];
  return !!def?.wpPreset;
}

/**
 * Expand a token entry input (string, fluid shorthand, or object) into a full TokenEntry.
 *
 * String shorthand behavior depends on the category:
 * - Preset categories (color, gradient, shadow, fontFamily, fontSize): registers as preset
 * - Custom-only categories (fontWeight, radius): CSS-only
 *
 * Fluid shorthand { "min": "...", "max": "..." } expands to { value: max, fluid: { min, max } }.
 */
function expandTokenEntry(
  key: string,
  input: TokenEntryInput,
  isDirectMap?: boolean,
  internalCategory?: string,
): TokenEntry {
  const isShorthand = typeof input === 'string';

  let entry: TokenEntry;

  if (isShorthand) {
    entry = { value: input };
  } else if (isFluidInput(input)) {
    // Fluid shorthand: { min, max } → { value: max, fluid: { min, max } }
    entry = { value: input.max, fluid: { min: input.min, max: input.max } };
  } else {
    entry = { ...input as TokenEntry };
  }

  // Direct-map categories (layout) don't use name/slug
  if (isDirectMap) {
    return entry;
  }

  // Auto-derive value from fluid.max when fluid is set but value is missing
  if (!entry.value && entry.fluid?.max) {
    entry.value = entry.fluid.max;
  }

  // Determine CSS-only status based on category and entry form
  const presetCapable = internalCategory ? isPresetCategory(internalCategory) : false;
  const isCssOnly = isShorthand
    ? !presetCapable  // String shorthand: preset for preset categories, CSS-only otherwise
    : entry.cssOnly === true;

  if (!isCssOnly) {
    if (!entry.slug) {
      entry.slug = key;
    }
    if (!entry.name) {
      entry.name = kebabToTitle(key);
    }
  }

  return entry;
}

/**
 * Normalize a token group, expanding shorthand and auto-deriving slug/name.
 */
function normalizeTokenGroup(
  group: TokenGroupInput,
  isDirectMap?: boolean,
  internalCategory?: string,
): TokenGroup {
  const normalized: TokenGroup = {};
  for (const [key, input] of Object.entries(group)) {
    normalized[key] = expandTokenEntry(key, input, isDirectMap, internalCategory);
  }
  return normalized;
}

/**
 * Extract token categories from the config input.
 * Supports both new format (tokens wrapper) and legacy flat format.
 * Maps user-facing category names to internal names (e.g. "color" → "colorPalette").
 */
function extractTokens(input: C2bConfigInput): Partial<Record<TokenCategory, TokenGroup>> {
  const tokens: Partial<Record<TokenCategory, TokenGroup>> = {};
  const validInputCategories = [
    ...Object.keys(INPUT_CATEGORY_MAP),
    ...VALID_CATEGORIES,
  ];

  // Determine source: new tokens wrapper or legacy flat format
  const source = input.tokens ?? input;

  for (const [key, value] of Object.entries(source)) {
    // Skip reserved config keys (only relevant for legacy flat format)
    if ((CONFIG_KEYS as readonly string[]).includes(key)) continue;

    // Skip undefined values
    if (value === undefined) continue;

    // Must be an object (token group)
    if (typeof value !== 'object') {
      // In legacy flat format, non-object values like booleans are config keys
      if (!input.tokens) continue;
      throw new Error(`Config error: "${key}" must be an object.`);
    }

    // Map user-facing name to internal category name
    const internalCategory = INPUT_CATEGORY_MAP[key] ?? key;

    // Validate category name
    if (!VALID_CATEGORIES.includes(internalCategory as TokenCategory)) {
      throw new Error(`Config error: Unknown token category "${key}". Valid categories: ${validInputCategories.filter(c => VALID_CATEGORIES.includes((INPUT_CATEGORY_MAP[c] ?? c) as TokenCategory)).join(', ')}`);
    }

    const def = CATEGORY_REGISTRY[internalCategory];
    tokens[internalCategory as TokenCategory] = normalizeTokenGroup(
      value as TokenGroupInput,
      def.directMap,
      internalCategory,
    );
  }

  return tokens;
}

export function validateConfig(input: C2bConfigInput): C2bConfig {
  if (!input.prefix || typeof input.prefix !== 'string') {
    throw new Error('Config error: "prefix" is required and must be a string.');
  }

  const tokens = extractTokens(input);

  // Validate each category
  for (const [category, group] of Object.entries(tokens)) {
    validateTokenGroup(category, group as TokenGroup);
  }

  // Validate baseStyles references against the token table
  validateBaseStyles(input.baseStyles, tokens);

  // Resolve output settings: new output wrapper takes precedence over legacy root-level keys
  const output = input.output ?? {};
  const tokensPath = output.tokensPath ?? input.tokensPath ?? DEFAULTS.tokensPath;
  const wpDir = output.wpDir ?? input.outDir ?? DEFAULTS.wpDir;
  const wpThemeable = output.wpThemeable ?? input.wpThemeable ?? false;

  const layoutWideSize = (tokens.layout as TokenGroup | undefined)?.wideSize?.value;
  const fluid = resolveFluidConfig(input.fluid, layoutWideSize);

  return {
    prefix: input.prefix,
    tokensPath,
    wpDir,
    wpThemeable: wpThemeable === true,
    tokens,
    baseStyles: input.baseStyles,
    fluid,
  };
}

/**
 * Resolve and validate the fluid typography viewport anchors.
 *
 * Resolution order for maxViewport:
 *   1. Explicit `fluid.maxViewport` from config
 *   2. `layout.wideSize` from tokens (mirrors WordPress/Gutenberg behavior)
 *   3. DEFAULT_FLUID.maxViewport (1600px)
 *
 * Defaults to 320px / 1600px when nothing else applies. Both values must be
 * CSS lengths with a `px` unit (other units would produce a non-length
 * denominator in the clamp formula), and min must be strictly less than max.
 */
function resolveFluidConfig(
  input: Partial<FluidConfig> | undefined,
  layoutWideSize?: string,
): FluidConfig {
  const merged: FluidConfig = {
    minViewport: input?.minViewport ?? DEFAULT_FLUID.minViewport,
    maxViewport: input?.maxViewport ?? layoutWideSize ?? DEFAULT_FLUID.maxViewport,
  };

  const minPx = parsePxLength(merged.minViewport, 'fluid.minViewport');
  const maxPx = parsePxLength(merged.maxViewport, 'fluid.maxViewport');

  if (minPx >= maxPx) {
    throw new Error(
      `Config error: fluid.minViewport (${merged.minViewport}) must be less than fluid.maxViewport (${merged.maxViewport}).`,
    );
  }

  return merged;
}

/**
 * Parse a px length (e.g. "320px") and return its numeric value. Throws with
 * the config path when the value is missing or uses an unsupported unit.
 */
function parsePxLength(value: string, path: string): number {
  const match = /^(-?\d*\.?\d+)px$/.exec(value);
  if (!match) {
    throw new Error(
      `Config error: ${path} = "${value}" must be a CSS length with a px unit (e.g. "320px").`,
    );
  }
  return parseFloat(match[1]);
}

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
export function resolveTokenRef(
  value: string,
  tokens: C2bConfig['tokens'],
  preferCategory?: TokenCategory,
): ResolvedTokenRef | null {
  // Check preferred category first to resolve ambiguous keys
  if (preferCategory) {
    const group = tokens[preferCategory];
    if (group && value in group) {
      const def = CATEGORY_REGISTRY[preferCategory];
      return {
        category: preferCategory,
        key: value,
        slug: group[value].slug,
        cssSegment: def.cssSegment,
        wpPreset: def.wpPreset,
      };
    }
  }

  for (const [category, group] of Object.entries(tokens)) {
    if (!group) continue;
    if (value in group) {
      const def = CATEGORY_REGISTRY[category];
      return {
        category: category as TokenCategory,
        key: value,
        slug: group[value].slug,
        cssSegment: def.cssSegment,
        wpPreset: def.wpPreset,
      };
    }
  }
  return null;
}

/**
 * Resolve a baseStyles value to a CSS var() reference for SCSS output.
 * Token keys become var(--{prefix}--{cssSegment}-{key}).
 * Raw values pass through unchanged.
 */
export function resolveForScss(
  value: string,
  prefix: string,
  tokens: C2bConfig['tokens'],
  preferCategory?: TokenCategory,
): string {
  const ref = resolveTokenRef(value, tokens, preferCategory);
  if (ref) {
    return `var(--${prefix}--${ref.cssSegment}-${ref.key})`;
  }
  return value;
}

/**
 * Resolve a baseStyles value to a CSS var() reference for theme.json output.
 * Token keys become var(--wp--preset--{wpCategory}--{slug}).
 * Uses slug when available (e.g. spacing slug "60"), falls back to key.
 * Raw values pass through unchanged.
 */
export function resolveForThemeJson(
  value: string,
  tokens: C2bConfig['tokens'],
  preferCategory?: TokenCategory,
): string {
  const ref = resolveTokenRef(value, tokens, preferCategory);
  if (ref && ref.wpPreset) {
    return `var(${ref.wpPreset}--${ref.slug ?? ref.key})`;
  }
  return value;
}

/**
 * For individual heading elements, ensure fontStyle is present.
 * If the config doesn't specify fontStyle, default to "normal".
 */
export function ensureFontStyle(def: BaseStyleElementDef): BaseStyleElementDef {
  if (def.fontStyle !== undefined) return def;
  return { ...def, fontStyle: 'normal' };
}

function validateTokenGroup(category: string, group: TokenGroup): void {
  for (const [key, entry] of Object.entries(group)) {
    if (!entry.value && entry.value !== '0') {
      throw new Error(`Config error: Token "${category}.${key}" is missing a "value".`);
    }

    if (typeof entry.value !== 'string') {
      throw new Error(`Config error: Token "${category}.${key}.value" must be a string.`);
    }

    // Validate fontFace entries if present
    if (entry.fontFace) {
      for (const [i, face] of entry.fontFace.entries()) {
        if (!face.weight || !face.style || !face.src) {
          throw new Error(`Config error: Token "${category}.${key}.fontFace[${i}]" must have "weight", "style", and "src".`);
        }
      }
    }
  }
}

// ============================================================================
// baseStyles strict validation and value classification
//
// baseStyles values are classified as one of:
//   - token: a known token key in the expected category (resolves to a var ref)
//   - raw: an obviously raw CSS value (numeric, hex, function, multi-value, quoted)
//          or a known CSS keyword for the property (e.g. "italic" for fontStyle)
//   - invalid: neither — typo or stale reference, reported to the user
//
// Category lookup is strict per property — no cross-category fallback — so
// a `fontStyle: "normal"` cannot accidentally resolve to `fontWeight.normal`.
// ============================================================================

/**
 * Map baseStyles property names to their expected token category.
 * Properties with no entry here have no associated token category and
 * accept only CSS keywords or raw values.
 */
const PROPERTY_CATEGORY: Record<string, TokenCategory> = {
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  lineHeight: 'lineHeight',
  color: 'colorPalette',
  background: 'colorPalette',
  hoverColor: 'colorPalette',
  padding: 'spacing',
  blockGap: 'spacing',
};

/**
 * CSS keywords allowed per property. Values matching these pass through as
 * raw CSS even when they look like bare identifiers. Keep this conservative —
 * the point is to accept only universally valid CSS keywords so typos still
 * produce errors.
 */
const CSS_KEYWORDS: Record<string, Set<string>> = {
  fontStyle: new Set(['normal', 'italic', 'oblique', 'inherit', 'initial', 'unset']),
  fontWeight: new Set(['normal', 'bold', 'lighter', 'bolder', 'inherit', 'initial', 'unset']),
  fontFamily: new Set([
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
    'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace',
    'inherit', 'initial', 'unset',
  ]),
  lineHeight: new Set(['normal', 'inherit', 'initial', 'unset']),
  color: new Set(['inherit', 'transparent', 'currentColor', 'initial', 'unset']),
  background: new Set(['inherit', 'transparent', 'currentColor', 'initial', 'unset']),
  hoverColor: new Set(['inherit', 'transparent', 'currentColor', 'initial', 'unset']),
};

/**
 * Detect values that are obviously raw CSS — numeric/length values, hex colors,
 * function notation (rgb/var/calc/clamp/min/max), multi-value stacks (commas or
 * whitespace), and quoted strings. These bypass token lookup and keyword checks.
 *
 * The numeric check is strict: a value matches only if it is a valid CSS number
 * or length (optional sign, digits with optional decimal, optional unit).
 * Identifiers like "6x-large" or "2x-small" do NOT match, so undefined token
 * references are caught by validation instead of silently passing through.
 */
const NUMERIC_CSS_VALUE = /^-?(?:\d+\.?\d*|\.\d+)(?:[a-z]+|%)?$/i;

function looksLikeRawValue(value: string): boolean {
  if (value.length === 0) return true;
  if (NUMERIC_CSS_VALUE.test(value)) return true;
  if (value.startsWith('#')) return true;
  if (value.includes('(')) return true;
  if (/[\s,]/.test(value)) return true;
  if (value.startsWith('"') || value.startsWith("'")) return true;
  return false;
}

/** Classification result for a baseStyles value. */
export type BaseStyleValueClass =
  | { kind: 'token'; ref: ResolvedTokenRef }
  | { kind: 'raw' }
  | { kind: 'invalid'; category: TokenCategory | null; available: string[] };

/**
 * Classify a baseStyles value. The returned classification is the single
 * source of truth used by both validation (which throws on `invalid`) and
 * resolution (which emits `var()` for tokens and passes through raw values).
 *
 * Lookup is strict: a value is only considered a token match if it exists in
 * the category mapped to its property. Cross-category matches are never made.
 */
export function classifyBaseStyleValue(
  value: string,
  property: string,
  tokens: C2bConfig['tokens'],
): BaseStyleValueClass {
  const category = PROPERTY_CATEGORY[property] ?? null;

  // 1. Strict token lookup in the property's expected category
  if (category) {
    const group = tokens[category];
    if (group && value in group) {
      const def = CATEGORY_REGISTRY[category];
      return {
        kind: 'token',
        ref: {
          category,
          key: value,
          slug: group[value].slug,
          cssSegment: def.cssSegment,
          wpPreset: def.wpPreset,
        },
      };
    }
  }

  // 2. Obviously raw CSS value
  if (looksLikeRawValue(value)) return { kind: 'raw' };

  // 3. CSS keyword allowed for this property
  const keywords = CSS_KEYWORDS[property];
  if (keywords && keywords.has(value)) return { kind: 'raw' };

  // 4. Invalid — typo, stale token reference, or unsupported keyword
  return {
    kind: 'invalid',
    category,
    available: category ? Object.keys(tokens[category] ?? {}) : [],
  };
}

/**
 * Resolve a baseStyles value for SCSS output. Tokens emit CSS variable refs
 * (`var(--{prefix}--{cssSegment}-{key})`), raw values pass through unchanged.
 * Assumes `validateBaseStyles()` has already run — invalid values fall
 * through to raw as a defensive fallback.
 */
export function resolveBaseStyleValueForScss(
  value: string,
  property: string,
  prefix: string,
  tokens: C2bConfig['tokens'],
): string {
  const c = classifyBaseStyleValue(value, property, tokens);
  if (c.kind === 'token') {
    return `var(--${prefix}--${c.ref.cssSegment}-${c.ref.key})`;
  }
  return value;
}

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
export function resolveBaseStyleValueForThemeJson(
  value: string,
  property: string,
  tokens: C2bConfig['tokens'],
): string {
  const c = classifyBaseStyleValue(value, property, tokens);
  if (c.kind === 'token') {
    // Only emit a preset var if the token is actually exposed as a WP preset.
    // cssOnly tokens in preset categories have no slug, so WordPress won't
    // define the var — fall through to the raw underlying value instead.
    if (c.ref.wpPreset && c.ref.slug) {
      return `var(${c.ref.wpPreset}--${c.ref.slug})`;
    }
    const group = tokens[c.ref.category];
    return group?.[c.ref.key].value ?? value;
  }
  return value;
}

/**
 * Build a user-facing error message for an invalid baseStyles value.
 * Includes the context path, the property being validated, the expected
 * token category (if any), and the list of keys that are available.
 */
function buildBaseStyleValueError(
  context: string,
  value: string,
  property: string,
  classification: Extract<BaseStyleValueClass, { kind: 'invalid' }>,
): string {
  const { category, available } = classification;
  const header = `Config error: baseStyles.${context} = "${value}" is not a valid token or CSS keyword for "${property}".`;

  if (category) {
    // Reverse-map internal category name back to the user-facing name
    const userCategory = Object.entries(INPUT_CATEGORY_MAP).find(([, v]) => v === category)?.[0] ?? category;
    const availableList = available.length > 0 ? available.join(', ') : '(none defined)';
    const keywords = CSS_KEYWORDS[property];
    const keywordHint = keywords && keywords.size > 0
      ? `\n  Or use one of these CSS keywords: ${Array.from(keywords).join(', ')}.`
      : '';
    return `${header}\n  Expected a token key from tokens.${userCategory} (available: ${availableList}).${keywordHint}\n  Or provide a raw CSS value (numeric, hex, rgb(), var(), calc(), multi-value, or quoted string).`;
  }

  const keywords = CSS_KEYWORDS[property];
  const keywordList = keywords ? Array.from(keywords).join(', ') : '(none)';
  return `${header}\n  Expected a CSS keyword (${keywordList}) or a raw CSS value.`;
}

/**
 * Walk the entire baseStyles config and validate every string value. Throws
 * on the first invalid value with a detailed error message listing what was
 * expected. Called during `validateConfig()`, so dangling token references
 * and typos are caught before any files are written.
 */
export function validateBaseStyles(
  baseStyles: BaseStylesConfig | undefined,
  tokens: C2bConfig['tokens'],
): void {
  if (!baseStyles) return;

  const elements: Array<[string, BaseStyleElementDef | undefined]> = [
    ['body', baseStyles.body],
    ['heading', baseStyles.heading],
    ['h1', baseStyles.h1],
    ['h2', baseStyles.h2],
    ['h3', baseStyles.h3],
    ['h4', baseStyles.h4],
    ['h5', baseStyles.h5],
    ['h6', baseStyles.h6],
    ['caption', baseStyles.caption],
    ['button', baseStyles.button],
    ['link', baseStyles.link],
  ];

  const props: Array<keyof BaseStyleElementDef> = [
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'fontStyle',
    'color', 'background', 'hoverColor',
  ];

  for (const [elementName, def] of elements) {
    if (!def) continue;
    for (const prop of props) {
      const value = def[prop];
      if (value === undefined) continue;
      const c = classifyBaseStyleValue(value, prop, tokens);
      if (c.kind === 'invalid') {
        throw new Error(buildBaseStyleValueError(`${elementName}.${prop}`, value, prop, c));
      }
    }
  }

  // Spacing padding sides
  if (baseStyles.spacing?.padding) {
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      const value = baseStyles.spacing.padding[side];
      if (value === undefined) continue;
      const c = classifyBaseStyleValue(value, 'padding', tokens);
      if (c.kind === 'invalid') {
        throw new Error(buildBaseStyleValueError(`spacing.padding.${side}`, value, 'padding', c));
      }
    }
  }

  // Spacing blockGap
  if (baseStyles.spacing?.blockGap !== undefined) {
    const c = classifyBaseStyleValue(baseStyles.spacing.blockGap, 'blockGap', tokens);
    if (c.kind === 'invalid') {
      throw new Error(buildBaseStyleValueError('spacing.blockGap', baseStyles.spacing.blockGap, 'blockGap', c));
    }
  }
}
