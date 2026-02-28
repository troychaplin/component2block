# Configuration

The `c2b.config.json` file is the single source of truth for all generated outputs. This page covers every config field and option.

## Config Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `prefix` | Yes | — | CSS variable prefix (e.g. `mylib` produces `--mylib--*`) |
| `tokensPath` | No | `src/styles/tokens.css` | Output path for the generated tokens CSS file |
| `outDir` | No | `dist/wp` | Output directory for WordPress files |
| `wpThemeable` | No | `false` | When `true`, generates `tokens.wp.css` with `--wp--preset--*` mappings |
| `baseStyles` | No | — | Element typography, spacing, and layout. See [Base Styles](./base-styles.md) |

Token categories are defined at the top level alongside these fields.

## Generated Files

| File | Location | When Generated | Purpose |
|------|----------|----------------|---------|
| `tokens.css` | `{tokensPath}` | Always | CSS custom properties with hardcoded values |
| `fonts.css` | `{tokensPath dir}/fonts.css` | When `fontFace` defined | `@font-face` declarations |
| `_content-generated.scss` | `{tokensPath dir}/_content-generated.scss` | When `baseStyles` defined | Base typography with `:where()` selectors |
| `tokens.css` | `{outDir}/tokens.css` | Always | CSS variables for WordPress (hardcoded) |
| `tokens.wp.css` | `{outDir}/tokens.wp.css` | When `wpThemeable: true` | CSS variables mapped to `--wp--preset--*` |
| `theme.json` | `{outDir}/theme.json` | Always | WordPress settings and styles |
| `integrate.php` | `{outDir}/integrate.php` | Always | PHP hooks for the theme.json cascade |

## Full Example

```json
{
  "prefix": "mylib",
  "tokensPath": "src/styles/tokens.css",
  "outDir": "dist/wp",
  "wpThemeable": false,

  "layout": {
    "content-size": "768px",
    "wide-size": "1280px"
  },

  "color": {
    "primary": { "value": "#0073aa", "name": "Primary" },
    "primary-hover": { "value": "#005a87", "cssOnly": true },
    "secondary": { "value": "#23282d" },
    "secondary-hover": { "value": "#1a1e21", "cssOnly": true },
    "success": { "value": "#00a32a" },
    "error": { "value": "#d63638" }
  },

  "gradient": {
    "sunset": {
      "value": "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)"
    }
  },

  "spacing": {
    "xs": { "value": "0.25rem", "slug": "20", "name": "2X-Small" },
    "sm": { "value": "0.5rem", "slug": "30", "name": "Small" },
    "md": { "value": "1rem", "slug": "40", "name": "Medium" },
    "lg": { "value": "1.5rem", "slug": "50", "name": "Large" },
    "xl": { "value": "2.25rem", "slug": "60", "name": "X-Large" }
  },

  "fontFamily": {
    "inter": {
      "value": "Inter, sans-serif",
      "fontFace": [
        { "weight": "400", "style": "normal", "src": "inter-400-normal.woff2" },
        { "weight": "700", "style": "normal", "src": "inter-700-normal.woff2" }
      ]
    },
    "system": "-apple-system, BlinkMacSystemFont, sans-serif"
  },

  "fontSize": {
    "small": { "fluid": { "min": "0.875rem", "max": "1rem" } },
    "medium": { "fluid": { "min": "1rem", "max": "1.125rem" } },
    "large": { "fluid": { "min": "1.125rem", "max": "1.25rem" } },
    "x-large": { "fluid": { "min": "1.25rem", "max": "1.5rem" } }
  },

  "shadow": {
    "natural": { "value": "6px 6px 9px rgba(0, 0, 0, 0.2)" },
    "deep": { "value": "12px 12px 50px rgba(0, 0, 0, 0.4)" }
  },

  "fontWeight": {
    "normal": "400",
    "bold": "700"
  },

  "lineHeight": {
    "tight": "1.25",
    "normal": "1.5"
  },

  "radius": {
    "sm": "2px",
    "md": "4px",
    "lg": "8px"
  },

  "transition": {
    "fast": "150ms ease",
    "normal": "200ms ease"
  },

  "zIndex": {
    "dropdown": "100",
    "modal": "300"
  },

  "baseStyles": {
    "body": {
      "fontFamily": "inter",
      "fontSize": "medium",
      "fontWeight": "400",
      "lineHeight": "1.6",
      "color": "secondary",
      "background": "base"
    },
    "heading": {
      "fontFamily": "inter",
      "color": "primary"
    },
    "h1": { "fontSize": "4.5rem", "fontWeight": "500" },
    "h2": { "fontSize": "3rem", "fontWeight": "500" },
    "h3": { "fontSize": "2.5rem", "fontWeight": "500" },
    "h4": { "fontSize": "2rem", "fontWeight": "500" },
    "h5": { "fontSize": "1.5rem", "fontWeight": "500" },
    "h6": { "fontSize": "1.45rem", "fontWeight": "500", "fontStyle": "italic" },
    "caption": { "fontSize": "small", "fontStyle": "italic", "fontWeight": "300" },
    "button": { "color": "off-white", "background": "primary" },
    "link": { "color": "primary", "hoverColor": "primary-hover" },
    "spacing": {
      "blockGap": "medium",
      "padding": {
        "top": "0",
        "right": "large",
        "bottom": "0",
        "left": "large"
      }
    }
  }
}
```

## Token Categories

For detailed syntax and examples for each category, see [Tokens](./tokens.md).

| Category | CSS Variable Pattern | WordPress Mapping |
|----------|---------------------|-------------------|
| `color` | `--prefix--color-*` | `settings.color.palette` |
| `gradient` | `--prefix--gradient-*` | `settings.color.gradients` |
| `spacing` | `--prefix--spacing-*` | `settings.spacing.spacingSizes` |
| `fontFamily` | `--prefix--font-family-*` | `settings.typography.fontFamilies` |
| `fontSize` | `--prefix--font-size-*` | `settings.typography.fontSizes` |
| `shadow` | `--prefix--shadow-*` | `settings.shadow.presets` |
| `layout` | `--prefix--layout-*` | `settings.layout` (direct map) |
| `fontWeight` | `--prefix--font-weight-*` | `settings.custom` (CSS only) |
| `lineHeight` | `--prefix--line-height-*` | `settings.custom` (CSS only) |
| `radius` | `--prefix--radius-*` | `settings.custom` (CSS only) |
| `transition` | `--prefix--transition-*` | `settings.custom` (CSS only) |
| `zIndex` | `--prefix--z-*` | Excluded from theme.json |

## CLI Reference

```bash
# Generate from default config (./c2b.config.json)
npx c2b generate

# Generate from a custom config path
npx c2b generate --config path/to/config.json

# Preview output without writing files
npx c2b generate --dry-run
```

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
