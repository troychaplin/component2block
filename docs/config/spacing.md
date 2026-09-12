# Spacing

This guide covers how to configure spacing tokens in `c2b.config.json`, including WordPress slug conventions, responsive values, and how spacing integrates with `baseStyles` for root padding and block gap.

## Spacing Configuration

Spacing tokens are defined in the `spacing` category under `tokens`. Each entry produces a CSS custom property and — unless marked CSS-only — registers as a WordPress spacing preset. The `name` field is auto-derived from the key, so you only need `value` and `slug`:

```json
{
  "tokens": {
    "spacing": {
      "2x-small": { "value": "0.25rem", "slug": "20" },
      "x-small":  { "value": "0.5rem",  "slug": "30" },
      "small":    { "value": "min(0.75rem, 1vw)",  "slug": "40" },
      "medium":   { "value": "min(1.5rem, 2vw)",   "slug": "50" },
      "large":    { "value": "min(2.25rem, 3vw)",   "slug": "60" },
      "x-large":  { "value": "min(3rem, 4vw)",      "slug": "70" },
      "2x-large": { "value": "min(4.5rem, 6vw)",    "slug": "80" }
    }
  }
}
```

### WordPress Slug Convention

WordPress core spacing presets use numeric slugs (`20`, `30`, `40`, etc.) rather than semantic names. This convention maps to the `--wp--preset--spacing--{slug}` variable pattern. Setting slugs explicitly ensures your presets align with the WordPress spacing scale:

| Token Key | Slug | WordPress Variable |
|-----------|------|-------------------|
| `2x-small` | `20` | `--wp--preset--spacing--20` |
| `x-small` | `30` | `--wp--preset--spacing--30` |
| `small` | `40` | `--wp--preset--spacing--40` |
| `medium` | `50` | `--wp--preset--spacing--50` |
| `large` | `60` | `--wp--preset--spacing--60` |
| `x-large` | `70` | `--wp--preset--spacing--70` |
| `2x-large` | `80` | `--wp--preset--spacing--80` |

If you omit `slug`, it defaults to the token key (e.g., `small`). Setting numeric slugs is recommended for consistency with WordPress core.

### Responsive Spacing

The `value` field accepts any valid CSS value. Use viewport-relative values for spacing that scales with the screen:

```json
{
  "tokens": {
    "spacing": {
      "small":  { "value": "min(0.75rem, 1vw)",  "slug": "40" },
      "medium": { "value": "min(1.5rem, 2vw)",   "slug": "50" },
      "large":  { "value": "min(2.25rem, 3vw)",   "slug": "60" }
    }
  }
}
```

The `min()` function ensures the spacing never exceeds a fixed rem value while scaling down on smaller viewports. You can also use `clamp()` or plain `rem`/`px` values.

### Static Spacing

For spacing that shouldn't scale, use fixed values:

```json
{
  "tokens": {
    "spacing": {
      "xs": { "value": "0.25rem", "slug": "20" },
      "sm": { "value": "0.5rem",  "slug": "30" },
      "md": { "value": "1rem",    "slug": "40" },
      "lg": { "value": "1.5rem",  "slug": "50" },
      "xl": { "value": "2rem",    "slug": "60" }
    }
  }
}
```

### CSS-Only Spacing

Use `cssOnly` for spacing tokens that are only needed in component styles and shouldn't appear in the WordPress spacing picker:

```json
{
  "tokens": {
    "spacing": {
      "small":    { "value": "0.5rem",  "slug": "30" },
      "medium":   { "value": "1rem",    "slug": "40" },
      "card-gap": { "value": "0.75rem", "cssOnly": true },
      "nav-pad":  { "value": "0.625rem", "cssOnly": true }
    }
  }
}
```

### Spacing Properties

| Property | Required | Description |
|----------|----------|-------------|
| `value` | Yes | Any valid CSS length — `rem`, `px`, `min()`, `clamp()`, etc. |
| `slug` | No | WordPress preset slug — use numeric slugs like `"40"` (auto-derived from key) |
| `name` | No | Human-readable label for the Site Editor (auto-derived from key — rarely needed) |
| `cssOnly` | No | When `true`, emit as a CSS variable only and exclude from WordPress entirely (no preset, no `settings.custom.*`, not overridable in the Site Editor) |

---

## Generated Output

### tokens.css

Every spacing token becomes a CSS custom property with a static value:

```css
:root {
  /* Spacing */
  --mylib--spacing-small: min(0.75rem, 1vw);
  --mylib--spacing-medium: min(1.5rem, 2vw);
  --mylib--spacing-large: min(2.25rem, 3vw);
}
```

### tokens.wp.css

Only generated when `output.themeable: true`. Preset tokens map to WordPress variables with the original value as a fallback:

```css
:root {
  /* Spacing */
  --mylib--spacing-small: var(--wp--preset--spacing--40, min(0.75rem, 1vw));
  --mylib--spacing-medium: var(--wp--preset--spacing--50, min(1.5rem, 2vw));
  --mylib--spacing-large: var(--wp--preset--spacing--60, min(2.25rem, 3vw));
}
```

The `var(--wp--preset--spacing--*, fallback)` pattern means that when a WordPress admin changes spacing in the Site Editor, your component library picks up the new value automatically.

### theme.json

