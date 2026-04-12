# Getting Started

This guide covers the minimum needed to add `component2block` to a Storybook component library and start generating design tokens.

## Install

```bash
npm install component2block --save-dev
```

## Create the Config

Scaffold a starter config with the `init` command:

```bash
npx c2b init
```

This creates `c2b.config.json` in your project root with sensible defaults. Edit it to match your project — the `prefix` field is the only required value and determines your CSS variable namespace:

```json
{
  "prefix": "mylib",

  "output": {
    "srcDir": "src/styles",
    "themeDir": "dist/c2b",
    "themeable": false
  },

  "tokens": {
    "color": {
      "primary": "#0073aa",
      "secondary": "#23282d",
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
      "small": { "min": "0.875rem", "max": "1rem" },
      "medium": { "min": "1rem", "max": "1.125rem" },
      "large": { "min": "1.125rem", "max": "1.25rem" }
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
}
```

For the full list of token categories and syntax options, see [Tokens](./guides/tokens.md). For base typography and spacing configuration, see [Base Styles](./config/base-styles.md).

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
│   └── base-styles.scss             generated — base typography (if baseStyles defined)
│
└── dist/c2b/
    ├── theme.json                   generated — WordPress settings + styles
    ├── tokens.css                   generated — CSS vars (hardcoded values)
    ├── tokens.wp.css                generated — CSS vars (if themeable: true)
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

It injects any of these files that exist in your `output.srcDir` directory:

| File | Description |
|------|-------------|
| `tokens.css` | CSS custom properties (always generated) |
| `fonts.css` | `@font-face` declarations (if `fontFace` defined) |
| `reset.scss` | Structural CSS reset (authored by you) |
| `content.scss` | Base typography — imports `base-styles.scss` + your behavioral rules (authored by you) |

See [Storybook Preset](./guides/storybook-preset.md) for details.

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

- [Configuration Reference](./config/README.md) — Global fields, token categories, generated files, and full example
  - [Colors & Gradients](./config/colors.md) — Color palette, gradients, cssOnly tokens, and locked vs themeable mode
  - [Spacing](./config/spacing.md) — Spacing scale, WordPress slug conventions, and responsive values
  - [Shadows](./config/shadow.md) — Box shadows, preset vs custom behavior, and Site Editor integration
  - [Fonts](./config/fonts.md) — Static fonts, variable fonts, Google Fonts, and file placement
  - [Base Styles](./config/base-styles.md) — Elements, typography, colors, spacing, and `:where()` selectors
- [Guides](./guides/README.md) — Usage docs for building with component2block
  - [Tokens](./guides/tokens.md) — Token categories, syntax, fluid fonts, and CSS output
  - [Markup Patterns](./guides/markup.md) — Layout classes for Storybook and WordPress
  - [Storybook Preset](./guides/storybook-preset.md) — Auto-injecting generated styles into Storybook
  - [CLI & Build](./guides/cli-and-build.md) — CLI commands, build scripts, and publishing setup
- [WordPress](./wordpress/README.md) — Theme integration, theming modes, and block setup
  - [Integration](./wordpress/integration.md) — Adding compiled assets to a WordPress block theme
  - [Theming](./wordpress/theming.md) — Locked vs themeable mode, style variations, and overrides
  - [Blocks](./wordpress/blocks.md) — Registering block plugins that use library tokens
  - [Editor Styles](./wordpress/editor-styles.md) — Loading styles inside the block editor iframe
  - [theme.json Reference](./wordpress/theme-json-reference.md) — Full settings and styles structure
- [Advanced](./advanced/README.md) — Architecture and internal pipeline
  - [Architecture](./advanced/architecture.md) — Design decisions and project structure
  - [Token Flow](./advanced/token-flow.md) — How tokens flow from config to generated output
