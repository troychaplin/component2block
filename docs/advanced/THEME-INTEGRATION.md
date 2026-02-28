# Theme Integration

This guide covers how to integrate a component library built with `component2block` into a WordPress block theme.

## How Token Loading Works

Two mechanisms work together to make component library tokens available in WordPress:

### 1. integrate.php + theme.json — Register Presets

The generated `integrate.php` loads the library's `theme.json` into WordPress's theme.json cascade at the **default layer** (the lowest priority). This registers your design tokens as WordPress presets — colors appear in the color picker, spacing sizes in spacing controls, fonts in the font picker, etc.

WordPress reads these presets and generates its own CSS variables:

```
c2b.config.json
  → component2block generate
    → theme.json: { "settings": { "color": { "palette": [{ "slug": "primary", "color": "#0073aa" }] } } }
      → WordPress generates: --wp--preset--color--primary: #0073aa
```

These `--wp--preset--*` variables are what the Site Editor and theme.json overrides target.

### 2. Token CSS File — Bridge to Component Variables

Your components always reference `--prefix--*` variables (e.g. `--design-system--color-primary`). They never reference `--wp--preset--*` directly. The token CSS file provides those `--prefix--*` variables.

**Which file you use determines whether components respond to theme overrides:**

#### tokens.css — Locked Design System (default)

Always generated. Contains hardcoded values:

```css
--design-system--color-primary: #0073aa;
```

Components work in WordPress, but the values are locked. If a theme overrides "primary" to `#e63946` in its `theme.json`, the Site Editor palette updates but your components still show `#0073aa`.

**Use when:** You want a locked, consistent design system that themes cannot change.

#### tokens.wp.css — Themeable Design System (opt-in)

Generated only when `"wpThemeable": true` is set in `c2b.config.json`. Maps preset tokens to WordPress variables with fallbacks:

```css
/* Preset token — maps to --wp--preset--, overridable via Site Editor */
--design-system--color-primary: var(--wp--preset--color--primary, #0073aa);

/* CSS-only token — hardcoded, not overridable */
--design-system--color-primary-hover: #005a87;
```

When a theme overrides "primary" to `#e63946` in its `theme.json`:
1. WordPress updates `--wp--preset--color--primary` to `#e63946`
2. `tokens.wp.css` picks this up via `var(--wp--preset--color--primary, ...)`
3. `--design-system--color-primary` resolves to `#e63946`
4. Components automatically display the theme's color

**Use when:** You want themes to be able to customize your design tokens via their `theme.json` or the Site Editor.

### The Full Flow

```
c2b.config.json
  │
  ├─► integrate.php loads theme.json into WordPress
  │     → WordPress generates --wp--preset--color--primary: #0073aa
  │     → Site Editor shows "Primary" in color picker
  │
  ├─► tokens.css (locked)
  │     → --design-system--color-primary: #0073aa
  │     → Components use hardcoded value, ignore theme overrides
  │
  └─► tokens.wp.css (themeable, opt-in)
        → --design-system--color-primary: var(--wp--preset--color--primary, #0073aa)
        → Components follow theme overrides automatically
```

## Prerequisites

- WordPress 6.0+
- A block theme
- A published component library built with `component2block`

## Enabling Themeable Tokens

To generate `tokens.wp.css`, set `"wpThemeable": true` in your `c2b.config.json`:

```json
{
  "prefix": "design-system",
  "wpThemeable": true
}
```

Then run `npx c2b generate`. The file appears at `dist/wp/tokens.wp.css`.

## Published Package Structure

Install the library in your theme:

```bash
npm install your-component-library
```

The files relevant to theme integration:

```
node_modules/your-component-library/dist/
├── wp/
│   ├── integrate.php     # PHP hooks: theme.json filter + token CSS enqueue
│   ├── theme.json        # Generated theme.json base layer
│   ├── tokens.css        # CSS vars with hardcoded values (always present)
│   └── tokens.wp.css     # CSS vars mapped to --wp--preset--* (if wpThemeable: true)
└── fonts/                # Font files (if fontFace defined)
    └── inter/
        └── inter-400-normal.woff2
```

## Setup

### Step 1: Copy library files into the theme

```bash
# Copy integration files
mkdir -p assets/c2b
cp node_modules/your-component-library/dist/wp/* assets/c2b/

# Copy font files
cp -r node_modules/your-component-library/dist/fonts assets/fonts
```

Your theme structure:

