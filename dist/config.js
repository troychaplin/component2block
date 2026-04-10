import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CATEGORY_REGISTRY, INPUT_CATEGORY_MAP, VALID_CATEGORIES, kebabToTitle } from './types.js';
const DEFAULTS = {
    tokensPath: 'src/styles/tokens.css',
    wpDir: 'dist/wp',
};
/** Reserved config keys that are not token categories (legacy flat format) */
const CONFIG_KEYS = ['prefix', 'tokensPath', 'outDir', 'wpThemeable', 'output', 'tokens', 'baseStyles'];
export function loadConfig(configPath) {
    const resolvedPath = resolve(configPath ?? 'c2b.config.json');
    let raw;
    try {
        raw = readFileSync(resolvedPath, 'utf-8');
    }
    catch {
        throw new Error(`Config file not found: ${resolvedPath}`);
    }
    let input;
    try {
        input = JSON.parse(raw);
    }
    catch {
        throw new Error(`Invalid JSON in config file: ${resolvedPath}`);
    }
    return validateConfig(input);
}
/**
 * Check if an input looks like a fluid shorthand: { min: string, max: string }
 * without a "value" key. Distinguishes from a full TokenEntry object.
 */
function isFluidInput(input) {
    if (typeof input !== 'object' || input === null)
        return false;
    const obj = input;
    return (typeof obj.min === 'string' &&
        typeof obj.max === 'string' &&
        !('value' in obj));
}
/**
 * Determine if string shorthand should register as a preset for this category.
 * Preset-capable categories (those with wpPreset) register strings as presets.
 * Custom-only and excluded categories keep strings as CSS-only.
 */
function isPresetCategory(internalCategory) {
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
function expandTokenEntry(key, input, isDirectMap, internalCategory) {
    const isShorthand = typeof input === 'string';
    let entry;
    if (isShorthand) {
        entry = { value: input };
    }
    else if (isFluidInput(input)) {
        // Fluid shorthand: { min, max } → { value: max, fluid: { min, max } }
        entry = { value: input.max, fluid: { min: input.min, max: input.max } };
    }
    else {
        entry = { ...input };
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
        ? !presetCapable // String shorthand: preset for preset categories, CSS-only otherwise
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
function normalizeTokenGroup(group, isDirectMap, internalCategory) {
    const normalized = {};
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
function extractTokens(input) {
    const tokens = {};
    const validInputCategories = [
        ...Object.keys(INPUT_CATEGORY_MAP),
        ...VALID_CATEGORIES,
    ];
    // Determine source: new tokens wrapper or legacy flat format
    const source = input.tokens ?? input;
    for (const [key, value] of Object.entries(source)) {
        // Skip reserved config keys (only relevant for legacy flat format)
        if (CONFIG_KEYS.includes(key))
            continue;
        // Skip undefined values
        if (value === undefined)
            continue;
        // Must be an object (token group)
        if (typeof value !== 'object') {
            // In legacy flat format, non-object values like booleans are config keys
            if (!input.tokens)
                continue;
            throw new Error(`Config error: "${key}" must be an object.`);
        }
        // Map user-facing name to internal category name
        const internalCategory = INPUT_CATEGORY_MAP[key] ?? key;
        // Validate category name
        if (!VALID_CATEGORIES.includes(internalCategory)) {
            throw new Error(`Config error: Unknown token category "${key}". Valid categories: ${validInputCategories.filter(c => VALID_CATEGORIES.includes((INPUT_CATEGORY_MAP[c] ?? c))).join(', ')}`);
        }
        const def = CATEGORY_REGISTRY[internalCategory];
        tokens[internalCategory] = normalizeTokenGroup(value, def.directMap, internalCategory);
    }
    return tokens;
}
export function validateConfig(input) {
    if (!input.prefix || typeof input.prefix !== 'string') {
        throw new Error('Config error: "prefix" is required and must be a string.');
    }
    const tokens = extractTokens(input);
    // Validate each category
    for (const [category, group] of Object.entries(tokens)) {
        validateTokenGroup(category, group);
    }
    // Validate baseStyles references against the token table
    validateBaseStyles(input.baseStyles, tokens);
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
/**
 * Check if a value matches a token key in any category.
 * Returns resolution info if found, null if it's a raw value.
 *
 * When `preferCategory` is provided, that category is checked first.
 * This resolves ambiguity when the same key exists in multiple categories
 * (e.g. "large" in both fontSize and spacing).
 */
export function resolveTokenRef(value, tokens, preferCategory) {
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
        if (!group)
            continue;
        if (value in group) {
            const def = CATEGORY_REGISTRY[category];
            return {
                category: category,
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
export function resolveForScss(value, prefix, tokens, preferCategory) {
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
export function resolveForThemeJson(value, tokens, preferCategory) {
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
export function ensureFontStyle(def) {
    if (def.fontStyle !== undefined)
        return def;
    return { ...def, fontStyle: 'normal' };
}
function validateTokenGroup(category, group) {
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
const PROPERTY_CATEGORY = {
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
const CSS_KEYWORDS = {
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
 * Detect values that are obviously raw CSS — numeric values (with or without
 * units), hex colors, function notation (rgb/var/calc/clamp/min/max),
 * multi-value stacks (commas or whitespace), and quoted strings. These
 * bypass token lookup and keyword checks entirely.
 */
function looksLikeRawValue(value) {
    if (value.length === 0)
        return true;
    if (/^[-\d.]/.test(value))
        return true;
    if (value.startsWith('#'))
        return true;
    if (value.includes('('))
        return true;
    if (/[\s,]/.test(value))
        return true;
    if (value.startsWith('"') || value.startsWith("'"))
        return true;
    return false;
}
/**
 * Classify a baseStyles value. The returned classification is the single
 * source of truth used by both validation (which throws on `invalid`) and
 * resolution (which emits `var()` for tokens and passes through raw values).
 *
 * Lookup is strict: a value is only considered a token match if it exists in
 * the category mapped to its property. Cross-category matches are never made.
 */
export function classifyBaseStyleValue(value, property, tokens) {
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
    if (looksLikeRawValue(value))
        return { kind: 'raw' };
    // 3. CSS keyword allowed for this property
    const keywords = CSS_KEYWORDS[property];
    if (keywords && keywords.has(value))
        return { kind: 'raw' };
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
export function resolveBaseStyleValueForScss(value, property, prefix, tokens) {
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
export function resolveBaseStyleValueForThemeJson(value, property, tokens) {
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
function buildBaseStyleValueError(context, value, property, classification) {
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
export function validateBaseStyles(baseStyles, tokens) {
    if (!baseStyles)
        return;
    const elements = [
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
    const props = [
        'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'fontStyle',
        'color', 'background', 'hoverColor',
    ];
    for (const [elementName, def] of elements) {
        if (!def)
            continue;
        for (const prop of props) {
            const value = def[prop];
            if (value === undefined)
                continue;
            const c = classifyBaseStyleValue(value, prop, tokens);
            if (c.kind === 'invalid') {
                throw new Error(buildBaseStyleValueError(`${elementName}.${prop}`, value, prop, c));
            }
        }
    }
    // Spacing padding sides
    if (baseStyles.spacing?.padding) {
        for (const side of ['top', 'right', 'bottom', 'left']) {
            const value = baseStyles.spacing.padding[side];
            if (value === undefined)
                continue;
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
//# sourceMappingURL=config.js.map