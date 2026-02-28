# Component2Block (c2b)

A design token generator that reads a single `c2b.config.json` and produces CSS variables, WordPress theme.json, SCSS base styles, font-face declarations, and PHP integration hooks. Built for component libraries that target both Storybook/React and WordPress block themes.

## Architecture

### Generator Pipeline

`c2b.config.json` is the single source of truth. The CLI (`c2b generate`) loads config via `src/config.ts`, then calls each generator:

```
c2b.config.json → loadConfig() → C2bConfig (normalized)
  → generateTokensCss()      → tokens.css (CSS custom properties)
  → generateFontsCss()       → fonts.css (@font-face declarations)
  → generateContentScss()    → _content-generated.scss (base styles)
  → generateTokensWpCss()    → tokens.wp.css (WP preset mappings, only when wpThemeable: true)
  → generateThemeJson()      → theme.json (WordPress settings + styles)
  → generateIntegratePhp()   → integrate.php (PHP hooks, from template)
```

### Token Resolution

Two resolution functions in `src/config.ts` convert token key references to CSS variables:

- `resolveForScss(value, prefix, tokens, preferCategory?)` → `var(--{prefix}--{cssSegment}-{key})`
- `resolveForThemeJson(value, tokens, preferCategory?)` → `var(--wp--preset--{category}--{slug})`

Both use `resolveTokenRef()` internally. When a value matches a token key, it resolves; otherwise it passes through as a raw value. The `preferCategory` parameter disambiguates keys that exist in multiple categories (e.g. "large" in both spacing and fontSize).

### Category Registry

`CATEGORY_REGISTRY` in `src/types.ts` is the central registry. Each category defines: `cssSegment`, `label`, `order`, `themeJson` path, `wpPreset` prefix, `custom` key, `exclude` flag, and `directMap` flag. Adding a new category to this registry is all that's needed to support it across all generators.

User-facing category names map to internal names via `INPUT_CATEGORY_MAP` (e.g. `color` → `colorPalette`, `gradient` → `colorGradient`).

### Token Entry Types

- **Object with name/slug**: Registers as a WordPress preset (visible in Site Editor)
- **String shorthand** (`"bold": "700"`): CSS variable only, no preset
- **Object with `cssOnly: true`**: CSS variable only, keeps object format
- **Fluid**: `{ fluid: { min, max } }` generates `clamp()` values

### Base Styles

`baseStyles` in config generates two outputs from the same data:
- **SCSS**: `_content-generated.scss` with `body {}`, `:where()` rules (zero specificity)
- **theme.json**: `styles.typography`, `styles.color`, `styles.elements`, `styles.spacing`

Supported elements: `body`, `heading`, `h1`-`h6`, `caption`, `button`, `link`

Properties per element: `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `fontStyle`, `color`, `background`, `hoverColor` (link only)

Individual headings (h1-h6) get `fontStyle: 'normal'` default via `ensureFontStyle()` if not specified.

Link's `hoverColor` generates `:hover` pseudo-class in both theme.json (nested `":hover"` key) and SCSS (`:where(a:hover)` rule).

### Locked vs Themeable Mode

- **`wpThemeable: false`** (default): Hardcoded token values, `custom`/`customDuotone`/`customGradient` set to `false` in theme.json. integrate.php enforces layout lock and editor restrictions at theme layer.
- **`wpThemeable: true`**: Generates `tokens.wp.css` mapping to `--wp--preset--*` variables. No editor restrictions. Theme has full control.

Auto-detection in integrate.php: presence of `tokens.wp.css` = themeable, absence = locked.

### WordPress theme.json Cascade

5 layers: core defaults → library base (via `wp_theme_json_data_default`) → parent theme → child theme → user Global Styles. The library registers at the default layer so themes can override.

## File Structure

```
src/
  cli.ts              CLI entry point (c2b generate)
  index.ts            Programmatic API, generate() function
  config.ts           Config loading, validation, token resolution
  types.ts            Type system, category registry, utility functions
  preset.ts           Storybook preset (auto-injects CSS/SCSS)
  generators/
    tokens-css.ts     CSS custom properties (:root { --prefix--* })
    tokens-wp-css.ts  WordPress preset-mapped CSS variables
    theme-json.ts     WordPress theme.json (settings + styles)
    fonts-css.ts      @font-face declarations
    content-scss.ts   Base typography SCSS with :where() selectors
    integrate-php.ts  PHP integration (reads template)
    fluid.ts          Fluid clamp() calculation utility
templates/
  integrate.php.tpl   PHP template for WordPress integration
tests/
  config.test.ts      Config loading and validation (28 tests)
  tokens-css.test.ts  CSS token generation (14 tests)
  tokens-wp-css.test.ts  WP CSS generation (14 tests)
  theme-json.test.ts  theme.json generation (63 tests)
  fonts-css.test.ts   Font CSS generation (7 tests)
  content-scss.test.ts  SCSS generation (46 tests)
  preset.test.ts      Storybook preset (7 tests)
  integration.test.ts Full pipeline integration (12 tests)
```

## Conventions

### Naming
- Package: `component2block`
- CLI binary: `c2b`
- Config file: `c2b.config.json`
- PHP variables: `$c2b_*` prefix
- PHP handle: `c2b-tokens`
- WordPress asset path: `assets/c2b/`
- Internal config type: `C2bConfig` (normalized), input type: `C2bConfigInput` (user-facing)

### Code Style
- TypeScript with strict mode, ES modules (`"type": "module"`)
- No external runtime dependencies — Node.js built-ins only
- Generated file headers: `/* Auto-generated by component2block — do not edit manually */`
- PHP template uses tabs for indentation (WordPress standard)
- SCSS uses `:where()` for zero-specificity element selectors

### Testing
- Vitest with 191 tests across 8 files
- Unit tests per generator — each test creates its own `C2bConfig` inline
- Integration tests use temp directories with `beforeAll`/`afterAll` for setup/cleanup
- Test fixtures create `c2b.config.json` files in temp dirs
- Run: `npm test` from component2block directory

### Build
- `npm run build` compiles TypeScript to `dist/`
- `npm test` runs all tests
- The parent project runs `node component2block/dist/cli.js generate` to produce output

## Key Design Decisions

- **Zero-specificity content styles**: `:where()` selectors ensure component BEM classes always win over base typography without specificity battles
- **Two-layer content approach**: Generated `_content-generated.scss` (config-driven, regenerated) + authored `content.scss` (hand-written behavioral rules, never touched)
- **Token key resolution**: Same config value resolves differently per output — SCSS uses `--prefix--segment-key`, theme.json uses `--wp--preset--category--slug`
- **No default preset flags**: The generator never sets `defaultPalette`, `defaultGradients`, etc. — that's the theme's responsibility
- **Locked mode enforcement**: When `wpThemeable: false`, restrictions are enforced at the `wp_theme_json_data_theme` filter layer so themes can't override them
