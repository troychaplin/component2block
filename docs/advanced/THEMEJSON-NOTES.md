# Theme.json Notes

----

## Colors

### Defaults

Custom colors should be supported in the Component2Block generator. Default can be disabled in the theme's primary `theme.json` file as per the example below.

The following color settings can be be disabled by setting them to `false` in the themes primary `theme.json` file.

- `custom` - Enables the free-form color picker so users can enter any custom color for text, backgrounds, and links.
- `defaultPalette` - Shows the core WordPress color palette in addition to your theme’s colors.

```json
{
    "settings": {
        "color": {
            "custom": true,          // optional, defaults to true
            "defaultPalette": true,  // optional, defaults to true
			"palette": [
				{
					"color": "#df4b4b",
					"name": "Color 1",
					"slug": "custom-color-1"
				},
				{
					"color": "#1f9741",
					"name": "Color 2",
					"slug": "custom-color-2"
				}
			]
		},
    }
}
```

### Gradients

Custom gradients should be supported in the Component2Block generator. Default can be disabled in the theme's primary `theme.json` file as per the example below.

The following color settings can be be disabled by setting them to `false` in the themes primary `theme.json` file.

- `customGradient` - Enables the gradient builder so users can create their own gradients (colors, angle, and linear/radial type).
- `defaultGradients` - Shows the core WordPress gradient presets alongside your theme’s gradients.

```json
{
    "settings": {
        "color": {
            "customGradient": true,    // optional, defaults to true
            "defaultGradients": true,  // optional, defaults to true
			"gradients": [
				{
					"gradient": "linear-gradient(135deg,rgb(134,255,223) 0%,rgb(143,51,228) 100%)",
					"name": "Color 1",
					"slug": "custom-color-1"
				},
				{
					"gradient": "linear-gradient(0deg,rgb(227,7,97) 0%,rgb(0,195,255) 100%)",
					"name": "Color 2",
					"slug": "custom-color-2"
				}
			]
		},
    }
}
```

### Duotones

Can be added manually in theme.json but no native support for adding custom duotones in the site editor. Custom duotones should be supported in the `c2b.config` file and be handled in the generation script. Adding custom duotones would look like the example below.

The following color settings can be be disabled by setting them to `false` in the themes primary `theme.json` file.

- `customDuotone` - Lets users tweak duotone presets by editing the shadow and highlight colors.
- `defaultDuotone` - Shows the core WordPress duotone presets alongside your custom duotones.

```json
{
  "settings": {
    "color": {
        "customDuotone": true,   // optional, defaults to true
        "defaultDuotone": true,  // optional, defaults to true
        "duotone": [
            {
            "name": "Midnight Purple",
            "slug": "midnight-purple",
            "colors": [ "#1a0b2e", "#ff00ff" ]
            },
            {
            "name": "Golden Hour",
            "slug": "golden-hour",
            "colors": [ "#42210b", "#fff8e1" ]
            }
            // add more duotones here
        ]
    }
  }
}
```

----

## Background

This option falls under the styles entry and is not an ideal candidate for the component library. I feel this is better done in CSS against an element like the body tag and gain greater control over the implementation. Examples of implementation via the `Site Editor` are as follows.

### Tile

```json
{
    "styles": {
        "background": {
            "backgroundImage": {
                "id": 51,
                "source": "file",
                "title": "waves-3840x2160-blue-orange-25502",
                "url": "http://localhost:8883/wp-content/uploads/2026/02/waves-3840x2160-blue-orange-25502-scaled.jpg"
            },
            "backgroundPosition": "50% 0",
            "backgroundSize": "auto"
        }
    },
}
```

### Contain

```json
{
    "styles": {
        "background": {
            "backgroundImage": {
                "id": 51,
                "source": "file",
                "title": "waves-3840x2160-blue-orange-25502",
                "url": "http://localhost:8883/wp-content/uploads/2026/02/waves-3840x2160-blue-orange-25502-scaled.jpg"
            },
            "backgroundPosition": "50% 0",
            "backgroundRepeat": "repeat",
            "backgroundSize": "contain"
        }
    },
}
```

