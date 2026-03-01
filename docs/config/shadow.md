# Shadows

This guide covers how to configure box-shadow tokens in `c2b.config.json`, including the dual preset/custom behavior in WordPress and how to control which shadows appear in the Site Editor.

## Shadow Configuration

Shadows are defined in the `shadow` category under `tokens`. Each entry produces a CSS custom property and can optionally register as a WordPress shadow preset.

String shorthand registers as a preset with auto-derived `slug` and `name`:

```json
{
  "tokens": {
    "shadow": {
      "natural":  "6px 6px 9px rgba(0, 0, 0, 0.2)",
      "deep":     "12px 12px 50px rgba(0, 0, 0, 0.4)",
      "sharp":    "6px 6px 0px rgba(0, 0, 0, 0.2)",
      "outlined": "6px 6px 0px -3px rgb(255, 255, 255), 6px 6px rgb(0, 0, 0)",
      "crisp":    "6px 6px 0px rgb(0, 0, 0)"
    }
  }
}
```

### Preset vs Custom Shadows

Shadows have a dual behavior in theme.json that differs from most other token categories:

- **Tokens with `name` and `slug`** register as WordPress shadow presets under `settings.shadow.presets` — they appear in the Site Editor shadow picker
- **Tokens without `name`/`slug`** go into `settings.custom.shadow` — they produce CSS variables but don't appear in the Site Editor picker

Since `name` and `slug` are auto-derived from the key by default, all shadow tokens become presets unless you explicitly opt them out with `cssOnly`:

```json
{
  "tokens": {
    "shadow": {
      "natural": "6px 6px 9px rgba(0, 0, 0, 0.2)",
      "deep":    "12px 12px 50px rgba(0, 0, 0, 0.4)",
      "inner":   { "value": "inset 0 2px 4px rgba(0, 0, 0, 0.1)", "cssOnly": true }
    }
  }
}
```

Here, `natural` and `deep` appear in the Site Editor shadow picker. `inner` produces a CSS variable only.

### Shadow Properties

| Property | Required | Description |
|----------|----------|-------------|
| `value` | Yes | Any valid CSS `box-shadow` value — single or comma-separated multiple shadows |
| `name` | No | Human-readable label for the Site Editor (auto-derived from key) |
| `slug` | No | WordPress preset slug (auto-derived from key) |
| `cssOnly` | No | When `true`, CSS variable only — no WordPress preset |

### Shadow Values

The `value` field accepts any valid CSS `box-shadow` syntax, including multiple comma-separated shadows:

```json
{
  "tokens": {
    "shadow": {
      "soft":     "0 2px 8px rgba(0, 0, 0, 0.1)",
      "elevated": "0 4px 16px rgba(0, 0, 0, 0.12)",
      "inset":    { "value": "inset 0 2px 4px rgba(0, 0, 0, 0.1)", "cssOnly": true },
      "outlined": "6px 6px 0px -3px rgb(255, 255, 255), 6px 6px rgb(0, 0, 0)"
    }
  }
}
```

The value is passed through as-is — no transformation or validation is applied.

---

## Generated Output

### tokens.css

Every shadow token becomes a CSS custom property:

```css
:root {
  /* Shadows */
  --mylib--shadow-natural: 6px 6px 9px rgba(0, 0, 0, 0.2);
  --mylib--shadow-deep: 12px 12px 50px rgba(0, 0, 0, 0.4);
  --mylib--shadow-sharp: 6px 6px 0px rgba(0, 0, 0, 0.2);
}
```

### tokens.wp.css

Only generated when `output.wpThemeable: true`. Preset tokens map to WordPress preset variables; CSS-only tokens stay hardcoded:

```css
:root {
  /* Shadows */
  --mylib--shadow-natural: var(--wp--preset--shadow--natural, 6px 6px 9px rgba(0, 0, 0, 0.2));
  --mylib--shadow-deep: var(--wp--preset--shadow--deep, 12px 12px 50px rgba(0, 0, 0, 0.4));
  --mylib--shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### theme.json

Named shadow tokens register as presets under `settings.shadow.presets`. CSS-only tokens are excluded:

```json
{
  "settings": {
    "shadow": {
      "presets": [
        {
          "slug": "natural",
          "name": "Natural",
          "shadow": "6px 6px 9px rgba(0, 0, 0, 0.2)"
        },
        {
          "slug": "deep",
          "name": "Deep",
          "shadow": "12px 12px 50px rgba(0, 0, 0, 0.4)"
        }
      ]
    }
  }
}
```

When a shadow has both `themeJson` and `custom` mappings (the default for this category), the generator routes each token to the right place:

- Tokens with `name` + `slug` → `settings.shadow.presets` (Site Editor picker)
- Tokens without `name`/`slug` → `settings.custom.shadow` (CSS variable only)

In practice, since `name` and `slug` are auto-derived, you'll use `cssOnly` to control which shadows stay out of the picker.

---

## Using Shadows in Components

Reference the generated CSS variables directly:

```scss
.mylib-card {
  box-shadow: var(--mylib--shadow-natural);
}

.mylib-card:hover {
  box-shadow: var(--mylib--shadow-deep);
}

.mylib-input:focus {
  box-shadow: var(--mylib--shadow-inner);
}
```

The variable pattern is `--{prefix}--shadow-{key}`.

## Recommended Patterns

**Use descriptive names for purpose, not appearance.** Names like `natural`, `elevated`, and `deep` communicate intent better than `shadow-1`, `shadow-2`:

```json
{
  "tokens": {
    "shadow": {
      "natural":  "6px 6px 9px rgba(0, 0, 0, 0.2)",
      "elevated": "0 4px 16px rgba(0, 0, 0, 0.12)",
      "deep":     "12px 12px 50px rgba(0, 0, 0, 0.4)"
    }
  }
}
```

**Keep `cssOnly` for implementation details.** Inset shadows, focus rings, and hover-only effects don't belong in the Site Editor picker:

```json
{
  "tokens": {
    "shadow": {
      "natural":    "6px 6px 9px rgba(0, 0, 0, 0.2)",
      "deep":       "12px 12px 50px rgba(0, 0, 0, 0.4)",
      "focus-ring": { "value": "0 0 0 3px rgba(0, 115, 170, 0.4)", "cssOnly": true },
      "inset":      { "value": "inset 0 2px 4px rgba(0, 0, 0, 0.1)", "cssOnly": true }
    }
  }
}
```
