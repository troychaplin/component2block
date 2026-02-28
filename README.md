# component2block

Generate WordPress `theme.json`, CSS token mappings, and PHP integration hooks from a single JSON config. Designed for Storybook component libraries that need to work in WordPress block themes.

## Quick Setup

```bash
npm install component2block --save-dev
```

**1. Create `c2b.config.json`** in your project root:

```json
{
  "prefix": "mylib",
  "color": {
    "primary": { "value": "#0073aa", "name": "Primary" },
    "primary-hover": { "value": "#005a87", "cssOnly": true }
  },
  "spacing": {
    "sm": { "value": "0.5rem", "slug": "30", "name": "Small" },
    "md": { "value": "1rem", "slug": "40", "name": "Medium" }
  },
  "fontFamily": {
    "inter": {
      "value": "Inter, sans-serif",
      "fontFace": [
        { "weight": "400", "style": "normal", "src": "inter-400-normal.woff2" }
      ]
    }
  },
  "fontSize": {
    "small": { "fluid": { "min": "0.875rem", "max": "1rem" } },
    "medium": { "fluid": { "min": "1rem", "max": "1.125rem" } }
  }
}
```

**2. Generate:**

```bash
npx c2b generate
```

**3. Add the Storybook preset** to `.storybook/main.ts`:

```ts
addons: [
  '@storybook/addon-docs',
  '../component2block/dist/preset.js',
],
```

The preset auto-injects `tokens.css`, `fonts.css`, `reset.scss`, and `content.scss` into Storybook. No manual imports needed in `preview.ts`.

**4. Use tokens in components:**

```scss
.mylib-card {
  padding: var(--mylib--spacing-md);
  border-radius: var(--mylib--radius-md);
  font-size: var(--mylib--font-size-medium);
}
```

**5. Add to your build scripts:**

```json
{
  "scripts": {
    "generate": "component2block generate",
    "dev": "npm run generate && storybook dev -p 6006",
    "build": "npm run generate && npm run build:lib && npm run build:css"
  }
}
```

## What It Generates

```
c2b.config.json
    │
    │   component2block generate
    │
    ├──► src/styles/tokens.css              CSS variables (Storybook / React)
    ├──► src/styles/fonts.css               @font-face declarations
    ├──► src/styles/_content-generated.scss  Base typography from baseStyles
    │
    ├──► dist/wp/theme.json                 WordPress theme.json base layer
    ├──► dist/wp/tokens.wp.css              CSS variables mapped to --wp--preset--*
    └──► dist/wp/integrate.php              PHP filter for wp_theme_json_data_default
```

| File | When generated | Purpose |
|------|----------------|---------|
| `tokens.css` | Always | CSS custom properties with hardcoded values |
| `fonts.css` | When `fontFace` is defined | `@font-face` declarations |
| `_content-generated.scss` | When `baseStyles` is defined | Body typography, root padding, `.has-global-padding` / `.alignfull`, and heading styles |
| `theme.json` | Always | WordPress settings and styles |
| `tokens.wp.css` | When `wpThemeable: true` | CSS vars mapped to `--wp--preset--*` with fallbacks |
| `integrate.php` | Always | PHP hook to inject theme.json as a WordPress default layer |

## Config Reference

### Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `prefix` | Yes | — | CSS variable prefix (`mylib` produces `--mylib--*`) |
| `tokensPath` | No | `src/styles/tokens.css` | Output path for the generated tokens file |
| `outDir` | No | `dist/wp` | Output directory for WordPress files |
| `wpThemeable` | No | `false` | Generates `tokens.wp.css` with `--wp--preset--*` mappings |
| `baseStyles` | No | — | Element typography, spacing, and layout for body, headings, and caption |

### Token Categories

| Category | CSS Variable Pattern | WordPress Mapping |
|----------|---------------------|-------------------|
| `color` | `--prefix--color-*` | `settings.color.palette` |
| `gradient` | `--prefix--gradient-*` | `settings.color.gradients` |
| `spacing` | `--prefix--spacing-*` | `settings.spacing.spacingSizes` |
| `fontFamily` | `--prefix--font-family-*` | `settings.typography.fontFamilies` |
| `fontSize` | `--prefix--font-size-*` | `settings.typography.fontSizes` |
| `shadow` | `--prefix--shadow-*` | `settings.shadow.presets` |
| `layout` | `--prefix--layout-*` | `settings.layout` |
| `fontWeight` | `--prefix--font-weight-*` | `settings.custom` (CSS only) |
| `lineHeight` | `--prefix--line-height-*` | `settings.custom` (CSS only) |
| `radius` | `--prefix--radius-*` | `settings.custom` (CSS only) |
| `transition` | `--prefix--transition-*` | `settings.custom` (CSS only) |
| `zIndex` | `--prefix--z-*` | Excluded from theme.json |