### Cover

```json
{
    "styles": {
		"background": {
			"backgroundAttachment": "scroll",
			"backgroundImage": {
				"id": 51,
				"source": "file",
				"title": "waves-3840x2160-blue-orange-25502",
				"url": "http://localhost:8883/wp-content/uploads/2026/02/waves-3840x2160-blue-orange-25502-scaled.jpg"
			},
			"backgroundPosition": "50% 0",
			"backgroundRepeat": "repeat",
			"backgroundSize": "cover"
		}
	},
}
```

----

## Shadows

Custom shadows should be supported in the Component2Block generator. Default can be disabled in the theme's primary `theme.json` file as per the example below. The styles map to `box-shadow`.

The following color settings can be be disabled by setting them to `false` in the themes primary `theme.json` file.

- `defaultPresets` - Shows the core WordPress shadows presets alongside your custom shadows.

```json
{
    "settings": {
        "shadow": {
            "defaultPresets": true,  // optional, defaults to true
            "presets": [
                {
                    "name": "Shadow 1",
                    "shadow": "15px 7px 17px 11px rgba(0, 0, 0, 0.2)",
                    "slug": "shadow-1"
                },
                {
                    "name": "Shadow 2",
                    "shadow": "inset -5px -4px 5px 8px rgba(0, 0, 0, 0.2)",
                    "slug": "shadow-2"
                }
            ]
        }
    }
}
```

----

## Layout

The primary layout settings relate to the custom content widths. These are already handled in our `c2b.config` and are being output as both entries in the generated `theme.json` file, but also as tokens for usage in CSS.

```json
{
    "settings": {
        "layout": {
			"contentSize": "645px",
			"wideSize": "1340px"
		},
    }
}
```

The `Site Editor` also provides controls for padding that are being applied to the `body` tag, while the gap is set as a token `--wp--style--block-gap: 79px;`. By default the padding is `0` while the block gap is `24px`.

These style should be factored into the `c2b.config` and exported as tokens and generated as part of the custom `theme.json` file.

```json
{
    "styles": {
		"spacing": {
			"blockGap": "79px",
			"padding": {
				"bottom": "119px",
				"left": "49px",
				"right": "49px",
				"top": "119px"
			}
		}
	},
}
```

----

## Typography

### Font Face

This is an example of how a font face is referenced in a `theme.json` file:

```json
{
	"$schema": "https://schemas.wp.org/wp/6.9/theme.json",
	"version": 3,
	"settings": {
		"typography": {
			"fontFamilies": [
				{
					"fontFace": [
						{
							"fontFamily": "Inter",
							"fontStyle": "normal",
							"fontWeight": "300",
							"src": [
								"file:./assets/fonts/inter/inter-300-normal.woff2"
							]
						}
						{
							"fontFamily": "Inter",
							"fontStyle": "italic",
							"fontWeight": "300",
							"src": [
								"file:./assets/fonts/inter/inter-300-italic.woff2"
							]
						}
					],
					"fontFamily": "Inter, sans-serif",
					"name": "Inter",
					"slug": "inter"
				}
			]
		}
	},
}
```

### Default Font Sizes

We can override default font size, and apply fluid typography. There are 4 default sizes, as shown in the example below. In order to use fluid typography we must set `"fluid": true,`. Optionally, use `"defaultFontSizes": false,` to hide WordPress's default sizes.

When fontSize tokens are defined, component2block automatically sets `"fluid": true` in the generated theme.json. The `defaultFontSizes` option is left to the theme developer to configure manually if needed.

