import type { C2bConfig, TokenCategory, TokenGroup, BaseStylesConfig, BaseStyleElementDef } from '../types.js';
import { CATEGORY_REGISTRY, CATEGORY_ORDER, kebabToCamel } from '../types.js';
import { resolveForThemeJson, ensureFontStyle } from '../config.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnySettings = Record<string, any>;

export function generateThemeJson(config: C2bConfig): string {
  const settings: AnySettings = {};
  const custom: Record<string, Record<string, string>> = {};

  // Note: We intentionally do NOT set default*: false flags (defaultPalette,
  // defaultGradients, defaultSpacingSizes, etc.) because the library's theme.json
  // is injected at the wp_theme_json_data_default layer. Setting these to false
  // hides the library's own presets since WordPress treats them as defaults.
  // Themes that want to hide WordPress core presets should set these flags in
  // their own theme.json (layer 3), where they won't affect the library.

  // When locked (wpThemeable: false), disable custom color/gradient/duotone
  // creation in the Site Editor. Users can only pick from the defined presets.
  // integrate.php enforces this at the theme layer so themes can't override it.
  // Placed before the category loop so these flags appear first in settings.color.
  if (!config.wpThemeable) {
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

    // Direct-map categories (layout) — map token keys directly to a settings object
    if (def.directMap && def.themeJson) {
      const obj: Record<string, string> = {};
      for (const [key, entry] of Object.entries(group)) {
        obj[kebabToCamel(key)] = entry.value;
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

    // Custom categories — tokens without name+slug (or all tokens if custom-only)
    if (def.custom) {
      const values: Record<string, string> = {};
      for (const [tokenKey, entry] of Object.entries(group)) {
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

  // When custom font sizes are defined, enable fluid typography
  if (config.tokens.fontSize) {
    if (!settings.typography) settings.typography = {};
    settings.typography.fluid = true;
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

  // Spacing → styles.spacing (prefer spacing category for ambiguous keys)
  if (baseStyles.spacing?.blockGap || baseStyles.spacing?.padding) {
    const spacingBlock: Record<string, unknown> = {};

    if (baseStyles.spacing.blockGap) {
      spacingBlock.blockGap = resolveForThemeJson(baseStyles.spacing.blockGap, tokens, 'spacing');
    }

    if (baseStyles.spacing.padding) {
      const padding: Record<string, string> = {};
      for (const [side, value] of Object.entries(baseStyles.spacing.padding)) {
        if (value !== undefined) {
          padding[side] = resolveForThemeJson(value, tokens, 'spacing');
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

  // Elements → styles.elements
  const elements: Record<string, unknown> = {};
  const elementKeys = ['heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'caption', 'button', 'link'] as const;

  for (const element of elementKeys) {
    const def = baseStyles[element];
    if (!def) continue;

    // Individual headings get fontStyle: normal default
    const isIndividualHeading = /^h[1-6]$/.test(element);
    const withDefaults = isIndividualHeading ? ensureFontStyle(def) : def;

    const elementObj: Record<string, unknown> = {};

    const typo = buildTypographyObject(withDefaults, tokens);
    if (Object.keys(typo).length > 0) {
      elementObj.typography = typo;
    }

    const color = buildColorObject(withDefaults, tokens);
    if (Object.keys(color).length > 0) {
      elementObj.color = color;
    }

    // Link :hover pseudo-class
    if (element === 'link' && def.hoverColor !== undefined) {
      const hoverColor: Record<string, string> = {
        text: resolveForThemeJson(def.hoverColor, tokens, 'colorPalette'),
      };
      elementObj[':hover'] = { color: hoverColor };
    }

    if (Object.keys(elementObj).length > 0) {
      elements[element] = elementObj;
    }
  }

  if (Object.keys(elements).length > 0) {
    styles.elements = elements;
  }

  return Object.keys(styles).length > 0 ? styles : null;
}

/**
 * Build a theme.json typography object from a BaseStyleElementDef.
 * Values are resolved through resolveForThemeJson.
 */
function buildTypographyObject(
  def: BaseStyleElementDef,
  tokens: C2bConfig['tokens'],
): Record<string, string> {
  const result: Record<string, string> = {};

  if (def.fontFamily !== undefined) {
    result.fontFamily = resolveForThemeJson(def.fontFamily, tokens);
  }
  if (def.fontSize !== undefined) {
    result.fontSize = resolveForThemeJson(def.fontSize, tokens);
  }
  if (def.fontStyle !== undefined) {
    result.fontStyle = def.fontStyle;
  }
  if (def.fontWeight !== undefined) {
    result.fontWeight = def.fontWeight;
  }
  if (def.lineHeight !== undefined) {
    result.lineHeight = def.lineHeight;
  }

  return result;
}

/**
 * Build a theme.json color object from a BaseStyleElementDef.
 * Maps color → text and background → background.
 * Values are resolved through resolveForThemeJson with 'colorPalette' preference.
 */
function buildColorObject(
  def: BaseStyleElementDef,
  tokens: C2bConfig['tokens'],
): Record<string, string> {
  const result: Record<string, string> = {};

  if (def.color !== undefined) {
    result.text = resolveForThemeJson(def.color, tokens, 'colorPalette');
  }
  if (def.background !== undefined) {
    result.background = resolveForThemeJson(def.background, tokens, 'colorPalette');
  }

  return result;
}
