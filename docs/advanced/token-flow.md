# Token Flow

This document walks through how a single token defined in `c2b.config.json` flows through the generator pipeline and resolves differently in each output format.

## From Config to Output

Given this config entry:

```json
{
  "prefix": "mylib",
  "color": {
    "primary": { "value": "#0073aa", "name": "Primary" }
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

### _content-generated.scss (base styles)

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

### resolveForScss()

Used by the SCSS generator. Maps token key references to `--prefix--*` variables:

```
"inter"   → var(--mylib--font-family-inter)
"medium"  → var(--mylib--font-size-medium)
"primary" → var(--mylib--color-primary)
"3rem"    → 3rem  (not a token key, passes through)
"500"     → 500   (not a token key, passes through)
```

### resolveForThemeJson()

Used by the theme.json generator. Maps token key references to `--wp--preset--*` variables:

```
"inter"   → var(--wp--preset--font-family--inter)
"medium"  → var(--wp--preset--font-size--medium)
"primary" → var(--wp--preset--color--primary)
"3rem"    → 3rem  (passes through)
"500"     → 500   (passes through)
```

### Disambiguation with preferCategory

When a key exists in multiple categories (e.g. `"large"` in both `spacing` and `fontSize`), the `preferCategory` parameter selects which one to resolve:

```
resolveForScss("large", prefix, tokens, "spacing")
  → var(--mylib--spacing-large)

resolveForScss("large", prefix, tokens, "fontSize")
  → var(--mylib--font-size-large)
```

The base styles config uses context to determine the preferred category — font properties prefer `fontSize`/`fontFamily`, spacing properties prefer `spacing`, etc.

## CSS-Only Token Flow

CSS-only tokens (string shorthand or `cssOnly: true`) follow a simpler path:

```json
{
  "color": {
    "primary-hover": { "value": "#005a87", "cssOnly": true }
  },
  "fontWeight": {
    "bold": "700"
  }
}
```

| Output | primary-hover | bold |
|--------|--------------|------|
| tokens.css | `--mylib--color-primary-hover: #005a87;` | `--mylib--font-weight-bold: 700;` |
| tokens.wp.css | `--mylib--color-primary-hover: #005a87;` (hardcoded) | `--mylib--font-weight-bold: 700;` (hardcoded) |
| theme.json | Omitted from `settings.color.palette` | Goes under `settings.custom.fontWeight` |

CSS-only tokens never map to `--wp--preset--*` variables, even in themeable mode.

## Fluid Font Size Flow

Fluid font sizes generate `clamp()` values:

```json
{
  "fontSize": {
    "small": { "fluid": { "min": "0.875rem", "max": "1rem" } }
  }
}
```

| Output | Value |
|--------|-------|
| tokens.css | `--mylib--font-size-small: clamp(0.875rem, 0.875rem + ((0.125) * ((100vw - 320px) / 1280)), 1rem);` |
| tokens.wp.css | `--mylib--font-size-small: var(--wp--preset--font-size--small, clamp(...));` |
| theme.json | `{ "slug": "small", "size": "1rem", "fluid": { "min": "0.875rem", "max": "1rem" } }` |

In theme.json, the `size` field uses the `max` value (or explicit `value` if provided). WordPress handles its own fluid calculation from the `fluid` object.

## Custom Category Flow

Categories without native WordPress preset support go under `settings.custom`:

```json
{
  "fontWeight": { "bold": "700" },
  "radius": { "lg": "8px" }
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