```json
{
	"$schema": "https://schemas.wp.org/wp/6.9/theme.json",
	"version": 3,
	"settings": {
		"typography": {
            "fluid": true,
			"fontSizes": [
				{
					"fluid": {
						"max": "1rem",
						"min": "0.875rem"
					},
					"name": "Small",
					"size": "1rem",
					"slug": "small"
				},
				{
					"fluid": {
						"max": "1.125rem",
						"min": "1rem"
					},
					"name": "Medium",
					"size": "1.125rem",
					"slug": "medium"
				},
				{
					"fluid": {
						"max": "1.25rem",
						"min": "1.125rem"
					},
					"name": "Large",
					"size": "1.25rem",
					"slug": "large"
				},
				{
					"fluid": {
						"max": "1.5rem",
						"min": "1.25rem"
					},
					"name": "X-Large",
					"size": "1.5rem",
					"slug": "x-large"
				}
			]
		}
	},
}
```

### Add Font Sizes

We do not have to replace defaults, we can add new ones, as shown below. There are 4 default sizes. In order to use fluid typography we must set `"fluid": true,`.

Note: by adding `"defaultFontSizes": false,` in this configuration only our custom sizes would be available.


```json
{
	"$schema": "https://schemas.wp.org/wp/6.9/theme.json",
	"version": 3,
	"settings": {
		"typography": {
            "fluid": true,
			"fontSizes": [
				{
					"fluid": {
						"max": "14px",
						"min": "10px"
					},
					"name": "New Font Size 1",
					"size": "10px",
					"slug": "custom-1"
				}
			]
		}
	},
}
```

----

## Spacing

### Default Spacing Sizes

Add
```json
{
	"$schema": "https://schemas.wp.org/wp/6.9/theme.json",
	"version": 3,
	"settings": {
		"spacing": {
            "spacingSizes": [
                {
                    "name": "2X-Small",
                    "slug": "20",
                    "size": "clamp(0.33rem, 0.25rem + 0.25vw, 0.44rem)"
                },
                {
                    "name": "X-Small",
                    "slug": "30",
                    "size": "clamp(0.5rem, 0.4rem + 0.5vw, 0.67rem)"
                },
                {
                    "name": "Small",
                    "slug": "40",
                    "size": "clamp(0.8rem, 0.7rem + 0.5vw, 1rem)"
                },
                {
                    "name": "Medium",
                    "slug": "50",
                    "size": "clamp(1.2rem, 1rem + 1vw, 1.5rem)"
                },
                {
                    "name": "Large",
                    "slug": "60",
                    "size": "clamp(1.6rem, 1rem + 2vw, 2.25rem)"
                },
                {
                    "name": "X-Large",
                    "slug": "70",
                    "size": "clamp(2.2rem, 1.5rem + 3vw, 3.38rem)"
                },
                {
                    "name": "2X-Large",
                    "slug": "80",
                    "size": "clamp(3rem, 2rem + 4vw, 5.06rem)"
                }
            ]
		}
	},
}
```

### Add Spacing Sizes

Add
```json
{
	"$schema": "https://schemas.wp.org/wp/6.9/theme.json",
	"version": 3,
	"settings": {
		"spacing": {
            "spacingSizes": [
                {
                    "name": "Sub-Heading",
                    "slug": "20",
                    "size": "clamp(0.33rem, 0.25rem + 0.25vw, 0.44rem)"
                },
                {
                    "name": "Footnote",
                    "slug": "30",
                    "size": "clamp(0.5rem, 0.4rem + 0.5vw, 0.67rem)"
                }
            ]
		}
	},
}
```

### Additional Config

Add
```json
{
	"$schema": "https://schemas.wp.org/wp/6.9/theme.json",
	"version": 3,
	"settings": {
		"spacing": {
            "defaultSpacingSizes": true,
            "customSpacingSize": true,
            "spacingSizes": []
		}
	},
}
```

----

## c2b.config.json Format

The `c2b.config.json` file uses a simplified format that generates both CSS tokens for the component library and WordPress theme.json presets.

### Config Structure

Categories are defined at the top level (no `tokens` wrapper needed):

```json
{
  "prefix": "starter",
  "tokensPath": "src/styles/tokens.css",
  "outDir": "dist/wp",

  "color": { ... },
  "gradient": { ... },
  "fontFamily": { ... },
  "fontSize": { ... },
  "shadow": { ... },
  "spacing": { ... },
  "layout": { ... },
  "fontWeight": { ... },
  "lineHeight": { ... },
  "radius": { ... },
  "transition": { ... },
  "zIndex": { ... }
}
```

