import type { C2bConfig, TokenCategory, TokenGroup, BaseStylesConfig, BaseStyleElementDef } from '../types.js';
import { CATEGORY_REGISTRY, CATEGORY_ORDER, DEFAULT_FLUID, ELEMENT_REGISTRY, TYPOGRAPHY_PROPERTIES } from '../types.js';
import { resolveBaseStyleValueForThemeJson, ensureFontStyle } from '../config.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnySettings = Record<string, any>;

export function generateThemeJson(config: C2bConfig): string {
  const settings: AnySettings = {};
  const custom: Record<string, Record<string, string>> = {};

  // Note: We intentionally do NOT set most default*: false flags (defaultPalette,
  // defaultGradients, etc.) because the library's theme.json is injected at the
  // wp_theme_json_data_default layer. Setting these to false hides the library's
  // own presets since WordPress treats them as defaults. Themes that want to hide
  // WordPress core presets should set these flags in their own theme.json (layer 3).
  //
  // Exception: defaultSpacingSizes and customSpacingSize are set when spacing
  // tokens are defined — without them, WordPress auto-generates a spacing scale
  // that overrides the explicit values in spacingSizes.

  // When locked (themeable: false), disable custom color/gradient/duotone
  // creation in the Site Editor. Users can only pick from the defined presets.
  // integrate.php enforces this at the theme layer so themes can't override it.
  // Placed before the category loop so these flags appear first in settings.color.
  if (!config.themeable) {
    settings.color = {
      custom: false,
      customDuotone: false,
      customGradient: false,
    };
  }

  for (const category of CATEGORY_ORDER) {
    const group = config.tokens[category];
    if (!group) continue;

    const def = CATEGORY_REGISTRY[category];

    // Excluded categories (zIndex) — skip entirely
    if (def.exclude) continue;
    // SCSS-only categories (mediaQuery) never appear in theme.json
    if (def.scssOnly) continue;

    // Direct-map categories (layout) — map token keys directly to a settings object
    // Layout keys are expected in camelCase (e.g. "contentSize", "wideSize")
    if (def.directMap && def.themeJson) {
      const obj: Record<string, string> = {};
      for (const [key, entry] of Object.entries(group)) {
        obj[key] = entry.value;
      }
      if (Object.keys(obj).length > 0) {
        setNestedValue(settings, def.themeJson.path, obj);
      }
      continue;
    }

    // Preset categories (color, spacing, etc.) — build arrays from named tokens
    if (def.themeJson) {
      const presets = buildNamedEntries(group, def.themeJson.valueKey);
      if (presets.length > 0) {
        setNestedValue(settings, def.themeJson.path, presets);
      }
    }

    // Custom categories — tokens without name+slug (or all tokens if custom-only).
    // cssOnly tokens are excluded from settings.custom.* entirely so that the
    // cssOnly contract ("emit as CSS variable only, never expose to WordPress")
    // holds consistently across every category.
    if (def.custom) {
      const values: Record<string, string> = {};
      for (const [tokenKey, entry] of Object.entries(group)) {
        if (entry.cssOnly) continue;
        // If category has both themeJson and custom (like shadow),
        // only put tokens WITHOUT name+slug into custom
        if (def.themeJson && entry.name && entry.slug) continue;
        values[tokenKey] = entry.value;
      }
      if (Object.keys(values).length > 0) {
        custom[def.custom] = values;
      }
    }
  }

  // When custom font sizes are defined, enable fluid typography with explicit
  // viewport anchors. Always emitting the full object (rather than `true`)
  // ensures WordPress uses the same minViewportWidth / maxViewportWidth as
  // buildFluidClamp(), so the clamp() that WordPress itself writes into :root
  // from theme.json matches the clamp() in our generated tokens.css/tokens.wp.css
  // byte-for-byte. Using `true` instead would leave WP free to pick its own
  // defaults, which have drifted between WordPress versions.
  if (config.tokens.fontSize) {
    if (!settings.typography) settings.typography = {};
    const fluid = config.fluid ?? DEFAULT_FLUID;
    settings.typography.fluid = {
      minViewportWidth: fluid.minViewport,
      maxViewportWidth: fluid.maxViewport,
    };
  }

  // When spacing tokens are defined, disable WordPress's auto-generated spacing
  // scale and suppress its built-in defaults. Without these flags, WP regenerates
  // spacing values using its own multiplier algorithm (producing static values like
  // 0.44rem, 0.67rem, 1rem) which override the explicit values in spacingSizes —
  // including any responsive min() values.
  if (config.tokens.spacing) {
    if (!settings.spacing) settings.spacing = {};
    settings.spacing.customSpacingSize = false;
    settings.spacing.defaultSpacingSizes = false;
  }

  // Merge custom values into settings
  if (Object.keys(custom).length > 0) {
    settings.custom = custom;
  }

  settings.useRootPaddingAwareAlignments = true;

  const themeJson: Record<string, unknown> = {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    settings,
  };

  // Build styles block from baseStyles config
  if (config.baseStyles) {
    const styles = buildStylesBlock(config.baseStyles, config.tokens);
    if (styles) {
      themeJson.styles = styles;
    }
  }

  return JSON.stringify(themeJson, null, 2) + '\n';
}

/**
 * Build an array of preset objects from tokens that have name + slug.
 */
