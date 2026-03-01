# Configuration Reference

The `c2b.config.json` file is the single source of truth for all generated outputs. The config has three top-level sections: `prefix`, `output` (output paths and options), and `tokens` (all token categories). `baseStyles` sits alongside these at the top level.

## Global Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `prefix` | Yes | — | CSS variable prefix (e.g. `mylib` produces `--mylib--*`) |

### `output`

Output-related fields are grouped under the `output` key:

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `output.tokensPath` | No | `src/styles/tokens.css` | Output path for the generated tokens CSS file |
| `output.wpDir` | No | `dist/wp` | Output directory for WordPress files |
| `output.wpThemeable` | No | `false` | When `true`, generates `tokens.wp.css` with `--wp--preset--*` mappings |

## Token Categories

All token categories are nested under the `tokens` key in the config. Categories with dedicated docs pages are linked below.

| Category | CSS Variable Pattern | WordPress Mapping | Docs |
|----------|---------------------|-------------------|------|
| `color` | `--prefix--color-*` | `settings.color.palette` | [Colors & Gradients](./colors.md) |
| `gradient` | `--prefix--gradient-*` | `settings.color.gradients` | [Colors & Gradients](./colors.md) |
| `spacing` | `--prefix--spacing-*` | `settings.spacing.spacingSizes` | [Spacing](./spacing.md) |
| `fontFamily` | `--prefix--font-family-*` | `settings.typography.fontFamilies` | [Fonts](./fonts.md) |
| `fontSize` | `--prefix--font-size-*` | `settings.typography.fontSizes` | [Fonts](./fonts.md) |
| `shadow` | `--prefix--shadow-*` | `settings.shadow.presets` | [Shadows](./shadow.md) |
| `layout` | `--prefix--layout-*` | `settings.layout` (direct map) | — |
| `fontWeight` | `--prefix--font-weight-*` | `settings.custom` (CSS only) | — |
| `lineHeight` | `--prefix--line-height-*` | `settings.custom` (CSS only) | — |
| `radius` | `--prefix--radius-*` | `settings.custom` (CSS only) | — |
| `transition` | `--prefix--transition-*` | `settings.custom` (CSS only) | — |
| `zIndex` | `--prefix--z-*` | Excluded from theme.json | — |

### baseStyles

The `baseStyles` section defines root-level typography, colors, spacing, and element defaults. See [Base Styles](./base-styles.md) for the full reference.

---

## Token Entry Properties

Every token entry supports these common properties. Categories may have additional properties documented on their own pages.

| Property | Required | Description |
|----------|----------|-------------|
| `value` | Yes* | The CSS value. *Auto-derived from `fluid.max` for fluid font sizes |
| `name` | No | Human-readable label for the WordPress Site Editor (auto-derived from key) |
| `slug` | No | WordPress preset slug (auto-derived from key) |
| `cssOnly` | No | When `true`, produces a CSS variable only — no WordPress preset |
| `fluid` | No | `{ min, max }` for responsive sizing (fontSize only) |
| `fontFace` | No | Array of `{ weight, style, src }` entries (fontFamily only) |

### String Shorthand

Token entries can be strings instead of objects. The behavior depends on the category:

**Preset categories** (color, gradient, shadow, fontFamily, fontSize): A string value registers as a WordPress preset with auto-derived `slug` and `name`. For example:

```json
{
  "tokens": {
    "color": {
      "primary": "#0073aa",
      "secondary": "#23282d"
    }
  }
}
```

is equivalent to:

```json
{
  "tokens": {
    "color": {
      "primary": { "value": "#0073aa", "slug": "primary", "name": "Primary" },
      "secondary": { "value": "#23282d", "slug": "secondary", "name": "Secondary" }
    }
  }
}
```

To make a preset-category entry CSS-only when using the object form, add `"cssOnly": true`:

```json
{
  "tokens": {
    "color": {
      "primary-hover": { "value": "#005a87", "cssOnly": true }
    }
  }
}
```

**Custom-only categories** (fontWeight, radius, lineHeight, transition): String shorthand stays CSS-only since these categories don't have native WordPress preset mappings:

```json
{
  "tokens": {
    "fontWeight": {
      "normal": "400",
      "bold": "700"
    }
  }
}
```

is equivalent to:

```json
{
  "tokens": {
    "fontWeight": {
      "normal": { "value": "400" },
      "bold": { "value": "700" }
    }
  }
}
```

### Auto-Derived Fields

When `name` and `slug` are omitted, they're derived from the token key:

| Key | Derived `name` | Derived `slug` |
|-----|---------------|----------------|
| `primary` | `Primary` | `primary` |
| `primary-hover` | `Primary Hover` | `primary-hover` |
| `x-large` | `X Large` | `x-large` |
| `2x-small` | `2x Small` | `2x-small` |

