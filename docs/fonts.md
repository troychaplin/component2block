# Fonts

This guide covers how to configure web fonts in `c2b.config.json`, including static fonts, variable fonts from Google Fonts, and system font stacks.

## Font Configuration

Fonts are defined in the `fontFamily` category. Each entry can be either an object (with optional `fontFace` declarations) or a string shorthand for CSS-only system stacks.

```json
{
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
```

- **Object entries** register as WordPress presets and appear in the Site Editor font picker
- **String shorthand** entries produce a CSS variable only — no WordPress preset, no `@font-face`

## Static Fonts

Static font files have a fixed weight and style baked in. Add one `fontFace` entry per weight/style combination:

```json
{
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
```

Each entry generates a separate `@font-face` block.

## Variable Fonts

Variable fonts contain multiple weights (and sometimes styles) in a single file. The `weight` field is a plain string, so you can pass a weight range:

```json
{
  "fontFamily": {
    "inter": {
      "value": "Inter, sans-serif",
      "fontFace": [
        { "weight": "100 900", "style": "normal", "src": "inter-variable-normal.woff2" }
      ]
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
```

Check the font's page on Google Fonts for the exact weight range (e.g., 400–900 for Playfair Display).

## System Font Stacks

For system fonts that don't need `@font-face` declarations, use the string shorthand:

```json
{
  "fontFamily": {
    "system": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "mono": "'SF Mono', 'Fira Code', 'Fira Mono', monospace"
  }
}
```

String entries are always CSS-only — they produce a CSS variable but no WordPress preset and no `@font-face` output.

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

Generated when any `fontFamily` entry has a `fontFace` array. Placed in the same directory as `tokensPath`:

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

See [Storybook Preset](./storybook-preset.md) for the full list of injected files.