```
your-theme/
├── assets/
│   ├── c2b/
│   │   ├── integrate.php    (theme.json filter + token CSS enqueue)
│   │   ├── theme.json       (base layer presets)
│   │   ├── tokens.css       (locked token values — always present)
│   │   └── tokens.wp.css    (themeable token values — if wpThemeable: true)
│   └── fonts/               (font files referenced by theme.json fontFace)
│       └── inter/
│           └── inter-400-normal.woff2
├── functions.php
└── theme.json               (your theme's own theme.json — overrides library defaults)
```

### Step 2: Load integrate.php

Add one line to your theme's `functions.php`:

```php
require_once get_template_directory() . '/assets/c2b/integrate.php';
```

This single file handles everything:

1. **Injects `theme.json`** into WordPress's theme.json cascade at the default layer, registering your design tokens as presets (including font families and `fontFace` declarations)
2. **Enqueues the token CSS** on both the frontend and inside the block editor iframe
3. **Enforces locked-mode restrictions** when `wpThemeable: false` — locks layout sizes and disables custom color/gradient creation so themes cannot override the design system

The enqueue auto-detects which token file to load: if `tokens.wp.css` exists in the same directory, it uses that (themeable). Otherwise it falls back to `tokens.css` (locked). No manual `wp_enqueue_style` calls needed.

**Fonts are loaded automatically** — WordPress reads the `fontFace` entries from the injected theme.json and generates `@font-face` rules. The `file:./` paths in theme.json (e.g., `file:./assets/fonts/inter/inter-400-normal.woff2`) are resolved relative to the **theme root**, so `assets/fonts/` must exist at the top level of your theme.

### Step 3: Override defaults in your theme.json (optional)

Your theme's `theme.json` overrides any library defaults. Only define what's different:

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

With `tokens.wp.css`, components automatically pick up `#e63946` — no additional CSS needed. With `tokens.css`, the override affects the Site Editor palette but components keep their hardcoded values.

You only need to define what's different. All other values fall through from the library's defaults.

## What the Theme Provides

| File | Location | Purpose |
|------|----------|---------|
| `integrate.php` | `assets/c2b/` | Injects library theme.json as defaults + enqueues token CSS (auto-detects locked vs themeable) |
| `theme.json` | `assets/c2b/` | Library's base layer presets (colors, spacing, fonts, custom values) + `fontFace` declarations |
| `tokens.css` | `assets/c2b/` | `--prefix--*` CSS variables with hardcoded values (locked, always present) |
| `tokens.wp.css` | `assets/c2b/` | `--prefix--*` CSS variables mapped to `--wp--preset--*` (themeable, opt-in) |
| Font files | `assets/fonts/` | `.woff2` files referenced by `fontFace` entries in theme.json (loaded automatically by WordPress) |
| Theme's own `theme.json` | theme root | Overrides any library defaults (colors, spacing, fonts) |

## theme.json Cascade

WordPress merges theme.json layers in this order (lowest to highest priority):

1. **WordPress core defaults**
2. **Library base layer** — `integrate.php` injects here via `wp_theme_json_data_default`
3. **Parent theme** `theme.json`
4. **Child theme** `theme.json`
5. **User Global Styles** (editor customizations)

Your theme's `theme.json` automatically overrides library defaults.

See [Token Architecture](./TOKEN-ARCHITECTURE.md) for the full list of generated token mappings.

## Style Variations

Style variations are JSON files in the theme's `styles/` directory that provide alternative palettes and styles selectable from the Site Editor.

### Creating a style variation

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

### Style variation preview requires a styles section

The default variation also needs a `styles` section in the theme's root `theme.json` for the preview to render correctly. See [Known Issues](#style-variation-preview-shows-blank-colors) below.

## Font Loading

Fonts are handled entirely through theme.json — no separate font stylesheet is needed for WordPress.

When the library defines `fontFace` entries in `c2b.config.json`:

```json
{
  "fontFamily": {
    "inter": {
      "value": "Inter, sans-serif",
      "fontFace": [
        { "weight": "400", "style": "normal", "src": "inter-400-normal.woff2" }
      ]
    }
  }
}
```

The generator produces `fontFace` entries in the generated theme.json:

```json
{
  "settings": {
    "typography": {
      "fontFamilies": [{
        "slug": "inter",
        "fontFamily": "Inter, sans-serif",
        "name": "Inter",
        "fontFace": [{
          "fontFamily": "Inter",
          "fontStyle": "normal",
          "fontWeight": "400",
          "src": ["file:./assets/fonts/inter/inter-400-normal.woff2"]
        }]
      }]
    }
  }
}
```

When `integrate.php` injects this into the WordPress theme.json cascade, WordPress automatically generates `@font-face` rules and loads the font files. The `file:./` paths are resolved relative to the **theme root** — so `assets/fonts/` must exist at the top level of your theme:

