# Architecture

Design decisions, project structure, and internals of the `component2block` package.

## Design Decisions

- **Zero runtime dependencies** — Uses only Node.js built-ins (`fs`, `path`)
- **Pure generator functions** — Each generator takes config in, returns string out. No side effects.
- **Registry-driven** — `CATEGORY_REGISTRY` in `src/types.ts` defines behavior for all 12 token categories. Adding a new category to this registry enables it across every generator automatically.
- **TypeScript with ESM** — Strict mode, ES modules, compiled to `dist/` for consumption
- **Template for PHP** — `integrate.php` is generated from a template (`templates/integrate.php.tpl`). The PHP reads `theme.json` at runtime — no hardcoded values baked in.
- **Zero-specificity content styles** — `:where()` selectors ensure component BEM classes always win over base typography
- **Two-layer content approach** — Generated `_content-generated.scss` (config-driven, regenerated) + authored `content.scss` (hand-written behavioral rules, never touched)
- **No default preset flags** — The generator never sets `defaultPalette`, `defaultGradients`, etc. — that's the theme's responsibility
- **Locked mode enforcement** — When `wpThemeable: false`, restrictions are enforced at the `wp_theme_json_data_theme` filter layer so themes can't override them

## Project Structure

```
component2block/
├── package.json
├── tsconfig.json
├── c2b.config.json              Example config / project config
├── src/
│   ├── cli.ts                   CLI entry point (npx c2b generate)
│   ├── index.ts                 Programmatic API, generate() function
│   ├── config.ts                Config loading, validation, token resolution
│   ├── types.ts                 Type system, category registry, utility functions
│   ├── preset.ts                Storybook preset (auto-injects CSS/SCSS)
│   └── generators/
│       ├── tokens-css.ts        :root { --prefix--category-key: value; }
│       ├── tokens-wp-css.ts     CSS vars mapped to --wp--preset--* with fallbacks
│       ├── theme-json.ts        WordPress theme.json builder
│       ├── fonts-css.ts         @font-face declarations
│       ├── content-scss.ts      Base typography with :where() selectors
│       ├── integrate-php.ts     Reads PHP template, writes output
│       └── fluid.ts             Fluid clamp() calculation utility
├── templates/
│   └── integrate.php.tpl        PHP template for WordPress integration
├── docs/
│   ├── README.md                Getting started & navigation hub
│   ├── config/                  Config reference and per-category guides
│   │   ├── README.md            Global fields, token categories, full example
│   │   ├── colors.md
│   │   ├── spacing.md
│   │   ├── shadow.md
│   │   ├── fonts.md
│   │   └── base-styles.md
│   ├── guides/                  Usage docs
│   │   ├── README.md
│   │   ├── tokens.md            Token syntax and categories
│   │   ├── markup.md            Layout class patterns
│   │   ├── storybook-preset.md  Storybook preset setup
│   │   └── cli-and-build.md     CLI, build scripts, publishing
│   ├── wordpress/               WordPress integration
│   │   ├── README.md
│   │   ├── integration.md       Theme setup
│   │   ├── theming.md           Locked vs themeable, overrides
│   │   ├── blocks.md            Block plugin setup
│   │   ├── editor-styles.md     Editor iframe styles
│   │   └── theme-json-reference.md
│   └── advanced/                Internals
│       ├── README.md
│       ├── architecture.md      This file
│       └── token-flow.md        Token resolution internals
└── tests/
    ├── config.test.ts           Config loading and validation
    ├── tokens-css.test.ts       CSS token generation
    ├── tokens-wp-css.test.ts    WP CSS generation
    ├── theme-json.test.ts       theme.json generation
    ├── fonts-css.test.ts        Font CSS generation
    ├── content-scss.test.ts     SCSS generation
    ├── preset.test.ts           Storybook preset
    └── integration.test.ts      Full pipeline integration
```

## Generator Pipeline

`c2b.config.json` is the single source of truth. The CLI (`c2b generate`) loads config via `src/config.ts`, then calls each generator:

```
c2b.config.json → loadConfig() → C2bConfig (normalized)
  → generateTokensCss()      → tokens.css
  → generateFontsCss()       → fonts.css (if fontFace present)
  → generateContentScss()    → _content-generated.scss (if baseStyles present)
  → generateTokensWpCss()    → tokens.wp.css (if wpThemeable: true)
  → generateThemeJson()      → theme.json
  → generateIntegratePhp()   → integrate.php
```

Each generator is a pure function: takes `C2bConfig` in, returns a string out. The `generate()` function in `src/index.ts` orchestrates calling them and writing files to disk.

## Category Registry

`CATEGORY_REGISTRY` in `src/types.ts` is the central registry. Each category entry defines:

| Property | Description |
|----------|-------------|
| `cssSegment` | CSS variable segment (e.g. `color`, `font-size`) |
| `label` | Human-readable label for comments |
| `order` | Sort order in generated output |
| `themeJson` | Path in theme.json settings (e.g. `color.palette`) |
| `wpPreset` | WordPress preset prefix for `--wp--preset--*` mapping |
| `custom` | Key under `settings.custom` for non-preset categories |
| `exclude` | When `true`, excluded from theme.json entirely (zIndex) |
| `directMap` | When `true`, maps directly to settings path (layout) |

User-facing category names map to internal names via `INPUT_CATEGORY_MAP` (e.g. `color` → `colorPalette`, `gradient` → `colorGradient`).

## Token Resolution

Two resolution functions in `src/config.ts` convert token key references to CSS variables:

- **`resolveForScss(value, prefix, tokens, preferCategory?)`** → `var(--{prefix}--{cssSegment}-{key})`
- **`resolveForThemeJson(value, tokens, preferCategory?)`** → `var(--wp--preset--{category}--{slug})`

Both use `resolveTokenRef()` internally. When a value matches a token key, it resolves to the appropriate variable reference. Otherwise, the raw value passes through unchanged.

The `preferCategory` parameter disambiguates keys that exist in multiple categories (e.g. `"large"` could match both `spacing` and `fontSize`).

See [Token Flow](./token-flow.md) for the full resolution walkthrough.

## Token Entry Types

- **Object with name/slug** — Registers as a WordPress preset (visible in Site Editor)
- **String shorthand** (`"bold": "700"`) — CSS variable only, no preset
- **Object with `cssOnly: true`** — CSS variable only, keeps object format
- **Fluid** (`{ fluid: { min, max } }`) — Generates `clamp()` values

## Testing

191 tests across 8 files using Vitest:

| Test file | Tests | Coverage |
|-----------|-------|----------|
| `config.test.ts` | 28 | Config loading, validation, token extraction |
| `tokens-css.test.ts` | 14 | CSS generation, fluid values |
| `tokens-wp-css.test.ts` | 14 | WordPress CSS variable mapping |
| `theme-json.test.ts` | 63 | Settings, styles, presets, fluid |
| `fonts-css.test.ts` | 7 | @font-face output |
| `content-scss.test.ts` | 46 | Selectors, declarations, padding/blockgap |
| `preset.test.ts` | 7 | Storybook preset file discovery |
| `integration.test.ts` | 12 | Full pipeline with temp directories |

Run with `npm test` from the component2block directory.
