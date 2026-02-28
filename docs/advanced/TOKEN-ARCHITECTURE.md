# Token Architecture

This document describes the design token system that powers the component library across multiple platforms: Storybook, React/Next.js, and WordPress block themes.

## Overview

A single configuration file (`c2b.config.json`) serves as the source of truth for all design values. The `component2block` package generates platform-specific outputs from this config, ensuring that every consumer shares the same design values without manual synchronization.

```
c2b.config.json                       (single source of truth)
    │
    │   component2block generate       (build tool)
    │
    ├──► src/styles/tokens.css        (CSS vars for Storybook dev)
    ├──► src/styles/fonts.css         (@font-face declarations)
    ├──► src/styles/_content-generated.scss  (element typography from baseStyles)
    ├──► dist/wp/tokens.wp.css        (if wpThemeable: true)
    ├──► dist/wp/theme.json           (WordPress theme.json base layer)
    └──► dist/wp/integrate.php        (WordPress filter hook)
```

## The Config File

### Structure

Token categories are defined at the top level — no `tokens` wrapper needed:

```json
{
  "prefix": "starter",
  "tokensPath": "src/styles/tokens.css",
  "outDir": "dist/wp",

  "layout": {
    "content-size": "768px",
    "wide-size": "1280px"
  },

  "color": {
    "primary": { "value": "#0073aa", "name": "Primary" },
    "primary-hover": { "value": "#005a87", "cssOnly": true },
    "secondary": { "value": "#23282d" },
    "secondary-hover": "#1a1e21"
  },

  "gradient": {
    "sunset": {
      "value": "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
      "slug": "custom-gradient-1"
    }
  },

  "spacing": {
    "xs": { "value": "0.25rem", "slug": "20", "name": "2X-Small" },
    "sm": { "value": "0.5rem",  "slug": "30", "name": "Small" },
    "md": { "value": "1rem",    "slug": "40", "name": "Medium" }
  },

  "fontFamily": {
    "inter": {
      "value": "Inter, sans-serif",
      "fontFace": [
        { "weight": "400", "style": "normal", "src": "inter-400-normal.woff2" }
      ]
    },
    "system": "-apple-system, BlinkMacSystemFont, sans-serif"
  },

  "fontSize": {
    "small":  { "fluid": { "min": "0.875rem", "max": "1rem" } },
    "medium": { "fluid": { "min": "1rem", "max": "1.125rem" } }
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

  "shadow": {
    "natural": "6px 6px 9px rgba(0, 0, 0, 0.2)",
    "deep": "12px 12px 50px rgba(0, 0, 0, 0.4)"
  },

  "transition": {
    "fast": "150ms ease",
    "normal": "200ms ease"
  },

  "zIndex": {
    "dropdown": "100",
    "modal": "300"
  }
}
```

### Token Syntax

The format you use determines whether a token is registered as a WordPress preset (visible in the Site Editor) or exists as a CSS variable only:

#### Object Syntax — Preset Registration (default)

Object entries auto-derive `slug` and `name` from the key. They register as WordPress presets, appear in the Site Editor, and can be overridden by the active theme:

```json
{
  "color": {
    "primary": { "value": "#0073aa", "name": "Primary Brand Color" },
    "secondary": { "value": "#23282d" }
  },
  "fontSize": {
    "small": { "fluid": { "min": "0.875rem", "max": "1rem" } }
  }
}
```

For `fontSize` tokens with `fluid`, the `value` is auto-derived from `fluid.max` if not provided.

#### CSS-Only Tokens

Tokens that should produce a CSS variable but **not** appear in the Site Editor can be marked in two ways:

**Explicit flag** — use `"cssOnly": true` on an object entry. This is the clearest approach and keeps related tokens grouped together:

```json
{
  "color": {
    "primary": { "value": "#0073aa", "name": "Primary" },
    "primary-hover": { "value": "#005a87", "cssOnly": true },
    "secondary": { "value": "#23282d" },
    "secondary-hover": { "value": "#1a1e21", "cssOnly": true }
  }
}
```

**String shorthand** — a string value is always CSS-only. Use this for categories where no tokens need preset registration:

```json
{
  "fontWeight": {
    "normal": "400",
    "bold": "700"
  }
}
```

