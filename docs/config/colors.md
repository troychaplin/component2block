# Colors & Gradients

This guide covers how to configure colors and gradients in `c2b.config.json`, including preset registration, CSS-only tokens, and WordPress Site Editor behavior.

## Colors

Colors are defined in the `color` category under `tokens`. Each entry produces a CSS custom property and — unless marked CSS-only — registers as a WordPress color preset.

String shorthand registers as a preset with auto-derived `slug` and `name`:

```json
{
  "tokens": {
    "color": {
      "primary": "#0073aa",
      "secondary": "#23282d",
      "success": "#00a32a",
      "error": "#d63638"
    }
  }
}
```

Use the object form when you need to override the auto-derived `name`:

```json
{
  "tokens": {
    "color": {
      "primary": { "value": "#0073aa", "name": "Primary Brand Color" }
    }
  }
}
```

Both string and object entries (without `cssOnly`) appear in the WordPress Site Editor color picker. The `slug` and `name` are auto-derived from the key when not provided:

- `"primary"` → slug `primary`, name `Primary`
- `"primary-hover"` → slug `primary-hover`, name `Primary Hover`

### CSS-Only Colors

Use the `cssOnly` flag for implementation-detail colors that shouldn't appear in the Site Editor (hover states, borders, etc.):

```json
{
  "tokens": {
    "color": {
      "primary": "#0073aa",
      "primary-hover": { "value": "#005a87", "cssOnly": true },
      "secondary": "#23282d",
      "secondary-hover": { "value": "#1a1e21", "cssOnly": true }
    }
  }
}
```

`primary` and `secondary` appear in the Site Editor palette. `primary-hover` and `secondary-hover` produce CSS variables only — they won't clutter the editor UI.

### Color Properties

| Property | Required | Description |
|----------|----------|-------------|
| `value` | Yes | Any valid CSS color — hex, rgb, rgba, hsl, etc. |
| `name` | No | Human-readable label for the Site Editor (auto-derived from key) |
| `slug` | No | WordPress preset slug (auto-derived from key) |
| `cssOnly` | No | When `true`, CSS variable only — no WordPress preset |

### Color Values

The `value` field accepts any valid CSS color syntax:

```json
{
  "tokens": {
    "color": {
      "brand":       "#0073aa",
      "overlay":     { "value": "rgba(0, 0, 0, 0.5)", "cssOnly": true },
      "accent":      "hsl(210, 100%, 50%)",
      "transparent": { "value": "transparent", "cssOnly": true }
    }
  }
}
```

The value is passed through as-is to both CSS and theme.json — no transformation or validation is applied.

---

## Gradients

Gradients are defined in the `gradient` category under `tokens`. Each entry produces a CSS custom property and registers as a WordPress gradient preset.

String shorthand registers as a preset with auto-derived `slug` and `name`:

```json
{
  "tokens": {
    "gradient": {
      "sunset": "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
      "ocean": "linear-gradient(180deg, #667eea 0%, #764ba2 100%)"
    }
  }
}
```

### Gradient Properties

| Property | Required | Description |
|----------|----------|-------------|
| `value` | Yes | Any valid CSS gradient — `linear-gradient()`, `radial-gradient()`, etc. |
| `name` | No | Human-readable label for the Site Editor (auto-derived from key) |
| `slug` | No | WordPress preset slug (auto-derived from key) |
| `cssOnly` | No | When `true`, CSS variable only — no WordPress preset |

### CSS-Only Gradients

Same pattern as colors — use `cssOnly` for gradients that shouldn't appear in the Site Editor picker:

```json
{
  "tokens": {
    "gradient": {
      "hero": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "overlay": {
        "value": "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)",
        "cssOnly": true
      }
    }
  }
}
```

---

## Generated Output

### tokens.css

Every color and gradient becomes a CSS custom property with a static value:

```css
:root {
  /* Colors */
  --mylib--color-primary: #0073aa;
  --mylib--color-primary-hover: #005a87;
  --mylib--color-secondary: #23282d;

  /* Gradients */
  --mylib--gradient-sunset: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
}
```

### tokens.wp.css

Only generated when `output.wpThemeable: true`. Preset entries map to WordPress preset variables with the original value as a fallback. CSS-only tokens stay hardcoded:

```css
:root {
  /* Colors */
  --mylib--color-primary: var(--wp--preset--color--primary, #0073aa);
  --mylib--color-primary-hover: #005a87;
  --mylib--color-secondary: var(--wp--preset--color--secondary, #23282d);

  /* Gradients */
  --mylib--gradient-sunset: var(--wp--preset--gradient--sunset, linear-gradient(135deg, #ff6b6b 0%, #feca57 100%));
}
```

