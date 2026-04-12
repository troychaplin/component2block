# Token Flow

This document walks through how a single token defined in `c2b.config.json` flows through the generator pipeline and resolves differently in each output format.

## From Config to Output

Given this config entry:

```json
{
  "prefix": "mylib",
  "tokens": {
    "color": {
      "primary": "#0073aa"
    }
  }
}
```

The generator produces four different representations:

### tokens.css (Storybook / React)

```css
--mylib--color-primary: #0073aa;
```

Hardcoded value. Used during development and in non-WordPress consumers.

### tokens.wp.css (WordPress, themeable)

```css
--mylib--color-primary: var(--wp--preset--color--primary, #0073aa);
```

Maps to the WordPress preset variable with the original value as fallback. If a theme overrides "primary" to `#e63946`, this variable follows the override.

### theme.json (WordPress settings)

```json
{
  "settings": {
    "color": {
      "palette": [
        { "slug": "primary", "color": "#0073aa", "name": "Primary" }
      ]
    }
  }
}
```

Registers the token as a WordPress preset, making it available in the Site Editor color picker.

### base-styles.scss (base styles)

When `"primary"` is referenced in `baseStyles`:

```json
{ "heading": { "color": "primary" } }
```

SCSS output:
```scss
:where(h1, h2, h3, h4, h5, h6) {
  color: var(--mylib--color-primary);
}
```

theme.json styles output:
```json
{
  "styles": {
    "elements": {
      "heading": {
        "color": {
          "text": "var(--wp--preset--color--primary)"
        }
      }
    }
  }
}
```

Same config value, different variable references per output.

## Resolution Functions

Two kinds of resolver live in `src/config.ts`.

### Generic resolvers (used outside `baseStyles`)

- `resolveForScss(value, prefix, tokens, preferCategory?)`
- `resolveForThemeJson(value, tokens, preferCategory?)`

These look up the value against the full token table. When `preferCategory` is provided it checks that category first; otherwise it walks all categories in registry order. A matching key becomes a CSS variable reference; anything else passes through as-is.

```
resolveForScss("primary", "mylib", tokens, "colorPalette")
  → var(--mylib--color-primary)

resolveForScss("3rem", "mylib", tokens)
  → 3rem
```

### Strict baseStyles resolvers

Everything written under `baseStyles` goes through a different code path designed to catch typos and dangling references:

- `resolveBaseStyleValueForScss(value, property, prefix, tokens)`
- `resolveBaseStyleValueForThemeJson(value, property, tokens)`

Both delegate to `classifyBaseStyleValue(value, property, tokens)`, which is the single source of truth for how a `baseStyles` string is interpreted. Classification returns exactly one of:

1. **token** — value is a key in the property's expected token category. Strict lookup only — there is no cross-category fallback, so `fontSize: "large"` will never resolve to a `spacing.large` token even if no `fontSize.large` exists.
2. **raw** — value is obviously raw CSS (numeric, hex, function call, multi-value, quoted) **or** a known CSS keyword for the property (e.g. `italic` for `fontStyle`, `sans-serif` for `fontFamily`).
3. **invalid** — typo, stale reference, or unknown keyword. Caught at config load time by `validateBaseStyles()` with a clear error.

The property → category mapping lives in `PROPERTY_CATEGORY`:

| Property | Category |
|----------|----------|
| `fontFamily` | `fontFamily` |
| `fontSize` | `fontSize` |
| `fontWeight` | `fontWeight` |
| `lineHeight` | `lineHeight` |
| `fontStyle` | — (no category) |
| `color`, `background`, `hoverColor` | `colorPalette` |
| `spacing.padding.*`, `spacing.blockGap` | `spacing` |

CSS keyword fallbacks per property live in `CSS_KEYWORDS`. When a token and a keyword have the same name (e.g. `fontWeight.bold` token vs. the CSS keyword `bold`), the token always wins.

### SCSS vs theme.json output for strict resolution

Same token key, different outputs:

| Classification | SCSS output | theme.json output |
|---|---|---|
| token in a preset category with a slug | `var(--mylib--{segment}-{key})` | `var(--wp--preset--{category}--{slug})` |
| token in a preset category that is `cssOnly` (no slug) | `var(--mylib--{segment}-{key})` | raw underlying value |
| token in a custom-only category (`fontWeight`, `lineHeight`, `radius`, `transition`) | `var(--mylib--{segment}-{key})` | raw underlying value |
| raw CSS value or keyword | value passes through | value passes through |

