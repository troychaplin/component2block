# theme.json Reference

Reference for WordPress theme.json settings and how they relate to `component2block` generated output. This covers settings that the generator handles automatically and settings that themes should configure manually.

## What the Generator Produces

The generated `theme.json` includes `settings` (what's available) and optionally `styles` (how things look by default, when `baseStyles` is configured).

### settings.color

```json
{
    "settings": {
        "color": {
            "palette": [
                { "slug": "primary", "color": "#0073aa", "name": "Primary" }
            ],
            "gradients": [
                { "slug": "sunset", "gradient": "linear-gradient(...)", "name": "Sunset" }
            ]
        }
    }
}
```

In locked mode (`wpThemeable: false`), the generator also sets:
- `custom: false` — Disables the free-form color picker
- `customDuotone: false` — Disables the duotone editor
- `customGradient: false` — Disables the gradient builder

### settings.typography

```json
{
    "settings": {
        "typography": {
            "fluid": true,
            "fontFamilies": [
                {
                    "slug": "inter",
                    "fontFamily": "Inter, sans-serif",
                    "name": "Inter",
                    "fontFace": [
                        {
                            "fontFamily": "Inter",
                            "fontStyle": "normal",
                            "fontWeight": "400",
                            "src": ["file:./assets/fonts/inter/inter-400-normal.woff2"]
                        }
                    ]
                }
            ],
            "fontSizes": [
                {
                    "slug": "small",
                    "size": "1rem",
                    "name": "Small",
                    "fluid": { "min": "0.875rem", "max": "1rem" }
                }
            ]
        }
    }
}
```

`typography.fluid: true` is set automatically when fontSize tokens exist.

### settings.spacing

```json
{
    "settings": {
        "spacing": {
            "spacingSizes": [
                { "slug": "30", "size": "0.5rem", "name": "Small" }
            ]
        }
    }
}
```

### settings.shadow

```json
{
    "settings": {
        "shadow": {
            "presets": [
                { "slug": "natural", "shadow": "6px 6px 9px rgba(0, 0, 0, 0.2)", "name": "Natural" }
            ]
        }
    }
}
```

### settings.layout

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

### settings.custom

Categories without native WordPress preset support:

```json
{
    "settings": {
        "custom": {
            "fontWeight": { "normal": "400", "bold": "700" },
            "lineHeight": { "tight": "1.25", "normal": "1.5" },
            "radius": { "sm": "2px", "md": "4px", "lg": "8px" },
            "transition": { "fast": "150ms ease", "normal": "200ms ease" }
        }
    }
}
```

WordPress generates `--wp--custom--*` CSS variables from these but they don't appear in editor UI controls.

## What Themes Should Configure

These settings are intentionally left to the theme:

### Default Preset Flags

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

The library doesn't set these because it injects at the default layer — setting them to `false` would hide the library's own presets.

### Duotones

Duotones can be added in the theme's `theme.json`:

```json
{
    "settings": {
        "color": {
            "customDuotone": true,
            "defaultDuotone": true,
            "duotone": [
                {
                    "name": "Midnight Purple",
                    "slug": "midnight-purple",
                    "colors": ["#1a0b2e", "#ff00ff"]
                }
            ]
        }
    }
}
```

### Background Images

Background images are a `styles` concern, configured in the theme:

```json
{
    "styles": {
        "background": {
            "backgroundImage": {
                "source": "file",
                "url": "http://example.com/image.jpg"
            },
            "backgroundSize": "cover",
            "backgroundPosition": "50% 0"
        }
    }
}
```

## styles Block

When `baseStyles` is configured, the generator adds a `styles` block. See [Base Styles](../base-styles.md) for the full structure.

### styles.typography (body defaults)

```json
{
    "styles": {
        "typography": {
            "fontFamily": "var(--wp--preset--font-family--inter)",
            "fontSize": "var(--wp--preset--font-size--medium)",
            "fontWeight": "400",
            "lineHeight": "1.6"
        },
        "color": {
            "text": "var(--wp--preset--color--secondary)",
            "background": "var(--wp--preset--color--base)"
        }
    }
}
```

### styles.elements

```json
{
    "styles": {
        "elements": {
            "heading": {
                "typography": { "fontFamily": "var(--wp--preset--font-family--inter)" },
                "color": { "text": "var(--wp--preset--color--primary)" }
            },
            "h1": {
                "typography": { "fontSize": "4.5rem", "fontStyle": "normal", "fontWeight": "500" }
            },
            "caption": {
                "typography": { "fontSize": "var(--wp--preset--font-size--small)", "fontStyle": "italic" }
            },
            "button": {
                "color": { "text": "var(--wp--preset--color--off-white)", "background": "var(--wp--preset--color--primary)" }
            },
            "link": {
                "color": { "text": "var(--wp--preset--color--primary)" },
                ":hover": {
                    "color": { "text": "var(--wp--preset--color--primary-hover)" }
                }
            }
        }
    }
}
```

### styles.spacing

When `baseStyles.spacing` is configured:

```json
{
    "settings": {
        "useRootPaddingAwareAlignments": true
    },
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