The `var(--wp--preset--*, fallback)` pattern means that when a WordPress admin changes a color in the Site Editor, your component library picks up the new value automatically. CSS-only tokens are immune to Site Editor changes.

### theme.json

Colors register under `settings.color.palette` and gradients under `settings.color.gradients`. Only object entries (not `cssOnly`) appear:

```json
{
  "settings": {
    "color": {
      "palette": [
        { "slug": "primary", "name": "Primary Brand Color", "color": "#0073aa" },
        { "slug": "secondary", "name": "Secondary", "color": "#23282d" }
      ],
      "gradients": [
        {
          "slug": "sunset",
          "name": "Sunset",
          "gradient": "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)"
        }
      ]
    }
  }
}
```

CSS-only tokens like `primary-hover` are excluded from theme.json entirely.

---

## Locked vs Themeable Mode

The `output.wpThemeable` config field controls whether WordPress admins can create custom colors and gradients beyond your defined presets.

### Locked Mode (`wpThemeable: false` — default)

The generated theme.json disables custom color/gradient creation:

```json
{
  "settings": {
    "color": {
      "custom": false,
      "customDuotone": false,
      "customGradient": false,
      "palette": [...]
    }
  }
}
```

Admins can only pick from the colors and gradients you've defined. They cannot enter arbitrary hex values or create custom gradients in the Site Editor. This keeps the design system locked.

### Themeable Mode (`wpThemeable: true`)

The `custom` flags are omitted, allowing admins to create their own colors and gradients alongside your presets. Additionally, `tokens.wp.css` is generated so that preset tokens map to `--wp--preset--*` variables — meaning Site Editor changes flow into your component library.

| Behavior | Locked | Themeable |
|----------|--------|-----------|
| Presets in Site Editor | Yes | Yes |
| Custom colors/gradients | No | Yes |
| CSS maps to `--wp--preset--*` | No | Yes |
| Site Editor changes affect components | No | Yes |

---

## Using Colors in Base Styles

Reference color tokens by key in the `baseStyles` section:

```json
{
  "baseStyles": {
    "body": {
      "color": "text-black",
      "background": "off-white"
    },
    "heading": {
      "color": "primary"
    },
    "button": {
      "color": "off-white",
      "background": "primary"
    },
    "link": {
      "color": "primary",
      "hoverColor": "primary-hover"
    }
  }
}
```

Token keys resolve to the corresponding CSS variable:

| Config value | SCSS output | theme.json output |
|--------------|-------------|-------------------|
| `"primary"` | `var(--prefix--color-primary)` | `var(--wp--preset--color--primary)` |
| `"off-white"` | `var(--prefix--color-off-white)` | `var(--wp--preset--color--off-white)` |

The `hoverColor` property is specific to the `link` element — it generates a `:hover` pseudo-class rule.

See [Base Styles](./base-styles.md) for the full list of supported elements and properties.

## Using Colors in Components

Reference the generated CSS variables directly:

```scss
.mylib-card {
  background-color: var(--mylib--color-off-white);
  border: 1px solid var(--mylib--color-primary);
}

.mylib-alert--error {
  background-color: var(--mylib--color-error);
}

.mylib-hero {
  background: var(--mylib--gradient-sunset);
}
```

The variable patterns are:

- Colors: `--{prefix}--color-{key}`
- Gradients: `--{prefix}--gradient-{key}`

## Recommended Patterns

**Keep the palette focused.** Only register colors that admins should see in the Site Editor. Use `cssOnly` for everything else:

```json
{
  "tokens": {
    "color": {
      "primary": "#0073aa",
      "primary-hover": { "value": "#005a87", "cssOnly": true },
      "primary-light": { "value": "#e5f5fa", "cssOnly": true },
      "secondary": "#23282d",
      "secondary-hover": { "value": "#1a1e21", "cssOnly": true }
    }
  }
}
```

This gives the Site Editor a clean two-color palette while still providing hover and variant tokens for component styles.

**Separate structural gradients.** A hero gradient that admins might change should be a preset. An overlay gradient that's part of the component's structure should be `cssOnly`:

```json
{
  "tokens": {
    "gradient": {
      "hero": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "card-overlay": {
        "value": "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)",
        "cssOnly": true
      }
    }
  }
}
```
