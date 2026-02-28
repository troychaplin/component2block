# Getting Started

This guide covers the minimum needed to add `component2block` to a Storybook component library and start generating design tokens.

## Install

```bash
npm install component2block --save-dev
```

## Create the Config

Create `c2b.config.json` in your project root. The `prefix` field is the only required value — it determines your CSS variable namespace:

```json
{
  "prefix": "mylib",

  "color": {
    "primary": { "value": "#0073aa", "name": "Primary" },
    "secondary": { "value": "#23282d" },
    "primary-hover": { "value": "#005a87", "cssOnly": true }
  },

  "spacing": {
    "sm": { "value": "0.5rem", "slug": "30", "name": "Small" },
    "md": { "value": "1rem", "slug": "40", "name": "Medium" },
    "lg": { "value": "1.5rem", "slug": "50", "name": "Large" }
  },

  "fontFamily": {
    "inter": {
      "value": "Inter, sans-serif",
      "fontFace": [
        { "weight": "400", "style": "normal", "src": "inter-400-normal.woff2" },
        { "weight": "700", "style": "normal", "src": "inter-700-normal.woff2" }
      ]
    }
  },

  "fontSize": {
    "small": { "fluid": { "min": "0.875rem", "max": "1rem" } },
    "medium": { "fluid": { "min": "1rem", "max": "1.125rem" } },
    "large": { "fluid": { "min": "1.125rem", "max": "1.25rem" } }
  },

  "fontWeight": {
    "normal": "400",
    "bold": "700"
  },

  "radius": {
    "sm": "2px",
    "md": "4px",
    "lg": "8px"
  }
}
```

For the full list of token categories and syntax options, see [Tokens](./tokens.md). For base typography and spacing configuration, see [Base Styles](./base-styles.md).

## Generate

```bash
npx c2b generate
```

This produces:

```
your-project/
├── c2b.config.json
│
├── src/styles/
│   ├── tokens.css                   generated — CSS custom properties
│   ├── fonts.css                    generated — @font-face declarations
│   └── _content-generated.scss      generated — base typography (if baseStyles defined)
│
└── dist/wp/
    ├── theme.json                   generated — WordPress settings + styles
    ├── tokens.css                   generated — CSS vars (hardcoded values)
    ├── tokens.wp.css                generated — CSS vars (if wpThemeable: true)
    └── integrate.php                generated — PHP hooks
```

## Add the Storybook Preset

The preset auto-injects all generated styles into Storybook — no manual imports needed in `preview.ts`:

```ts
// .storybook/main.ts
export default {
  addons: [
    '@storybook/addon-docs',
    '../component2block/dist/preset.js',
  ],
};
```

It injects any of these files that exist in your `tokensPath` directory:

| File | Description |
|------|-------------|
| `tokens.css` | CSS custom properties (always generated) |
| `fonts.css` | `@font-face` declarations (if `fontFace` defined) |
| `reset.scss` | Structural CSS reset (authored by you) |
| `content.scss` | Base typography — imports `_content-generated.scss` + your behavioral rules (authored by you) |

See [Storybook Preset](./storybook-preset.md) for details.

## Use Tokens in Components

Reference the generated CSS variables in your component stylesheets:

```scss
.mylib-card {
  padding: var(--mylib--spacing-md);
  border-radius: var(--mylib--radius-md);
  font-size: var(--mylib--font-size-medium);
  color: var(--mylib--color-primary);
}
```

The variable pattern is always `--{prefix}--{category}-{key}`.

## Add to Build Scripts

Run the generator before Storybook and before your production build:

```json
{
  "scripts": {
    "generate": "component2block generate",
    "dev": "npm run generate && storybook dev -p 6006",
    "build": "npm run generate && npm run build:lib && npm run build:css"
  }
}
```

The generate step ensures `tokens.css` exists before Storybook or Vite needs it.

## What's Next

- [Configuration](./configuration.md) — Full config reference with all fields and options
- [Tokens](./tokens.md) — Token categories, syntax, fluid fonts, and CSS output
- [Base Styles](./base-styles.md) — Typography, spacing, `:where()` selectors, and alignfull
- [WordPress Integration](./wordpress-integration.md) — Adding compiled assets to a WordPress theme