The theme.json fallback for custom-only and `cssOnly` tokens is deliberate: WordPress would not define a `--wp--preset--*` variable for those tokens, so emitting a semantic reference like `var(--wp--preset--font-weight--medium)` would give broken CSS. The generator emits the underlying value (e.g. `"500"`) instead.

## CSS-Only Token Flow

`cssOnly: true` means "emit as a CSS variable only, never expose to WordPress." The contract is honored identically across every category by every generator.

```json
{
  "tokens": {
    "color": {
      "primary": "#0073aa",
      "primary-hover": { "value": "#005a87", "cssOnly": true }
    },
    "fontWeight": {
      "normal": "400",
      "black": { "value": "900", "cssOnly": true }
    },
    "shadow": {
      "card": "0 1px 3px rgba(0,0,0,0.1)",
      "focus-ring": { "value": "0 0 0 3px rgba(0,115,170,0.4)", "cssOnly": true }
    }
  }
}
```

| Output | `primary-hover` (cssOnly) | `black` (cssOnly in custom-only category) | `focus-ring` (cssOnly in dual-mode category) |
|--------|--------------------------|-------------------------------------------|----------------------------------------------|
| `tokens.css` | `--mylib--color-primary-hover: #005a87;` | `--mylib--font-weight-black: 900;` | `--mylib--shadow-focus-ring: 0 0 0 3px rgba(...);` |
| `tokens.wp.css` (themeable mode) | Hardcoded — no `var(--wp--preset--*, fallback)` mapping | Hardcoded | Hardcoded |
| `theme.json` preset array | Excluded from `settings.color.palette` | N/A (category has no preset array) | Excluded from `settings.shadow.presets` |
| `theme.json` `settings.custom.*` | N/A | **Excluded** from `settings.custom.fontWeight` | **Excluded** from `settings.custom.shadow` |
| `baseStyles` ref → SCSS | `var(--mylib--color-primary-hover)` | `var(--mylib--font-weight-black)` | `var(--mylib--shadow-focus-ring)` |
| `baseStyles` ref → theme.json `styles` | Falls back to `"#005a87"` | Falls back to `"900"` | Falls back to the raw shadow value |

`cssOnly` tokens never map to `--wp--preset--*` or `--wp--custom--*` variables, in any mode, across any category. If you need a token to be consumable from inside WordPress (in theme.json `styles` or block markup), don't mark it `cssOnly`.

## Fluid Font Size Flow

Fluid font sizes generate `clamp()` values. Use the shorthand `{ "min", "max" }` directly:

```json
{
  "tokens": {
    "fontSize": {
      "small": { "min": "0.875rem", "max": "1rem" }
    }
  }
}
```

| Output | Value |
|--------|-------|
| tokens.css | `--mylib--font-size-small: clamp(0.875rem, 0.875rem + ((1vw - 0.2rem) * 0.208), 1rem);` |
| tokens.wp.css | `--mylib--font-size-small: var(--wp--preset--font-size--small, clamp(...));` |
| theme.json | `{ "slug": "small", "size": "1rem", "fluid": { "min": "0.875rem", "max": "1rem" } }` |

In theme.json, the `size` field uses the `max` value (or explicit `value` if provided). WordPress handles its own fluid calculation from the `fluid` object.

## Custom Category Flow

Categories without native WordPress preset support go under `settings.custom`:

```json
{
  "tokens": {
    "fontWeight": { "bold": "700" },
    "radius": { "lg": "8px" }
  }
}
```

theme.json output:
```json
{
  "settings": {
    "custom": {
      "fontWeight": { "bold": "700" },
      "radius": { "lg": "8px" }
    }
  }
}
```

WordPress generates `--wp--custom--font-weight--bold` and `--wp--custom--radius--lg` CSS variables from these. However, they don't appear in any editor UI controls.

The `zIndex` category is excluded from theme.json entirely — it only produces CSS variables.

## WordPress theme.json Cascade

When `integrate.php` injects the library's theme.json:

```
Layer 1: WordPress core defaults
Layer 2: Library base (via wp_theme_json_data_default) ← integrate.php injects here
Layer 3: Parent theme theme.json
Layer 4: Child theme theme.json
Layer 5: User Global Styles (Site Editor)
```

Each higher layer overrides the one below. A theme's `theme.json` at layer 3 automatically overrides library defaults at layer 2.

With `tokens.wp.css`, the override flows through to components:

1. Theme sets `"primary"` to `#e63946` in its theme.json (layer 3)
2. WordPress updates `--wp--preset--color--primary` to `#e63946`
3. `tokens.wp.css`: `--mylib--color-primary: var(--wp--preset--color--primary, #0073aa)` resolves to `#e63946`
4. Component CSS using `var(--mylib--color-primary)` displays the theme's color