```
your-theme/
├── assets/
│   ├── c2b/
│   │   └── theme.json       ← fontFace references file:./assets/fonts/...
│   └── fonts/
│       └── inter/
│           └── inter-400-normal.woff2  ← WordPress loads this automatically
└── theme.json                ← file:./ resolves from here (theme root)
```

> **Important:** The generator creates font *references*, not font *files*. Your build process must copy the actual `.woff2` files into `dist/fonts/{slug}/` before publishing. See [Token Architecture](./TOKEN-ARCHITECTURE.md) for details on managing font files.

## Troubleshooting

### CSS variables not taking effect

1. **Tokens must load before component CSS.** Set `['c2b-tokens']` as a dependency on component style registrations
2. **Check specificity.** Theme overrides may need to match or exceed library specificity
3. **Verify the variable names match.** Open browser dev tools and inspect the element

### Fonts not loading

1. **Check the font files exist.** The `assets/fonts/` directory must be at the theme root level. The generator creates references but not the actual font files — your build process must copy them
2. **Verify `file:./` paths.** WordPress resolves `file:./` relative to the theme root. Ensure `assets/fonts/{slug}/` exists at the top level of your theme
3. **Check the browser Network tab.** Look for 404s on `.woff2` requests to identify the exact missing path

### Theme overrides not affecting components

If your theme.json color/spacing changes appear in the Site Editor but not in your components:

1. **Check which token file you're loading.** `tokens.css` has hardcoded values — components won't respond to overrides. Switch to `tokens.wp.css` for themeable behavior
2. **Verify `wpThemeable: true`** is set in `c2b.config.json` and you've re-run the generator
3. **Check the token is a preset.** Only object entries (not string shorthand or `cssOnly: true`) get mapped to `--wp--preset--*` variables

## Known Issues

### Style variation preview shows blank colors

**Symptom:** When using style variations (JSON files in the theme's `styles/` directory), the default variation's color palette preview appears as white/blank in the Site Editor's style picker, even though the palette works correctly when applied.

**Cause:** The style variation preview does not read colors from `settings.color.palette`. Instead, it extracts colors from the `styles` section — specifically `styles.color.text` and `styles.elements.button.color.background`. If the theme's root `theme.json` has no `styles` section, the preview has no colors to render.

This is a WordPress core behavior introduced in [Gutenberg PR #59514](https://github.com/WordPress/gutenberg/pull/59514). There is an [open issue (#60478)](https://github.com/WordPress/gutenberg/issues/60478) proposing a `settings.example` property to let theme authors explicitly control preview colors, but it has not been implemented yet.

**Workaround:** Add a `styles` section to both your theme's root `theme.json` and each style variation JSON file:

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

**Why the library can't fix this:** The `styles` section defines how tokens are *applied* to page elements (background, text, buttons), which is a theme-level concern. The library provides the design tokens (`settings`), but the theme decides how to use them.

### Locked vs Themeable Mode

The `wpThemeable` flag in `c2b.config.json` controls how much freedom themes and editors have:

| Behavior | `wpThemeable: false` (locked) | `wpThemeable: true` (themeable) |
|----------|-------------------------------|----------------------------------|
| Token CSS file | `tokens.css` (hardcoded values) | `tokens.wp.css` (maps to `--wp--preset--*`) |
| Custom color picker | Disabled — users pick from defined palette only | Enabled |
| Custom duotone creator | Disabled | Enabled |
| Custom gradient creator | Disabled — users pick from defined gradients only | Enabled |
| Layout sizes | Locked — theme cannot override `contentSize` / `wideSize` | Overridable — theme's values win |
| Color/spacing/font presets | Theme can override via its `theme.json` | Theme can override via its `theme.json` |
| Components follow theme overrides | No — hardcoded values | Yes — via `--wp--preset--*` mapping |

**How it works:** `integrate.php` auto-detects the mode by checking whether `tokens.wp.css` exists in the same directory. In locked mode, it adds a second filter on `wp_theme_json_data_theme` that enforces layout sizes and color restrictions at the theme layer — the theme's `theme.json` cannot override these settings.

The generated `theme.json` includes `custom: false`, `customDuotone: false`, and `customGradient: false` in the `settings.color` block when locked. This sets the default at the base layer, and `integrate.php` reinforces it at the theme layer.

### Hiding WordPress default presets

The library's generated `theme.json` intentionally does **not** set `defaultPalette`, `defaultGradients`, `defaultSpacingSizes`, or `defaultPresets` flags. Because the library injects at the `wp_theme_json_data_default` layer, setting these to `false` would hide the library's own presets (WordPress treats them as defaults).

If your theme wants to hide WordPress's built-in color palette, gradients, or spacing sizes, set these flags in the theme's own `theme.json` (layer 3):

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