### Token Syntax

**Object syntax** registers the token as a WordPress preset (visible in the Site Editor). The `slug` and `name` are auto-derived from the key:

```json
{ "color": { "primary": { "value": "#0073aa", "name": "Primary" } } }
```

**String shorthand** creates a CSS variable only (no WordPress preset):

```json
{ "fontWeight": { "bold": "700" } }
```

**`cssOnly` flag** on an object entry skips preset registration while keeping the object format:

```json
{ "color": { "primary-hover": { "value": "#005a87", "cssOnly": true } } }
```

**Fluid font sizes** generate responsive `clamp()` values:

```json
{ "fontSize": { "small": { "fluid": { "min": "0.875rem", "max": "1rem" } } } }
```

### Base Styles

The `baseStyles` section generates base typography and spacing for body, headings, and captions. Values that match a token key resolve to the corresponding CSS variable:

```json
{
  "baseStyles": {
    "body": { "fontFamily": "inter", "fontSize": "medium", "fontWeight": "400", "lineHeight": "1.6" },
    "heading": { "fontFamily": "inter" },
    "h1": { "fontSize": "4.5rem", "fontWeight": "500" },
    "h2": { "fontSize": "3rem", "fontWeight": "500" },
    "caption": { "fontSize": "small", "fontStyle": "italic", "fontWeight": "300" },
    "spacing": {
      "padding": { "top": "0", "right": "large", "bottom": "0", "left": "large" }
    }
  }
}
```

This produces `_content-generated.scss` with `body {}`, `:where()` rules, `.has-global-padding`, and `.alignfull` breakout rules for Storybook/React, and a `styles` block in theme.json for WordPress.

The `spacing.padding` section maps to WordPress's `useRootPaddingAwareAlignments` pattern. Token keys like `"large"` resolve to spacing preset variables (`var(--wp--preset--spacing--60)` in theme.json, `var(--prefix--spacing-large)` in SCSS). For Storybook/React, apply `.has-global-padding` to container elements and `.alignfull` to children that should break out to full width.

See [Base Styles](./docs/getting-started/BASE-STYLES.md) for the full design rationale.

## CLI

```
component2block generate [options]

Options:
  --config <path>   Path to config file (default: ./c2b.config.json)
  --dry-run         Output to stdout instead of writing files
```

## Programmatic API

```ts
import { generate } from 'component2block';

const result = generate('./c2b.config.json');
// result.files: Array<{ path: string; size: number }>
```

Individual generators:

```ts
import {
  loadConfig,
  generateTokensCss,
  generateTokensWpCss,
  generateThemeJson,
  generateFontsCss,
  generateContentScss,
  generateIntegratePhp,
} from 'component2block';
```

## Documentation

### Getting Started

| Guide | Description |
|-------|-------------|
| [Installation](./docs/getting-started/INSTALLATION.md) | Install, config, generate, build setup |
| [Tokens](./docs/getting-started/TOKENS.md) | Token categories, syntax, CSS output |
| [Base Styles](./docs/getting-started/BASE-STYLES.md) | Typography, spacing, alignfull |
| [Storybook Preset](./docs/getting-started/STORYBOOK-PRESET.md) | Preset setup, auto-injected files |

### Advanced

| Guide | Description |
|-------|-------------|
| [Architecture](./docs/advanced/ARCHITECTURE.md) | Design decisions, project structure |
| [Token Architecture](./docs/advanced/TOKEN-ARCHITECTURE.md) | Full token flow, internals |
| [Theme Integration](./docs/advanced/THEME-INTEGRATION.md) | WordPress theme setup |
| [Plugin Integration](./docs/advanced/PLUGIN-INTEGRATION.md) | WordPress block plugin setup |
| [Editor Styles](./docs/advanced/EDITOR-STYLES.md) | WordPress editor iframe styles |
| [theme.json Notes](./docs/advanced/THEMEJSON-NOTES.md) | theme.json reference |

## Development

```bash
npm install
npm run build    # Compile TypeScript
npm test         # Run tests
```

## License

MIT
