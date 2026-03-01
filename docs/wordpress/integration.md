# WordPress Integration

How to add your component library's compiled assets to a WordPress block theme.

## Prerequisites

- WordPress 6.0+
- A block theme
- A published component library built with `component2block`

## What You Need

After installing your component library from npm, the WordPress assets are in `dist/wp/`:

```
node_modules/your-component-library/dist/
├── wp/
│   ├── integrate.php     PHP hooks (theme.json filter + token CSS enqueue)
│   ├── theme.json        Design token presets (base layer)
│   ├── tokens.css        CSS variables — hardcoded values (always present)
│   └── tokens.wp.css     CSS variables — mapped to --wp--preset--* (if wpThemeable)
└── fonts/
    └── inter/
        └── inter-400-normal.woff2
```

## Setup

### 1. Copy the files into your theme

```bash
# Integration files
mkdir -p assets/c2b
cp node_modules/your-component-library/dist/wp/* assets/c2b/

# Font files (if your library defines fontFace)
cp -r node_modules/your-component-library/dist/fonts assets/fonts
```

Your theme should look like this:

```
your-theme/
├── assets/
│   ├── c2b/
│   │   ├── integrate.php
│   │   ├── theme.json
│   │   ├── tokens.css
│   │   └── tokens.wp.css
│   └── fonts/
│       └── inter/
│           └── inter-400-normal.woff2
├── functions.php
└── theme.json
```

### 2. Load integrate.php

Add one line to your theme's `functions.php`:

```php
require_once get_template_directory() . '/assets/c2b/integrate.php';
```

### 3. Done

That's it. `integrate.php` handles everything:

- Injects the library's `theme.json` into WordPress's theme.json cascade at the default layer (lowest priority)
- Registers design tokens as WordPress presets (colors in the color picker, spacing in spacing controls, fonts in the font picker)
- Enqueues the token CSS on both the frontend and inside the block editor iframe
- Auto-detects which token file to load (`tokens.wp.css` if present, otherwise `tokens.css`)
- Loads fonts automatically via `fontFace` entries in theme.json

## What Happens

Once loaded, your library's design tokens are available across WordPress:

| What | Where it shows up |
|------|-------------------|
| Colors | Site Editor color picker |
| Spacing sizes | Spacing controls on blocks |
| Font families | Font picker in typography controls |
| Font sizes | Size picker in typography controls |
| Shadows | Shadow picker on supported blocks |
| Layout sizes | Content width and wide width settings |

Your theme's own `theme.json` automatically overrides any library defaults — it sits at a higher priority layer.

## Overriding Library Defaults

Your theme's `theme.json` only needs to define what's different. Everything else falls through from the library:

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

For details on locked vs themeable mode, style variations, and advanced override patterns, see [WordPress Theming](./theming.md).

## Troubleshooting

### CSS variables not taking effect

1. Verify `integrate.php` is loaded — check that the `require_once` line is in `functions.php`
2. Check the browser Network tab — ensure token CSS is loading (look for `tokens.css` or `tokens.wp.css`)
3. Inspect the element — verify `--prefix--*` variables are present on `:root`

### Fonts not loading

1. Check that `assets/fonts/` exists at the theme root — WordPress resolves `file:./` paths relative to the theme root
2. Check the browser Network tab for 404s on `.woff2` requests
3. The generator creates font references, not font files — your build process must copy the actual `.woff2` files

### Theme overrides not affecting components

This is expected if you're using `tokens.css` (locked mode). Components use hardcoded values and ignore Site Editor changes. Switch to `tokens.wp.css` by setting `wpThemeable: true` in the library's config. See [WordPress Theming](./theming.md) for details.