Spacing tokens register under `settings.spacing.spacingSizes`:

```json
{
  "settings": {
    "spacing": {
      "spacingSizes": [
        { "slug": "40", "name": "Small", "size": "min(0.75rem, 1vw)" },
        { "slug": "50", "name": "Medium", "size": "min(1.5rem, 2vw)" },
        { "slug": "60", "name": "Large", "size": "min(2.25rem, 3vw)" }
      ]
    }
  }
}
```

CSS-only tokens are excluded from theme.json entirely.

---

## Spacing in Base Styles

The `baseStyles.spacing` section controls root-level block gap and padding. These values become root spacing tokens in `tokens.css`, drive the layout rules in `layout.css`, and flow into theme.json.

```json
{
  "baseStyles": {
    "spacing": {
      "blockGap": "medium",
      "padding": {
        "x": "large",
        "y": "0"
      }
    }
  }
}
```

Token keys like `"medium"` and `"large"` resolve to the corresponding spacing token. Raw values like `"0"` pass through as-is.

### Block Gap

The `blockGap` value controls the default vertical spacing between WordPress blocks. It generates a root spacing token in `tokens.css`, which the block-gap rules in `layout.css` read:

```css
:root {
  --mylib--root-block-gap: var(--mylib--spacing-medium);
}
```

In theme.json, it maps to `styles.spacing.blockGap`:

```json
{
  "styles": {
    "spacing": {
      "blockGap": "var(--wp--preset--spacing--50)"
    }
  }
}
```

### Root Padding

The `padding` object controls root-level page padding. It takes six keys, each a spacing token key or a raw CSS value:

| Key | Sets |
|-----|------|
| `x` | right and left |
| `y` | top and bottom |
| `top`, `right`, `bottom`, `left` | one side — wins over its axis |

```json
{
  "padding": {
    "x": "large",
    "y": "0",
    "left": "x-large"
  }
}
```

Here the right edge gets `large` and the left edge `x-large`. Unknown keys throw at config load.

#### Root spacing tokens

Root padding becomes tokens declared on `:root` in `tokens.css` (and `tokens.wp.css`), so components can use the page gutter anywhere — including WordPress block themes, which don't load `layout.css`. With the config at the top of this section, `tokens.css` gets:

```css
:root {
  /* Root Spacing */
  --mylib--root-padding-x: var(--mylib--spacing-large);
  --mylib--root-padding-y: 0;
  --mylib--root-padding-top: var(--mylib--root-padding-y);
  --mylib--root-padding-right: var(--mylib--root-padding-x);
  --mylib--root-padding-bottom: var(--mylib--root-padding-y);
  --mylib--root-padding-left: var(--mylib--root-padding-x);
  --mylib--root-block-gap: var(--mylib--spacing-medium);
}
```

- A side you don't set, or set to the same value as its axis, aliases the axis token. A side set to a different value emits its own — `"left": "x-large"` would give `--mylib--root-padding-left: var(--mylib--spacing-x-large);`.
- Without an explicit `x` or `y`, an axis takes the value its two sides share, so `{ "top": "0", "right": "large", "bottom": "0", "left": "large" }` produces the same tokens. If the two sides differ, or only one is set, the axis token is omitted and the side tokens are still emitted.
- `tokens.js` mirrors the group as `root`: `paddingX`, `paddingY`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `blockGap`.

See [Tokens](../guides/tokens.md#root-spacing-tokens) for how the aliases behave when you override them.

#### Layout rules

`layout.css` applies the side tokens through WordPress-compatible global padding utility classes:

```css
.has-global-padding {
  padding-right: var(--mylib--root-padding-right);
  padding-left: var(--mylib--root-padding-left);
}

.has-global-padding > .alignfull {
  max-width: none;
  margin-right: calc(var(--mylib--root-padding-right) * -1);
  margin-left: calc(var(--mylib--root-padding-left) * -1);
}

.has-global-padding > .alignfull > .has-global-padding {
  padding-right: var(--mylib--root-padding-right);
  padding-left: var(--mylib--root-padding-left);
}
```

The `.has-global-padding` and `.alignfull` rules mirror WordPress's root padding-aware alignment system, allowing full-width blocks to break out of the content area while nested content retains proper padding. They read the side tokens rather than `-x`, so a per-side override still matches what WordPress applies from theme.json.

In theme.json, root padding maps to `styles.spacing.padding`. WordPress only takes sides, so `x` and `y` expand to them:

```json
{
  "styles": {
    "spacing": {
      "blockGap": "var(--wp--preset--spacing--50)",
      "padding": {
        "top": "0",
        "right": "var(--wp--preset--spacing--60)",
        "bottom": "0",
        "left": "var(--wp--preset--spacing--60)"
      }
    }
  }
}
```

See [Base Styles](./base-styles.md) for the full list of supported properties.

---

## Using Spacing in Components

Reference the generated CSS variables directly:

```scss
.mylib-card {
  padding: var(--mylib--spacing-medium);
  margin-bottom: var(--mylib--spacing-large);
  gap: var(--mylib--spacing-small);
}
```

The variable pattern is `--{prefix}--spacing-{key}`.

To line a component up with the page gutter, use a root padding token instead of a spacing token:

```scss
.mylib-banner {
  padding-inline: var(--mylib--root-padding-x);
}
```
