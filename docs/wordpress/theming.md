# WordPress Theming

This guide covers how WordPress themes interact with a component library built with `component2block` — locked vs themeable mode, overriding tokens, and style variations.

For basic setup, see [WordPress Integration](./integration.md) first.

## Locked vs Themeable Mode

The `output.wpThemeable` flag in `c2b.config.json` controls how much freedom themes and editors have:

| Behavior | Locked (default) | Themeable |
|----------|-------------------|-----------|
| Config | `output.wpThemeable: false` | `output.wpThemeable: true` |
| Token CSS file | `tokens.css` (hardcoded) | `tokens.wp.css` (maps to `--wp--preset--*`) |
| Custom color picker | Disabled | Enabled |
| Custom duotone creator | Disabled | Enabled |
| Custom gradient creator | Disabled | Enabled |
| Layout sizes | Locked | Overridable |
| Components follow theme overrides | No | Yes |

### Locked Mode (default)

Components use hardcoded CSS values. The design system is consistent everywhere — themes cannot change it via the Site Editor.

`integrate.php` enforces this by adding restrictions at the `wp_theme_json_data_theme` filter layer. The generated `theme.json` sets `custom: false`, `customDuotone: false`, and `customGradient: false` in settings.

### Themeable Mode

Set `output.wpThemeable: true` in the library's `c2b.config.json` and re-run the generator. This produces `tokens.wp.css` which maps preset tokens to `--wp--preset--*` variables:

```css
/* Object entry — maps to WP preset, overridable via Site Editor */
--mylib--color-primary: var(--wp--preset--color--primary, #0073aa);

/* CSS-only token — hardcoded, not overridable */
--mylib--color-primary-hover: #005a87;
```

When a theme overrides "primary" to `#e63946`:

1. WordPress updates `--wp--preset--color--primary` to `#e63946`
2. `tokens.wp.css` picks this up via the `var()` reference
3. `--mylib--color-primary` resolves to `#e63946`
4. Components automatically display the theme's color

CSS-only tokens (string shorthand or `cssOnly: true`) remain hardcoded regardless of mode.

## theme.json Cascade

WordPress merges theme.json layers in this order (lowest to highest priority):

1. **WordPress core defaults**
2. **Library base layer** — `integrate.php` injects here via `wp_theme_json_data_default`
3. **Parent theme** `theme.json`
4. **Child theme** `theme.json`
5. **User Global Styles** (Site Editor customizations)

Your theme's `theme.json` (layer 3) automatically overrides library defaults (layer 2).

## Overriding Tokens

Your theme's `theme.json` only needs to define what's different:

```json
{
    "$schema": "https://schemas.wp.org/trunk/theme.json",
    "version": 3,
    "settings": {
        "color": {
            "palette": [
                {
                    "slug": "primary",
                    "color": "#e63946",
                    "name": "Primary"
                }
            ]
        }
    }
}
```

With `tokens.wp.css` (themeable), components automatically pick up `#e63946`. With `tokens.css` (locked), the override affects the Site Editor palette but components keep their hardcoded values.

## Hiding WordPress Default Presets

The library's `theme.json` intentionally does **not** set `defaultPalette`, `defaultGradients`, etc. to `false`. Because the library injects at the default layer, setting these would hide the library's own presets.

If your theme wants to hide WordPress's built-in presets, set these flags in the **theme's own** `theme.json`:

```json
{
    "settings": {
        "color": {
            "defaultPalette": false,
            "defaultGradients": false,
            "defaultDuotone": false
        },
        "spacing": {
            "defaultSpacingSizes": false
        }
    }
}
```

At the theme layer, these flags only remove WordPress's core presets — the library's presets are preserved.

## Style Variations

Style variations are JSON files in the theme's `styles/` directory that provide alternative palettes selectable from the Site Editor.

### Creating a Style Variation

Create a file like `styles/twilight.json`:

```json
{
    "$schema": "https://schemas.wp.org/trunk/theme.json",
    "version": 3,
    "title": "Twilight",
    "settings": {
        "color": {
            "palette": [
                { "slug": "primary", "color": "#6366f1", "name": "Primary" },
                { "slug": "secondary", "color": "#1e1b4b", "name": "Secondary" },
                { "slug": "contrast", "color": "#e0e7ff", "name": "Contrast" },
                { "slug": "base", "color": "#0f172a", "name": "Base" }
            ]
        }
    },
    "styles": {
        "color": {
            "background": "var:preset|color|base",
            "text": "var:preset|color|contrast"
        },
        "elements": {
            "button": {
                "color": {
                    "background": "var:preset|color|primary",
                    "text": "var:preset|color|base"
                }
            }
        }
    }
}
```

### Style Variation Preview

The default variation also needs a `styles` section in the theme's root `theme.json` for the preview to render correctly. Without it, the preview shows blank colors.

This is a WordPress core behavior — the preview extracts colors from `styles.color.text` and `styles.elements.button.color.background`, not from `settings.color.palette`.

Add this to both your theme's root `theme.json` and each style variation:

```json
{
    "styles": {
        "color": {
            "background": "var:preset|color|base",
            "text": "var:preset|color|contrast"
        },
        "elements": {
            "button": {
                "color": {
                    "background": "var:preset|color|primary",
                    "text": "var:preset|color|base"
                }
            }
        }
    }
}
```

The library provides design tokens (`settings`), but the theme decides how to apply them to page elements (`styles`).

## Font Loading in WordPress

Fonts are handled entirely through theme.json — no separate font stylesheet needed.

When the library defines `fontFace` entries, the generated theme.json includes `fontFace` declarations. WordPress automatically generates `@font-face` rules and loads the fonts when `integrate.php` injects the theme.json.

The `file:./` paths in theme.json resolve relative to the **theme root**:

```
your-theme/
├── assets/
│   ├── c2b/
│   │   └── theme.json       ← fontFace references file:./assets/fonts/...
│   └── fonts/
│       └── inter/
│           └── inter-400-normal.woff2
└── theme.json                ← file:./ resolves from here
```

The generator creates font references, not font files. Your build process must copy the actual `.woff2` files into `dist/fonts/{slug}/`.

## Troubleshooting

### Theme overrides not affecting components

1. Check which token file is loading — `tokens.css` has hardcoded values, `tokens.wp.css` is needed for themeable behavior
2. Verify `output.wpThemeable: true` is set in `c2b.config.json` and you've re-run the generator
3. Confirm the token is a preset — for preset categories, string shorthand and object entries (without `cssOnly: true`) map to `--wp--preset--*`

### Style variation preview shows blank colors

Add a `styles` section to both your theme's root `theme.json` and each variation JSON file. See [Style Variation Preview](#style-variation-preview) above.

### Fonts not loading

1. Verify `assets/fonts/` exists at the theme root
2. Check the browser Network tab for 404s on `.woff2` requests
3. Ensure font files are copied during your build — the generator creates references, not files
