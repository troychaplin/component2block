# Installation

`component2block` is a build tool that bridges a Storybook component library with WordPress block themes. It reads a single configuration file and generates all CSS token files and WordPress-specific assets from one source of truth.

## What It Does

You define your design tokens once in `c2b.config.json`. The generate command produces everything your component library and WordPress themes need:

```
your-project/
├── c2b.config.json                  (you create this — single source of truth)
│
│   npx c2b generate
│
├── src/styles/
│   ├── tokens.css                   (generated — CSS vars for Storybook dev)
│   ├── fonts.css                    (generated — @font-face declarations)
│   ├── _content-generated.scss      (generated — base typography from config)
│   ├── content.scss                 (authored — imports generated + behavioral rules)
│   └── reset.scss                   (authored — structural CSS reset)
│
└── dist/wp/
    ├── theme.json                   (generated — base theme.json layer)
    ├── tokens.wp.css                (generated — if wpThemeable: true)
    └── integrate.php                (generated — PHP filter hook)
```

`tokens.css` is generated from the config, ensuring your Storybook components, published React package, and WordPress assets all share the same values.

## Install

```bash
npm install component2block --save-dev
```

## Creating the Config

Create `c2b.config.json` in your project root. Categories are defined at the top level:

```json
{
  "prefix": "starter",
  "tokensPath": "src/styles/tokens.css",
  "outDir": "dist/wp",

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

For the full list of token categories, syntax options, and properties, see [Tokens](./TOKENS.md).

### Config Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `prefix` | Yes | — | CSS variable prefix (e.g. `starter` produces `--starter--*`) |
| `tokensPath` | No | `src/styles/tokens.css` | Where to write the generated tokens CSS file |
| `outDir` | No | `dist/wp` | Output directory for WordPress-specific files |
| `wpThemeable` | No | `false` | When `true`, generates `tokens.wp.css` with `--wp--preset--*` variable mappings |
| `baseStyles` | No | — | Element-level typography for body, headings, and caption. Generates `_content-generated.scss` and a `styles` block in theme.json. See [Base Styles](./BASE-STYLES.md) |

## Running the Generator

```bash
npx c2b generate
```

This reads `c2b.config.json` and produces:

| Generated File | Location | Purpose |
|----------------|----------|---------|
| `tokens.css` | `src/styles/tokens.css` | CSS variables with hardcoded values (for Storybook dev) |
| `fonts.css` | `src/styles/fonts.css` | @font-face declarations (if fontFace defined) |
| `_content-generated.scss` | `src/styles/_content-generated.scss` | Base typography from `baseStyles` config |
| `tokens.css` | `dist/wp/tokens.css` | CSS variables with hardcoded values (for WordPress) |
| `tokens.wp.css` | `dist/wp/tokens.wp.css` | CSS variables mapped to `--wp--preset--*` (if `wpThemeable: true`) |
| `theme.json` | `dist/wp/theme.json` | WordPress theme.json base layer |
| `integrate.php` | `dist/wp/integrate.php` | PHP hooks: theme.json filter + token CSS enqueue |

By default, all tokens use hardcoded values (locked design system). To allow WordPress theme overrides via the Site Editor, add `"wpThemeable": true` to your config. This generates an additional `tokens.wp.css` file that maps preset tokens to `--wp--preset--*` variables.

The `dist/wp/` directory is self-contained — `integrate.php` auto-detects and enqueues whichever token file is present (`tokens.wp.css` preferred, `tokens.css` fallback).

## Build Scripts

Add the generate step to your project's build pipeline:

```json
{
  "scripts": {
    "generate": "component2block generate",
    "dev": "npm run generate && storybook dev -p 6006",
    "build": "npm run generate && npm run build:lib && npm run build:css && npm run build:wp",
    "build:lib": "vite build",
    "build:css": "node scripts/build-css.js",
    "build:wp": "component2block generate"
  }
}
```

The generate step runs before both `dev` and `build` to ensure `tokens.css` exists when Storybook or Vite needs it. The `build:wp` step re-runs after `build:css` because Vite's `emptyDirBeforeWrite` clears the `dist/` directory.

## Publishing the Library

When publishing your component library to npm, include the WordPress assets in your package exports:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css",
    "./css/*": "./dist/css/*",
    "./wp/*": "./dist/wp/*"
  },
  "files": ["dist"]
}
```

After publishing, the package contains everything a consumer needs:

```
node_modules/your-component-library/
├── dist/
│   ├── index.js              # React components (ES module)
│   ├── index.d.ts            # TypeScript declarations
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.js
│   │   │   ├── Button.d.ts
│   │   │   └── Button.css
│   │   └── Card/
│   │       ├── Card.js
│   │       ├── Card.d.ts
│   │       └── Card.css
│   ├── styles.css            # Bundled CSS (all components + tokens)
│   ├── css/
│   │   ├── tokens.css        # CSS vars with hardcoded values
│   │   ├── fonts.css         # @font-face declarations
│   │   └── reset.css         # Compiled base styles
│   ├── fonts/                # Font files (if fontFace defined)
│   │   └── inter/
│   │       └── inter-400-normal.woff2
│   └── wp/
│       ├── integrate.php     # PHP hooks: theme.json filter + token enqueue
│       ├── theme.json        # WordPress theme.json base layer
│       ├── tokens.css        # CSS vars with hardcoded values (locked)
│       └── tokens.wp.css     # CSS vars mapped to --wp--preset--* (themeable)
```

## CLI Reference

```bash
# Generate from default config (./c2b.config.json)
npx c2b generate

# Generate from a custom config path
npx c2b generate --config path/to/config.json

# Preview output without writing files
npx c2b generate --dry-run
```

## What This Package Does NOT Do

- It does not modify your component TSX or CSS files
- It does not scaffold blocks, `block.json`, or PHP render templates
- It does not change how components reference CSS variables — they use `--prefix--*` everywhere
- It does not require WordPress to build or develop components
