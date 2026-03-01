# Tokens

Every token produces a CSS custom property. The format you choose determines whether it also registers as a WordPress preset (visible in the Site Editor).

## Token Syntax

### String Shorthand — Preset Registration (default for preset categories)

For preset categories (`color`, `gradient`, `shadow`, `fontFamily`, `fontSize`), a string value registers as a WordPress preset. The `slug` and `name` are auto-derived from the key:

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

### Object Syntax — Preset with Overrides

Use object syntax when you need to override `slug`, `name`, or add other properties:

```json
{
  "tokens": {
    "color": {
      "primary": { "value": "#0073aa", "name": "Primary Brand Color" },
      "secondary": { "value": "#23282d" }
    }
  }
}
```

### CSS-Only Tokens

Tokens that should produce a CSS variable but **not** appear in the Site Editor:

**Explicit flag** — `cssOnly: true` on an object entry. Required for preset categories where some tokens are implementation details:

```json
{
  "tokens": {
    "color": {
      "primary": "#0073aa",
      "primary-hover": { "value": "#005a87", "cssOnly": true }
    }
  }
}
```

**String shorthand in custom categories** — For non-preset categories (`fontWeight`, `lineHeight`, `radius`, `transition`, `zIndex`), string values are always CSS-only (these categories never produce WordPress presets):

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

### Fluid Font Sizes

Fluid font sizes generate responsive `clamp()` values. Use the shorthand `{ "min": "...", "max": "..." }` directly:

```json
{
  "tokens": {
    "fontSize": {
      "small": { "min": "0.875rem", "max": "1rem" }
    }
  }
}
```

The nested `{ "fluid": { "min", "max" } }` syntax is also supported for backward compatibility.

## Token Properties

| Property | Required | Description |
|----------|----------|-------------|
| `value` | Yes* | The CSS value. *Auto-derived from `fluid.max` for fluid font sizes |
| `name` | No | Human-readable label (auto-derived from key) |
| `slug` | No | WordPress preset slug (auto-derived from key) |
| `cssOnly` | No | When `true`, CSS variable only — no WordPress preset |
| `fluid` | No | `{ min, max }` for fluid fontSize tokens |
| `fontFace` | No | Font file definitions for fontFamily tokens |

## Auto-derived Fields

For object entries (without `cssOnly`), `slug` and `name` are derived from the token key:

- **slug**: Uses the key directly (`"primary"` → slug `"primary"`)
- **name**: Title-cases the key (`"x-large"` → name `"X Large"`)

Override when needed:

```json
{
  "tokens": {
    "spacing": {
      "md": { "value": "1rem", "slug": "40", "name": "Medium" }
    }
  }
}
```

## Token Categories

### Preset Categories

These appear in the WordPress Site Editor controls:

| Category | CSS Variable | WordPress Mapping | Editor UI |
|----------|-------------|-------------------|-----------|
| `color` | `--prefix--color-*` | `settings.color.palette` | Color picker |
| `gradient` | `--prefix--gradient-*` | `settings.color.gradients` | Gradient picker |
| `spacing` | `--prefix--spacing-*` | `settings.spacing.spacingSizes` | Spacing controls |
| `fontFamily` | `--prefix--font-family-*` | `settings.typography.fontFamilies` | Font picker |
| `fontSize` | `--prefix--font-size-*` | `settings.typography.fontSizes` | Size picker |
| `shadow` | `--prefix--shadow-*` | `settings.shadow.presets` | Shadow picker |
| `layout` | `--prefix--layout-*` | `settings.layout` | Layout controls |

### Custom Categories

These produce CSS variables and go under `settings.custom` in theme.json (no editor UI):

| Category | CSS Variable | theme.json |
|----------|-------------|------------|
| `fontWeight` | `--prefix--font-weight-*` | `settings.custom.fontWeight` |
| `lineHeight` | `--prefix--line-height-*` | `settings.custom.lineHeight` |
| `radius` | `--prefix--radius-*` | `settings.custom.radius` |
| `transition` | `--prefix--transition-*` | `settings.custom.transition` |
| `zIndex` | `--prefix--z-*` | Excluded from theme.json |

## CSS Output

### tokens.css — Hardcoded Values

Every token becomes a CSS custom property with static values:

```css
:root {
  /* Colors */
  --mylib--color-primary: #0073aa;
  --mylib--color-primary-hover: #005a87;

  /* Font Sizes (fluid) */
  --mylib--font-size-small: clamp(0.875rem, 0.875rem + ((0.125) * ((100vw - 320px) / 1280)), 1rem);

  /* Font Weights */
  --mylib--font-weight-normal: 400;
  --mylib--font-weight-bold: 700;

  /* Layout */
  --mylib--layout-content-size: 768px;
}
```

### tokens.wp.css — WordPress Preset Mapping

Only generated when `output.wpThemeable: true`. Preset entries map to WordPress preset variables with the original value as a fallback. CSS-only tokens stay hardcoded:

```css
:root {
  /* Object entry — maps to WP preset, overridable via Site Editor */
  --mylib--color-primary: var(--wp--preset--color--primary, #0073aa);

  /* cssOnly flag — hardcoded, not overridable */
  --mylib--color-primary-hover: #005a87;

  /* String shorthand — also hardcoded */
  --mylib--font-weight-bold: 700;

  /* Fluid font sizes use clamp() as fallback */
  --mylib--font-size-small: var(--wp--preset--font-size--small, clamp(0.875rem, ...));
}
```

### Which File to Use

| Scenario | File | Behavior |
|----------|------|----------|
| Storybook / React app | `tokens.css` | All values hardcoded |
| WordPress — locked design system | `tokens.css` | Components ignore Site Editor changes |
| WordPress — themeable | `tokens.wp.css` | Preset tokens follow Site Editor; CSS-only tokens stay locked |

## Using Tokens in Components

Reference the generated CSS variables in component SCSS:

```scss
.mylib-card {
  background-color: var(--mylib--color-background);
  border: 1px solid var(--mylib--color-border);
  border-radius: var(--mylib--radius-lg);
  padding: var(--mylib--spacing-md);
  font-size: var(--mylib--font-size-medium);
}
```

The variable pattern is always `--{prefix}--{css-segment}-{key}`.

## Updating Tokens

1. Edit `c2b.config.json`
2. Run `npx c2b generate`
3. All outputs update — `tokens.css`, `tokens.wp.css`, `theme.json`

To add a new token, add it to the appropriate category and run the generator. Then reference `--prefix--{category}-{key}` in your component CSS.

## Recommended Patterns

Use string shorthand for preset categories — it registers as a preset automatically. Use `cssOnly` for tokens that should be CSS variables only (hover states, borders). Use string shorthand for custom categories (`fontWeight`, `lineHeight`, `radius`, `transition`, `zIndex`) — they are always CSS-only:

```json
{
  "tokens": {
    "color": {
      "primary": "#0073aa",
      "primary-hover": { "value": "#005a87", "cssOnly": true },
      "secondary": "#23282d",
      "secondary-hover": { "value": "#1a1e21", "cssOnly": true }
    },
    "fontWeight": {
      "normal": "400",
      "bold": "700"
    }
  }
}
```

Here, `primary` and `secondary` appear in the Site Editor palette (string shorthand = preset for preset categories). `primary-hover` and `secondary-hover` are CSS variables only — they won't clutter the editor UI.