function buildNamedEntries(
  group: TokenGroup,
  valueKey: string,
): Array<Record<string, unknown>> {
  const entries: Array<Record<string, unknown>> = [];
  for (const entry of Object.values(group)) {
    if (entry.name && entry.slug) {
      const obj: Record<string, unknown> = {
        slug: entry.slug,
        [valueKey]: entry.value,
        name: entry.name,
      };
      if (entry.fluid) {
        obj.fluid = entry.fluid;
      }
      if (entry.fontFace && entry.fontFace.length > 0) {
        obj.fontFace = entry.fontFace.map(face => ({
          fontFamily: entry.name,
          fontStyle: face.style,
          fontWeight: face.weight,
          src: [`file:./assets/fonts/${entry.slug}/${face.src}`],
        }));
      }
      entries.push(obj);
    }
  }
  return entries;
}

/**
 * Set a value at a dot-separated path in a nested object.
 * e.g. setNestedValue(obj, "color.palette", [...]) → obj.color.palette = [...]
 */
function setNestedValue(obj: AnySettings, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Build the theme.json styles block from baseStyles config.
 */
function buildStylesBlock(
  baseStyles: BaseStylesConfig,
  tokens: C2bConfig['tokens'],
): Record<string, unknown> | null {
  const styles: Record<string, unknown> = {};

  // Body typography → styles.typography
  if (baseStyles.body) {
    const bodyTypo = buildTypographyObject(baseStyles.body, tokens);
    if (Object.keys(bodyTypo).length > 0) {
      styles.typography = bodyTypo;
    }
  }

  // Body color → styles.color
  if (baseStyles.body) {
    const bodyColor = buildColorObject(baseStyles.body, tokens);
    if (Object.keys(bodyColor).length > 0) {
      styles.color = bodyColor;
    }
  }

  // Spacing → styles.spacing
  if (baseStyles.spacing?.blockGap || baseStyles.spacing?.padding) {
    const spacingBlock: Record<string, unknown> = {};

    if (baseStyles.spacing.blockGap) {
      spacingBlock.blockGap = resolveBaseStyleValueForThemeJson(baseStyles.spacing.blockGap, 'blockGap', tokens);
    }

    if (baseStyles.spacing.padding) {
      const padding: Record<string, string> = {};
      for (const [side, value] of Object.entries(baseStyles.spacing.padding)) {
        if (value !== undefined) {
          padding[side] = resolveBaseStyleValueForThemeJson(value, 'padding', tokens);
        }
      }
      if (Object.keys(padding).length > 0) {
        spacingBlock.padding = padding;
      }
    }

    if (Object.keys(spacingBlock).length > 0) {
      styles.spacing = spacingBlock;
    }
  }

  // Elements → styles.elements (driven by ELEMENT_REGISTRY)
  const elements: Record<string, unknown> = {};

  for (const elementDef of ELEMENT_REGISTRY) {
    const def = baseStyles[elementDef.key];
    if (!def) continue;

    const withDefaults = elementDef.isHeading ? ensureFontStyle(def) : def;
    const elementObj: Record<string, unknown> = {};

    const typo = buildTypographyObject(withDefaults, tokens);
    if (Object.keys(typo).length > 0) {
      elementObj.typography = typo;
    }

    const color = buildColorObject(withDefaults, tokens);
    if (Object.keys(color).length > 0) {
      elementObj.color = color;
    }

    // Per-heading top margin → styles.elements.{hN}.spacing.margin.top
    // Sibling-based rules (afterHeading) live in typography.css.
    if (elementDef.isHeading) {
      const spacing = buildSpacingObject(def, tokens);
      if (spacing) {
        elementObj.spacing = spacing;
      }
    }

    // Hover pseudo (link)
    if (elementDef.hoverCssSelector && def.hoverColor !== undefined) {
      elementObj[':hover'] = {
        color: { text: resolveBaseStyleValueForThemeJson(def.hoverColor, 'hoverColor', tokens) },
      };
    }

    if (Object.keys(elementObj).length > 0) {
      elements[elementDef.themeJsonKey] = elementObj;
    }
  }

  if (Object.keys(elements).length > 0) {
    styles.elements = elements;
  }

  return Object.keys(styles).length > 0 ? styles : null;
}

/**
 * Build a theme.json typography object from a BaseStyleElementDef.
 * Each property is resolved strictly against its expected token category.
 * Preset tokens (fontFamily, fontSize) emit `var(--wp--preset--*)`;
 * custom-only tokens (fontWeight, lineHeight) emit their underlying value
 * so WordPress receives valid CSS rather than a semantic slug.
 */
function buildTypographyObject(
  def: BaseStyleElementDef,
  tokens: C2bConfig['tokens'],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const prop of TYPOGRAPHY_PROPERTIES) {
    const value = def[prop];
    if (value === undefined) continue;
    result[prop] = resolveBaseStyleValueForThemeJson(value, prop, tokens);
  }
  return result;
}

/**
 * Build a theme.json color object from a BaseStyleElementDef.
 * Maps color → text and background → background. Resolved strictly against
 * tokens.colorPalette.
 */
function buildColorObject(
  def: BaseStyleElementDef,
  tokens: C2bConfig['tokens'],
): Record<string, string> {
  const result: Record<string, string> = {};

  if (def.color !== undefined) {
    result.text = resolveBaseStyleValueForThemeJson(def.color, 'color', tokens);
  }
  if (def.background !== undefined) {
    result.background = resolveBaseStyleValueForThemeJson(def.background, 'background', tokens);
  }

  return result;
}

/**
 * Build a theme.json spacing object from a BaseStyleElementDef.
 * Currently only handles `marginBlockStart` → `margin.top`. Returns null when
 * no spacing properties are set.
 */
function buildSpacingObject(
  def: BaseStyleElementDef,
  tokens: C2bConfig['tokens'],
): Record<string, unknown> | null {
  if (def.marginBlockStart === undefined) return null;
  const top = resolveBaseStyleValueForThemeJson(def.marginBlockStart, 'marginBlockStart', tokens);
  return { margin: { top } };
}
