import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { StbConfig, StbConfigInput, TokenCategory, TokenEntry, TokenEntryInput, TokenGroup, TokenGroupInput, BaseStyleElementDef } from './types.js';
import { CATEGORY_REGISTRY, INPUT_CATEGORY_MAP, VALID_CATEGORIES, kebabToTitle } from './types.js';

const DEFAULTS = {
  tokensPath: 'src/styles/tokens.css',
  outDir: 'dist/wp',
} as const;

/** Reserved config keys that are not token categories */
const CONFIG_KEYS = ['prefix', 'tokensPath', 'outDir', 'wpThemeable', 'baseStyles'] as const;

export function loadConfig(configPath?: string): StbConfig {
  const resolvedPath = resolve(configPath ?? 'c2b.config.json');

  let raw: string;
  try {
    raw = readFileSync(resolvedPath, 'utf-8');
  } catch {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  let input: StbConfigInput;
  try {
    input = JSON.parse(raw) as StbConfigInput;
  } catch {
    throw new Error(`Invalid JSON in config file: ${resolvedPath}`);
  }

  return validateConfig(input);
}

/**
 * Expand a token entry input (string or object) into a full TokenEntry.
 *
 * CSS-only tokens (no preset registration) are created by either:
 * - String shorthand: "bold": "700"
 * - Explicit flag: { "value": "#005a87", "cssOnly": true }
 *
 * All other object entries auto-derive slug/name and register as presets.
 */
function expandTokenEntry(key: string, input: TokenEntryInput, isDirectMap?: boolean): TokenEntry {
  const isShorthand = typeof input === 'string';

  // String shorthand expands to { value: string }
  const entry: TokenEntry = isShorthand
    ? { value: input }
    : { ...input };

  // Direct-map categories (layout) don't use name/slug
  if (isDirectMap) {
    return entry;
  }

  // Auto-derive value from fluid.max when fluid is set but value is missing
  if (!entry.value && entry.fluid?.max) {
    entry.value = entry.fluid.max;
  }

  // CSS-only tokens: string shorthand or explicit cssOnly flag
  // These produce a CSS variable but skip preset registration
  const isCssOnly = isShorthand || entry.cssOnly === true;

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
 * Normalize a token group, expanding string shorthand and auto-deriving slug/name.
 */
function normalizeTokenGroup(group: TokenGroupInput, isDirectMap?: boolean): TokenGroup {
  const normalized: TokenGroup = {};
  for (const [key, input] of Object.entries(group)) {
    normalized[key] = expandTokenEntry(key, input, isDirectMap);
  }
  return normalized;
}

/**
 * Extract token categories from the flat config input.
 * Maps user-facing category names to internal names (e.g. "color" → "colorPalette").
 */
function extractTokens(input: StbConfigInput): Partial<Record<TokenCategory, TokenGroup>> {
  const tokens: Partial<Record<TokenCategory, TokenGroup>> = {};
  const validInputCategories = [
    ...Object.keys(INPUT_CATEGORY_MAP),
    ...VALID_CATEGORIES,
  ];

  for (const [key, value] of Object.entries(input)) {
    // Skip reserved config keys
    if ((CONFIG_KEYS as readonly string[]).includes(key)) continue;

    // Skip undefined values
    if (value === undefined) continue;

    // Must be an object (token group)
    if (typeof value !== 'object') {
      throw new Error(`Config error: "${key}" must be an object.`);
    }

    // Map user-facing name to internal category name
    const internalCategory = INPUT_CATEGORY_MAP[key] ?? key;

    // Validate category name
    if (!VALID_CATEGORIES.includes(internalCategory as TokenCategory)) {
      throw new Error(`Config error: Unknown token category "${key}". Valid categories: ${validInputCategories.filter(c => VALID_CATEGORIES.includes((INPUT_CATEGORY_MAP[c] ?? c) as TokenCategory)).join(', ')}`);
    }

    const def = CATEGORY_REGISTRY[internalCategory];
    tokens[internalCategory as TokenCategory] = normalizeTokenGroup(value as TokenGroupInput, def.directMap);
  }

  return tokens;
}

export function validateConfig(input: StbConfigInput): StbConfig {
  if (!input.prefix || typeof input.prefix !== 'string') {
    throw new Error('Config error: "prefix" is required and must be a string.');
  }

  const tokens = extractTokens(input);

  // Validate each category
  for (const [category, group] of Object.entries(tokens)) {
    validateTokenGroup(category, group as TokenGroup);
  }

  return {
    prefix: input.prefix,
    tokensPath: input.tokensPath ?? DEFAULTS.tokensPath,
    outDir: input.outDir ?? DEFAULTS.outDir,
    wpThemeable: input.wpThemeable === true,
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
  tokens: StbConfig['tokens'],
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
  tokens: StbConfig['tokens'],
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
  tokens: StbConfig['tokens'],
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
