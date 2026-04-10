# Fonts

This guide covers how to configure web fonts in `c2b.config.json`, including static fonts, variable fonts from Google Fonts, and system font stacks.

## Font Configuration

Fonts are defined in the `fontFamily` category under `tokens`. Each entry can be either an object (with optional `fontFace` declarations) or a string shorthand.

```json
{
  "tokens": {
    "fontFamily": {
      "inter": {
        "value": "Inter, sans-serif",
        "fontFace": [
          { "weight": "400", "style": "normal", "src": "inter-400-normal.woff2" },
          { "weight": "700", "style": "normal", "src": "inter-700-normal.woff2" }
        ]
      },
      "system": "-apple-system, BlinkMacSystemFont, sans-serif"
    }
  }
}
```

- **Object entries** register as WordPress presets and appear in the Site Editor font picker
- **String shorthand** entries also register as WordPress presets (with auto-derived `slug` and `name`), but without `@font-face` declarations

## Static Fonts

Static font files have a fixed weight and style baked in. Add one `fontFace` entry per weight/style combination:

```json
{
  "tokens": {
    "fontFamily": {
      "inter": {
        "value": "Inter, sans-serif",
        "fontFace": [
          { "weight": "400", "style": "normal", "src": "inter-400-normal.woff2" },
          { "weight": "400", "style": "italic", "src": "inter-400-italic.woff2" },
          { "weight": "700", "style": "normal", "src": "inter-700-normal.woff2" },
          { "weight": "700", "style": "italic", "src": "inter-700-italic.woff2" }
        ]
      }
    }
  }
}
```

Each entry generates a separate `@font-face` block.

## Variable Fonts

Variable fonts contain multiple weights (and sometimes styles) in a single file. The `weight` field is a plain string, so you can pass a weight range:

```json
{
  "tokens": {
    "fontFamily": {
      "inter": {
        "value": "Inter, sans-serif",
        "fontFace": [
          { "weight": "100 900", "style": "normal", "src": "inter-variable-normal.woff2" }
        ]
      }
    }
  }
}
```

This produces `font-weight: 100 900;` in the `@font-face` block, telling the browser the single file covers the full weight range.

If the variable font also has an italic axis, add a second entry:

```json
{
  "fontFace": [
    { "weight": "100 900", "style": "normal", "src": "inter-variable-normal.woff2" },
    { "weight": "100 900", "style": "italic", "src": "inter-variable-italic.woff2" }
  ]
}
```

## Using Google Fonts

Google Fonts offers variable font files for most of its catalog. To use one:

1. Visit [Google Fonts](https://fonts.google.com) and pick a font
2. Download the variable `.woff2` file (look for filenames like `Inter-VariableFont_wght.woff2`)
3. Place the file in your project (e.g., `public/fonts/inter/`)
4. Configure the entry with a weight range matching the font's available weights

```json
{
  "tokens": {
    "fontFamily": {
      "inter": {
        "value": "Inter, sans-serif",
        "fontFace": [
          { "weight": "100 900", "style": "normal", "src": "Inter-VariableFont_wght.woff2" }
        ]
      },
      "playfair": {
        "value": "Playfair Display, serif",
        "fontFace": [
          { "weight": "400 900", "style": "normal", "src": "PlayfairDisplay-VariableFont_wght.woff2" },
          { "weight": "400 900", "style": "italic", "src": "PlayfairDisplay-Italic-VariableFont_wght.woff2" }
        ]
      }
    }
  }
}
```

Check the font's page on Google Fonts for the exact weight range (e.g., 400–900 for Playfair Display).

## System Font Stacks

For system fonts that don't need `@font-face` declarations, use the string shorthand:

```json
{
  "tokens": {
    "fontFamily": {
      "system": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "mono": "'SF Mono', 'Fira Code', 'Fira Mono', monospace"
    }
  }
}
```

String entries register as WordPress presets (with auto-derived `slug` and `name`) but produce no `@font-face` output.

## Font Sizes

Font sizes are defined in the `fontSize` category under `tokens`. They support both static values and fluid (responsive) sizing using `clamp()`.

### Fluid Font Sizes

Fluid entries scale smoothly between a minimum and maximum size based on viewport width. Use the shorthand `{ "min": "...", "max": "..." }` directly on the entry:

```json
{
  "tokens": {
    "fontSize": {
      "small":   { "min": "0.875rem", "max": "1rem" },
      "medium":  { "min": "1rem", "max": "1.125rem" },
      "large":   { "min": "1.125rem", "max": "1.25rem" },
      "x-large": { "min": "1.25rem", "max": "1.5rem" }
    }
  }
}
```

The old `{ "fluid": { "min": "...", "max": "..." } }` form still works but the shorthand above is preferred.

The generator produces a `clamp()` value matching WordPress's fluid typography formula:

```css
:root {
  --mylib--font-size-small: clamp(0.875rem, 0.875rem + ((0.125) * ((100vw - 320px) / 1280)), 1rem);
}
```

The formula scales linearly between the `min` value at a 320px viewport and the `max` value at a 1600px viewport. These breakpoints match WordPress's fluid typography defaults.

The `value` field is auto-derived from `fluid.max` when not provided, so you don't need to specify it.

### Static Font Sizes

For sizes that shouldn't scale with the viewport, use a plain `value`:

```json
{
  "tokens": {
    "fontSize": {
      "fixed": { "value": "1rem" }
    }
  }
}
```

This produces a simple CSS variable with no `clamp()`:

```css
:root {
  --mylib--font-size-fixed: 1rem;
}
```

### Font Size Properties

| Property | Required | Description |
|----------|----------|-------------|
| `value` | Yes* | The CSS value. *Auto-derived from `max` for fluid sizes |
| `min` | No | Minimum size for fluid responsive sizing (shorthand) |
| `max` | No | Maximum size for fluid responsive sizing (shorthand) |
| `fluid` | No | `{ min, max }` for responsive sizing (legacy form, shorthand preferred) |
| `name` | No | Human-readable label (auto-derived from key) |
| `slug` | No | WordPress preset slug (auto-derived from key) |
| `cssOnly` | No | When `true`, emit as a CSS variable only and exclude from WordPress entirely (no preset, no `settings.custom.*`, not overridable in the Site Editor). Useful for "display" heading sizes that shouldn't appear in the Gutenberg size picker. |

Fluid `min` and `max` accept `rem`, `em`, or `px` units. Both values must use the same unit.

### Generated Output

#### tokens.css

Fluid sizes produce `clamp()` values; static sizes pass through as-is:

```css
:root {
  --mylib--font-size-small: clamp(0.875rem, 0.875rem + ((0.125) * ((100vw - 320px) / 1280)), 1rem);
  --mylib--font-size-fixed: 1rem;
}
```

#### theme.json

Font sizes register as WordPress presets with the fluid range, enabling the Site Editor size picker:

```json
{
  "settings": {
    "typography": {
      "fluid": true,
      "fontSizes": [
        {
          "slug": "small",
          "name": "Small",
          "size": "1rem",
          "fluid": { "min": "0.875rem", "max": "1rem" }
        }
      ]
    }
  }
}
```

When any `fontSize` tokens are defined, the generator sets `typography.fluid: true` in theme.json so WordPress uses its own fluid engine for the Site Editor.

### Using Font Sizes in Base Styles

Reference font size tokens by key:

```json
{
  "baseStyles": {
    "body": { "fontSize": "medium" },
    "h1": { "fontSize": "4.5rem" }
  }
}
```

Token keys like `"medium"` resolve to the corresponding CSS variable. Raw values like `"4.5rem"` pass through as-is. See [Base Styles](./base-styles.md) for details.

### Using Font Sizes in Components

```scss
.mylib-card__content {
  font-size: var(--mylib--font-size-medium);
}
```

The variable pattern is `--{prefix}--font-size-{key}`.

---

## fontFace Entry Properties

| Property | Required | Description |
|----------|----------|-------------|
| `weight` | Yes | Font weight — single value (`"400"`) or range (`"100 900"`) |
| `style` | Yes | Font style — `"normal"` or `"italic"` |
| `src` | Yes | Font filename (e.g., `"inter-400-normal.woff2"`) |

Supported file formats are inferred from the extension:

| Extension | Format |
|-----------|--------|
| `.woff2` | woff2 |
| `.woff` | woff |
| `.ttf` | truetype |
| `.otf` | opentype |

## Font File Placement

Font files live in different locations depending on the environment:

### Storybook / Development

Place font files at:

```
public/fonts/{slug}/{filename}
```

Example for an `inter` font entry:

```
public/fonts/inter/inter-400-normal.woff2
public/fonts/inter/inter-700-normal.woff2
```

The generated `fonts.css` references `/fonts/{slug}/{src}`:

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/inter/inter-400-normal.woff2') format('woff2');
}
```

### WordPress

The generated `theme.json` references `file:./assets/fonts/{slug}/{src}`:

```json
{
  "fontFace": [
    {
      "fontFamily": "Inter",
      "fontStyle": "normal",
      "fontWeight": "400",
      "src": ["file:./assets/fonts/inter/inter-400-normal.woff2"]
    }
  ]
}
```

Copy your font files into your WordPress theme at `assets/fonts/{slug}/` to match.

## Generated Output

### fonts.css

Generated when any `fontFamily` entry has a `fontFace` array. Placed in the same directory as `output.tokensPath`:

```css
/* Auto-generated by component2block — do not edit manually */

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/inter/inter-400-normal.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  src: url('/fonts/inter/inter-700-normal.woff2') format('woff2');
}
```

For a variable font with `"weight": "100 900"`, the output is:

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  src: url('/fonts/inter/Inter-VariableFont_wght.woff2') format('woff2');
}
```

### tokens.css

The `fontFamily` token produces a CSS custom property:

```css
:root {
  --mylib--font-family-inter: Inter, sans-serif;
}
```

### theme.json

Object entries register as WordPress font families with their `fontFace` definitions:

```json
{
  "settings": {
    "typography": {
      "fontFamilies": [
        {
          "slug": "inter",
          "name": "Inter",
          "fontFamily": "Inter, sans-serif",
          "fontFace": [
            {
              "fontFamily": "Inter",
              "fontStyle": "normal",
              "fontWeight": "400",
              "src": ["file:./assets/fonts/inter/inter-400-normal.woff2"]
            }
          ]
        }
      ]
    }
  }
}
```

## Using Fonts in Base Styles

Reference font tokens by key in the `baseStyles` section:

```json
{
  "baseStyles": {
    "body": {
      "fontFamily": "inter"
    },
    "heading": {
      "fontFamily": "inter"
    }
  }
}
```

The value `"inter"` resolves to `var(--prefix--font-family-inter)` in SCSS and `var(--wp--preset--font-family--inter)` in theme.json. See [Base Styles](./base-styles.md) for details.

## Using Fonts in Components

Reference the generated CSS variable directly:

```scss
.mylib-card__title {
  font-family: var(--mylib--font-family-inter);
}
```

The variable pattern is `--{prefix}--font-family-{key}`.

## Storybook Preset

The Storybook preset auto-injects `fonts.css` when it exists. No manual import needed — just add the preset to `.storybook/main.ts`:

```ts
export default {
  addons: [
    '../component2block/dist/preset.js',
  ],
};
```

See [Storybook Preset](../guides/storybook-preset.md) for the full list of injected files.
