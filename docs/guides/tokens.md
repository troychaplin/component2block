# Tokens

Every token produces a CSS custom property. The format you choose determines whether it also registers as a WordPress preset (visible in the Site Editor).

## Token Syntax

### Object Syntax — Preset Registration (default)

Object entries register as WordPress presets. The `slug` and `name` are auto-derived from the key:

```json
{
  "color": {
    "primary": { "value": "#0073aa", "name": "Primary Brand Color" },
    "secondary": { "value": "#23282d" }
  }
}
```

### CSS-Only Tokens

Tokens that should produce a CSS variable but **not** appear in the Site Editor:

**Explicit flag** — `cssOnly: true` on an object entry. Best for preset categories where some tokens are implementation details:

```json
{
  "color": {
    "primary": { "value": "#0073aa", "name": "Primary" },
    "primary-hover": { "value": "#005a87", "cssOnly": true }
  }
}
```

**String shorthand** — a string value is always CSS-only. Best for categories that are entirely CSS-only:

```json
{
  "fontWeight": {
    "normal": "400",
    "bold": "700"
  }
}
```

### Fluid Font Sizes

Fluid font sizes generate responsive `clamp()` values. The `value` is auto-derived from `fluid.max` if not provided:

```json
{
  "fontSize": {
    "small": { "fluid": { "min": "0.875rem", "max": "1rem" } }
  }
}
```

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
  "spacing": {
    "md": { "value": "1rem", "slug": "40", "name": "Medium" }
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

Only generated when `wpThemeable: true`. Object entries map to WordPress preset variables with the original value as a fallback. CSS-only tokens stay hardcoded:

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

Use `cssOnly` for colors and other preset categories where some tokens are implementation details (hover states, borders). Use string shorthand for categories that are entirely CSS-only (`fontWeight`, `lineHeight`, `radius`, `transition`, `zIndex`):

```json
{
  "color": {
    "primary": { "value": "#0073aa", "name": "Primary" },
    "primary-hover": { "value": "#005a87", "cssOnly": true },
    "secondary": { "value": "#23282d" },
    "secondary-hover": { "value": "#1a1e21", "cssOnly": true }
  },
  "fontWeight": {
    "normal": "400",
    "bold": "700"
  }
}
```

Here, `primary` and `secondary` appear in the Site Editor palette. `primary-hover` and `secondary-hover` are CSS variables only — they won't clutter the editor UI.