#### Recommended Pattern

Use `cssOnly` for colors and other preset categories where some tokens are implementation details. Use string shorthand for categories that are entirely CSS-only (fontWeight, lineHeight, radius, transition, zIndex).

### Auto-derived Fields

For object entries (without `cssOnly`), `slug` and `name` are automatically derived from the token key. CSS-only tokens (string shorthand or `cssOnly: true`) do not receive slug or name.

Override either when needed:

```json
{
  "color": {
    "primary": { "value": "#0073aa", "name": "Primary Brand Color" }
  },
  "spacing": {
    "md": { "value": "1rem", "slug": "40", "name": "Medium" }
  }
}
```

### Token Properties

| Property | Required | Purpose |
|----------|----------|---------|
| `value` | Yes* | The CSS value. *Auto-derived from `fluid.max` for fluid font sizes |
| `name` | No | Human-readable label (auto-derived from key for object entries) |
| `slug` | No | WordPress preset slug (auto-derived from key for object entries) |
| `cssOnly` | No | When `true`, produces a CSS variable but skips WordPress preset registration |
| `fluid` | No | Fluid typography settings (`{ min, max }`) for fontSize |
| `fontFace` | No | Font file definitions for fontFamily |

## Generated Outputs

### tokens.css — Hardcoded Values (Locked)

Generated to `src/styles/tokens.css`. Every token becomes a CSS custom property with static values. Fluid font sizes output `clamp()` for responsive scaling:

```css
:root {
  /* Colors */
  --starter--color-primary: #0073aa;
  --starter--color-primary-hover: #005a87;

  /* Font Sizes */
  --starter--font-size-small: clamp(0.875rem, 0.875rem + ((0.125) * ((100vw - 320px) / 1280)), 1rem);

  /* Layout */
  --starter--layout-content-size: 768px;
}
```

Component SCSS files reference these variables and use shared mixins for common patterns:

```scss
/* Card.scss — always references --starter--* */
@use '../../styles/mixins' as *;

.starter-card {
  background-color: var(--starter--color-background);
  border: 1px solid var(--starter--color-border);
  border-radius: var(--starter--radius-lg);

  @include transition(background-color, border-color);
}
```

### fonts.css

