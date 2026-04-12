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

`cssOnly: true` means "emit as a CSS variable only, and never expose this token to WordPress." The contract is the same across every category:

- Excluded from every theme.json preset array (`settings.color.palette`, `settings.spacing.spacingSizes`, `settings.typography.fontFamilies`, `settings.typography.fontSizes`, `settings.shadow.presets`)
- Excluded from `settings.custom.*` (including custom-only categories like `fontWeight`, `lineHeight`, `radius`, `transition` and the custom portion of `shadow`)
- Excluded from the `--wp--preset--*` / `--wp--custom--*` fallback mapping in `tokens.wp.css` when `wpThemeable: true`
- Still emitted as a `--{prefix}--{segment}-{key}` variable in `tokens.css`
- Still resolvable from `baseStyles` in the SCSS output (it emits the CSS variable reference); in theme.json `styles` the generator falls back to the underlying raw value

**Explicit flag** — `cssOnly: true` on an object entry. Works in any category, preset-capable or custom-only:

```json
{
  "tokens": {
    "color": {
      "primary": "#0073aa",
      "primary-hover": { "value": "#005a87", "cssOnly": true }
    },
    "fontWeight": {
      "normal": "400",
      "black": { "value": "900", "cssOnly": true }
    },
    "shadow": {
      "card": "0 1px 3px rgba(0,0,0,0.1)",
      "focus-ring": { "value": "0 0 0 3px rgba(0,115,170,0.4)", "cssOnly": true }
    }
  }
}
```

After running the generator:

- `primary-hover`, `black`, and `focus-ring` all exist as CSS variables (`--mylib--color-primary-hover`, `--mylib--font-weight-black`, `--mylib--shadow-focus-ring`).
- None of them appear anywhere in `theme.json` — not in the preset arrays, not in `settings.custom`.
- The Site Editor cannot see or override them.

**String shorthand in custom-only categories** — For `fontWeight`, `lineHeight`, `radius`, `transition`, `zIndex`, a string value registers a normal token that still appears in `settings.custom.*`. Those categories have no WordPress preset mapping, but they do emit `--wp--custom--*` variables by default. Add `cssOnly: true` if you want to keep a specific token out of `settings.custom` as well:

```json
{
  "tokens": {
    "fontWeight": {
      "normal": "400",
      "bold": "700",
      "black": { "value": "900", "cssOnly": true }
    }
  }
}
```

Here `normal` and `bold` land in `settings.custom.fontWeight`, but `black` is emitted only as `--mylib--font-weight-black` in `tokens.css`.

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
| `cssOnly` | No | When `true`, emit as a CSS variable only and exclude from every WordPress output — not a preset, not a `settings.custom.*` entry, not overridable in the Site Editor |
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
  --mylib--font-size-small: clamp(0.875rem, 0.875rem + ((1vw - 0.2rem) * 0.208), 1rem);

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
