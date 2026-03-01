import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { C2bConfig, C2bConfigInput, TokenCategory, TokenEntry, TokenEntryInput, TokenGroup, TokenGroupInput, BaseStyleElementDef, FluidInput } from './types.js';
import { CATEGORY_REGISTRY, INPUT_CATEGORY_MAP, VALID_CATEGORIES, kebabToTitle } from './types.js';

const DEFAULTS = {
  tokensPath: 'src/styles/tokens.css',
  wpDir: 'dist/wp',
} as const;

/** Reserved config keys that are not token categories (legacy flat format) */
const CONFIG_KEYS = ['prefix', 'tokensPath', 'outDir', 'wpThemeable', 'output', 'tokens', 'baseStyles'] as const;

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

  // Resolve output settings: new output wrapper takes precedence over legacy root-level keys
  const output = input.output ?? {};
  const tokensPath = output.tokensPath ?? input.tokensPath ?? DEFAULTS.tokensPath;
  const wpDir = output.wpDir ?? input.outDir ?? DEFAULTS.wpDir;
  const wpThemeable = output.wpThemeable ?? input.wpThemeable ?? false;

  return {
    prefix: input.prefix,
    tokensPath,
    wpDir,
    wpThemeable: wpThemeable === true,
    tokens,
    baseStyles: input.baseStyles,
  };
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