Generated to `src/styles/fonts.css` when fontFamily tokens have `fontFace` definitions:

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/inter/inter-400-normal.woff2') format('woff2');
}
```

Font files referenced in `fontFace` entries are **not** copied by the generator. Place your font files in `public/fonts/{slug}/` so they are served during development and included in your build output. For WordPress themes, copy the font files into `assets/fonts/{slug}/` alongside `theme.json` to match the `file:./assets/fonts/` paths in the generated theme.json.

### tokens.wp.css — WordPress Preset Mapping (Themeable)

**Opt-in:** This file is only generated when `"wpThemeable": true` is set in the config. By default, all tokens use hardcoded values via `tokens.css`.

When enabled, `tokens.wp.css` is generated to `dist/wp/tokens.wp.css`. **Object entries** (without `cssOnly`) map to WordPress preset variables, making them overridable via the Site Editor. **CSS-only tokens** (string shorthand or `cssOnly: true`) get hardcoded values:

```css
:root {
  /* Object entry — mapped to WP preset, overridable via Site Editor */
  --starter--color-primary: var(--wp--preset--color--primary, #0073aa);

  /* cssOnly flag — hardcoded, not overridable */
  --starter--color-primary-hover: #005a87;

  /* String shorthand — also hardcoded */
  --starter--color-secondary-hover: #1a1e21;

  /* Fluid font sizes use clamp() as fallback */
  --starter--font-size-small: var(--wp--preset--font-size--small, clamp(0.875rem, ...));

  /* Custom categories — always hardcoded (no WordPress preset equivalent) */
  --starter--font-weight-bold: 700;
}
```

When a content editor changes "Primary" in the Site Editor, the `--wp--preset--color--primary` variable updates, and that flows into component CSS. CSS-only tokens remain stable.

### Which CSS File to Use

| Scenario | Config | File | Behavior |
|----------|--------|------|----------|
| Storybook / React app | default | `tokens.css` | All values hardcoded |
| WordPress — locked design system | default | `tokens.css` | Components ignore Site Editor changes |
| WordPress — themeable | `wpThemeable: true` | `tokens.wp.css` | Preset tokens follow Site Editor; CSS-only tokens stay locked |

### theme.json

Generated to `dist/wp/theme.json`. Only preset-registered tokens (object entries without `cssOnly`) are included. CSS-only tokens are omitted:

```json
{
  "$schema": "https://schemas.wp.org/trunk/theme.json",
  "version": 3,
  "settings": {
    "color": {
      "palette": [
        { "slug": "primary", "color": "#0073aa", "name": "Primary" },
        { "slug": "secondary", "color": "#23282d", "name": "Secondary" }
      ],
      "gradients": [
        { "slug": "custom-gradient-1", "gradient": "...", "name": "Sunset" }
      ]
    },
    "spacing": {
      "spacingSizes": [
        { "slug": "20", "size": "0.25rem", "name": "2X-Small" }
      ]
    },
    "typography": {
      "fluid": true,
      "fontFamilies": [
        {
          "slug": "inter",
          "fontFamily": "Inter, sans-serif",
          "name": "Inter",
          "fontFace": [
            {
              "fontFamily": "Inter",
              "fontStyle": "normal",
              "fontWeight": "400",
              "src": ["file:./assets/fonts/inter/inter-400-normal.woff2"]
            }
          ]
        }
      ],
      "fontSizes": [
        {
          "slug": "small",
          "size": "1rem",
          "name": "Small",
          "fluid": { "min": "0.875rem", "max": "1rem" }
        }
      ]
    },
    "shadow": {
      "presets": [
        { "slug": "natural", "shadow": "6px 6px 9px rgba(0, 0, 0, 0.2)", "name": "Natural" }
      ]
    },
    "layout": {
      "contentSize": "768px",
      "wideSize": "1280px"
    },
    "custom": {
      "fontWeight": { "normal": "400", "bold": "700" },
      "lineHeight": { "tight": "1.25", "normal": "1.5" },
      "radius": { "sm": "2px", "md": "4px", "lg": "8px" },
      "transition": { "fast": "150ms ease", "normal": "200ms ease" }
    }
  }
}
```

**Notes:**
- CSS-only tokens (string shorthand or `cssOnly: true`) are omitted from theme.json presets
- When `fontSize` tokens exist, `typography.fluid: true` is automatically set
- Token categories without native theme.json support go under `settings.custom`
- WordPress generates CSS variables for custom values as `--wp--custom--*`
- `zIndex` is omitted from theme.json entirely
- When `baseStyles` is configured, a `styles` block is added with `styles.typography` (body defaults) and `styles.elements` (heading/caption typography). See [Base Styles](../getting-started/BASE-STYLES.md) for the full structure

### integrate.php

Generated to `dist/wp/integrate.php`. This is the WordPress hook that injects the generated theme.json as a default base layer:

```php
add_filter( 'wp_theme_json_data_default', function ( $theme_json ) {
    $library_json_path = __DIR__ . '/theme.json';
    // ... reads and merges the library's theme.json
    return $theme_json->update_with( $library_data );
} );
```

## How Each Consumer Uses This

### Storybook (Development)

The `component2block` preset auto-injects all generated and authored style files. Add it to your `.storybook/main.ts`:

```ts
// .storybook/main.ts
addons: [
  '@storybook/addon-docs',
  '../component2block/dist/preset.js',
],
```

The preset reads `c2b.config.json` and injects `tokens.css`, `fonts.css`, `reset.scss`, and `content.scss` into the Storybook preview — no manual imports needed in `preview.ts`.

### React / Next.js

Import the bundled or individual CSS. The tokens provide hardcoded values. No WordPress dependency:

```tsx
// Option A: Bundled (all components + tokens)
import 'your-component-library/styles.css';

// Option B: Individual
import 'your-component-library/css/tokens.css';
import 'your-component-library/css/fonts.css';
import 'your-component-library/css/Card.css';

import { Card } from 'your-component-library';
```

### WordPress Block Theme

See [Theme Integration](./THEME-INTEGRATION.md) and [Plugin Integration](./PLUGIN-INTEGRATION.md) for detailed setup guides.

## WordPress theme.json Cascade

WordPress merges theme.json layers in this order (lowest to highest priority):

1. **WordPress core defaults**
2. **Library base layer** — `integrate.php` injects here via `wp_theme_json_data_default`
3. **Parent theme** `theme.json`
4. **Child theme** `theme.json`
5. **User Global Styles** (editor customizations)

The library sits at layer 2. Everything above it wins. A theme's `theme.json` automatically overrides library defaults.

### How overrides work

Given these layers:

**Library base (layer 2):**
```json
{ "slug": "primary", "color": "#0073aa", "name": "Primary" }
```

**Theme override (layer 3):**
```json
{ "slug": "primary", "color": "#e63946", "name": "Primary" }
```

**Result:** Primary is `#e63946` in both the editor color picker and the `--wp--preset--color--primary` CSS variable. Because `tokens.wp.css` maps `--starter--color-primary` to `var(--wp--preset--color--primary, #0073aa)`, components automatically pick up the theme's value.

## Build Output

```
dist/
├── index.js             # ES module (React components)
├── index.d.ts           # TypeScript declarations
├── components/
│   ├── Button/
│   │   ├── Button.js    # Component module
│   │   ├── Button.d.ts  # TypeScript declarations
│   │   └── Button.css   # Compiled component CSS
│   └── Card/
│       ├── Card.js
│       ├── Card.d.ts
│       └── Card.css
├── styles.css           # Bundled CSS (tokens + all components)
├── css/
│   ├── tokens.css       # CSS vars — hardcoded values (React/Next.js)
│   ├── fonts.css        # @font-face declarations
│   ├── content.css      # Compiled base typography + authored rules
│   └── reset.css        # Compiled base styles
└── wp/
    ├── theme.json       # WordPress theme.json base layer
    ├── integrate.php    # WordPress filter hook
    └── tokens.wp.css    # CSS vars — mapped to --wp--preset--* (WordPress)
```

## Package Exports

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
  }
}
```

## Build Order

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

The `generate` step runs first, ensuring `tokens.css` exists before Storybook or Vite needs it. The `build:wp` step re-runs after `build:css` because Vite's `emptyDirBeforeWrite` clears the `dist/` directory.

## Adding New Tokens

1. Add the token to `c2b.config.json`
2. Optionally override the auto-derived `name` or `slug`
3. Run `npm run generate` (or it runs automatically on `dev`/`build`)
4. Reference the new `--starter--*` variable in component CSS

## Changing the Prefix

Update the `prefix` value in `c2b.config.json`:

```json
{
  "prefix": "mylib"
}
```

Run `npm run generate`. The output changes to `--mylib--*` variables.

Component CSS files and TSX class names still need a manual find-and-replace for the class prefix (e.g., `.starter-card` to `.mylib-card`). The token generation handles CSS variable prefixes only.

## Token Categories and WordPress Mapping

| Category | CSS Variable | theme.json Location | Editor UI |
|----------|-------------|-------------------|-----------|
| `color` | `--prefix--color-*` | `settings.color.palette` | Color picker |
| `gradient` | `--prefix--gradient-*` | `settings.color.gradients` | Gradient picker |
| `spacing` | `--prefix--spacing-*` | `settings.spacing.spacingSizes` | Spacing controls |
| `fontFamily` | `--prefix--font-family-*` | `settings.typography.fontFamilies` | Font picker |
| `fontSize` | `--prefix--font-size-*` | `settings.typography.fontSizes` | Size picker |
| `shadow` | `--prefix--shadow-*` | `settings.shadow.presets` | Shadow picker |
| `layout` | `--prefix--layout-*` | `settings.layout` | Layout controls |
| `fontWeight` | `--prefix--font-weight-*` | `settings.custom.fontWeight` | CSS only |
| `lineHeight` | `--prefix--line-height-*` | `settings.custom.lineHeight` | CSS only |
| `radius` | `--prefix--radius-*` | `settings.custom.radius` | CSS only |
| `transition` | `--prefix--transition-*` | `settings.custom.transition` | CSS only |
| `zIndex` | `--prefix--z-*` | Not included | CSS only |

Items under `settings.custom` generate `--wp--custom--*` CSS variables in WordPress but don't appear in editor UI controls. Z-Index values are omitted from theme.json entirely as they have no WordPress equivalent.