---

## Generated Files

| File | Location | When Generated | Purpose |
|------|----------|----------------|---------|
| `tokens.css` | `{output.tokensPath}` | Always | CSS custom properties with hardcoded values |
| `fonts.css` | `{output.tokensPath dir}/fonts.css` | When `fontFace` defined | `@font-face` declarations |
| `_content-generated.scss` | `{output.tokensPath dir}/_content-generated.scss` | When `baseStyles` defined | Base typography with `:where()` selectors |
| `tokens.css` | `{output.wpDir}/tokens.css` | Always | CSS variables for WordPress (hardcoded) |
| `tokens.wp.css` | `{output.wpDir}/tokens.wp.css` | When `wpThemeable: true` | CSS variables mapped to `--wp--preset--*` |
| `theme.json` | `{output.wpDir}/theme.json` | Always | WordPress settings and styles |
| `integrate.php` | `{output.wpDir}/integrate.php` | Always | PHP hooks for the theme.json cascade |

---

## CSS-Only Categories

Some categories don't have native WordPress preset mappings. Their tokens go into `settings.custom` in theme.json, producing `--wp--custom--*` variables:

| Category | theme.json path | WordPress variable |
|----------|----------------|-------------------|
| `fontWeight` | `settings.custom.fontWeight` | `--wp--custom--font-weight--{key}` |
| `lineHeight` | `settings.custom.lineHeight` | `--wp--custom--line-height--{key}` |
| `radius` | `settings.custom.radius` | `--wp--custom--radius--{key}` |
| `transition` | `settings.custom.transition` | `--wp--custom--transition--{key}` |

`zIndex` is excluded from theme.json entirely — it only produces CSS variables.

### layout

The `layout` category maps directly to `settings.layout` in theme.json (not a preset array). It controls WordPress's constrained layout widths. Keys use camelCase to match the theme.json output:

```json
{
  "tokens": {
    "layout": {
      "contentSize": "768px",
      "wideSize": "1280px"
    }
  }
}
```

This produces:

```json
{
  "settings": {
    "layout": {
      "contentSize": "768px",
      "wideSize": "1280px"
    }
  }
}
```

And CSS variables `--prefix--layout-content-size` / `--prefix--layout-wide-size` used by the layout constraint rules in SCSS. See [Base Styles](./base-styles.md) for the generated `.is-layout-constrained` rules.

---

## Locked vs Themeable Mode

The `output.wpThemeable` field controls two behaviors:

### Locked Mode (`output.wpThemeable: false` — default)

- `tokens.css` uses hardcoded values
- `tokens.wp.css` is **not** generated
- theme.json disables custom color/gradient creation in the Site Editor
- Design system stays locked — admins can only pick from defined presets

### Themeable Mode (`output.wpThemeable: true`)

- `tokens.css` still uses hardcoded values (for Storybook)
- `tokens.wp.css` is generated with `var(--wp--preset--*, fallback)` mappings
- theme.json allows custom color/gradient creation
- Site Editor changes flow into your component library via the preset variable mappings

See [Colors & Gradients](./colors.md#locked-vs-themeable-mode) for details on how this affects color/gradient presets.

---

## Full Example

```json
{
  "prefix": "mylib",

  "output": {
    "tokensPath": "src/styles/tokens.css",
    "wpDir": "dist/wp",
    "wpThemeable": false
  },

  "tokens": {
    "layout": {
      "contentSize": "768px",
      "wideSize": "1280px"
    },

    "color": {
      "primary": "#0073aa",
      "primary-hover": { "value": "#005a87", "cssOnly": true },
      "secondary": "#23282d",
      "secondary-hover": { "value": "#1a1e21", "cssOnly": true },
      "success": "#00a32a",
      "error": "#d63638"
    },

    "gradient": {
      "sunset": "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)"
    },

    "spacing": {
      "xs": { "value": "0.25rem", "slug": "20" },
      "sm": { "value": "0.5rem", "slug": "30" },
      "md": { "value": "1rem", "slug": "40" },
      "lg": { "value": "1.5rem", "slug": "50" },
      "xl": { "value": "2.25rem", "slug": "60" }
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
      "small": { "min": "0.875rem", "max": "1rem" },
      "medium": { "min": "1rem", "max": "1.125rem" },
      "large": { "min": "1.125rem", "max": "1.25rem" },
      "x-large": { "min": "1.25rem", "max": "1.5rem" }
    },

    "shadow": {
      "natural": "6px 6px 9px rgba(0, 0, 0, 0.2)",
      "deep": "12px 12px 50px rgba(0, 0, 0, 0.4)"
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
    }
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