### Auto-derived Fields

The config automatically derives `slug` and `name` from the token key:

- **slug**: Uses the token key directly (e.g., `"primary"` → slug `"primary"`)
- **name**: Title-cases the key (e.g., `"primary-hover"` → name `"Primary Hover"`)

You can override either when needed:

```json
"color": {
  "primary": "#0073aa",
  "primary-hover": { "value": "#005a87", "name": "Primary Hover State" }
}
```

### String Shorthand

For simple tokens, use a string value directly instead of `{ "value": "..." }`:

```json
"fontWeight": {
  "normal": "400",
  "bold": "700"
}

"color": {
  "primary": "#0073aa",
  "secondary": "#23282d"
}
```

### Category Mapping

| Config Key   | Internal Category  | theme.json Path                |
|--------------|-------------------|--------------------------------|
| `color`      | `colorPalette`    | `settings.color.palette`       |
| `gradient`   | `colorGradient`   | `settings.color.gradients`     |
| `fontFamily` | `fontFamily`      | `settings.typography.fontFamilies` |
| `fontSize`   | `fontSize`        | `settings.typography.fontSizes` |
| `shadow`     | `shadow`          | `settings.shadow.presets`      |
| `spacing`    | `spacing`         | `settings.spacing.spacingSizes` |
| `layout`     | `layout`          | `settings.layout`              |
| `fontWeight` | `fontWeight`      | `settings.custom.fontWeight`   |
| `lineHeight` | `lineHeight`      | `settings.custom.lineHeight`   |
| `radius`     | `radius`          | `settings.custom.radius`       |
| `transition` | `transition`      | `settings.custom.transition`   |
| `zIndex`     | `zIndex`          | *(excluded from theme.json)*   |

### Complete Example

```json
{
  "prefix": "starter",
  "tokensPath": "src/styles/tokens.css",
  "outDir": "dist/wp",

  "layout": {
    "content-size": "768px",
    "wide-size": "1280px"
  },

  "color": {
    "primary": "#0073aa",
    "primary-hover": "#005a87",
    "secondary": "#23282d",
    "success": "#00a32a",
    "warning": "#dba617",
    "error": "#d63638"
  },

  "gradient": {
    "gradient-1": {
      "value": "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
      "slug": "custom-gradient-1"
    }
  },

  "fontFamily": {
    "inter": {
      "value": "Inter, sans-serif",
      "fontFace": [
        { "weight": "400", "style": "normal", "src": "inter-400-normal.woff2" },
        { "weight": "700", "style": "normal", "src": "inter-700-normal.woff2" }
      ]
    },
    "system": "-apple-system, BlinkMacSystemFont, sans-serif"
  },

  "fontSize": {
    "small":  { "value": "1rem",   "fluid": { "min": "0.875rem", "max": "1rem" } },
    "medium": { "value": "1.125rem", "fluid": { "min": "1rem", "max": "1.125rem" } },
    "large":  { "value": "1.25rem",  "fluid": { "min": "1.125rem", "max": "1.25rem" } }
  },

  "shadow": {
    "natural": "6px 6px 9px rgba(0, 0, 0, 0.2)",
    "deep": "12px 12px 50px rgba(0, 0, 0, 0.4)"
  },

  "fontWeight": {
    "normal": "400",
    "bold": "700"
  }
}
```

### Generated Output

Running `npm run generate` produces:

| File | Description |
|------|-------------|
| `src/styles/tokens.css` | CSS custom properties for Storybook/local dev |
| `src/styles/fonts.css` | @font-face declarations (if fontFace defined) |
| `dist/wp/tokens.wp.css` | CSS with WordPress preset fallbacks |
| `dist/wp/theme.json` | WordPress theme.json presets |
| `dist/wp/integrate.php` | PHP filter for plugin integration |
| `dist/wp/assets/fonts/` | Font files copied from `public/fonts/` |