# Component2Block (c2b)

A design token generator that reads a single `c2b.config.json` and produces CSS variables, WordPress theme.json, SCSS base styles, font-face declarations, and PHP integration hooks. Built for component libraries that target both Storybook/React and WordPress block themes.

## Architecture

### Generator Pipeline

`c2b.config.json` is the single source of truth. The CLI (`c2b generate`) loads config via `src/config.ts`, then calls each generator:

```
c2b.config.json → loadConfig() → C2bConfig (normalized)
  → generateTokensCss()      → tokens.css (CSS custom properties)
  → generateFontsCss()       → fonts.css (@font-face declarations)
  → generateContentScss()    → base-styles.scss (base styles)
  → generateTokensWpCss()    → tokens.wp.css (WP preset mappings, only when themeable: true)
  → generateThemeJson()      → theme.json (WordPress settings + styles)
  → generateIntegratePhp()   → integrate.php (PHP hooks, from template)
  → copyFontFiles()          → dist/fonts/{slug}/ (copies .woff2 files when fontsDir + bundleFonts)
```

### Token Resolution

Two kinds of resolver live in `src/config.ts`:

**Generic resolvers** (legacy, used outside `baseStyles`):

- `resolveForScss(value, prefix, tokens, preferCategory?)` → `var(--{prefix}--{cssSegment}-{key})`
- `resolveForThemeJson(value, tokens, preferCategory?)` → `var(--wp--preset--{category}--{slug})`

These fall through to a raw value when the input doesn't match a token key, and use `preferCategory` to disambiguate keys that exist in multiple categories.

**Strict baseStyles resolvers** (used by `content-scss.ts` and `theme-json.ts` for every `baseStyles` value):

- `resolveBaseStyleValueForScss(value, property, prefix, tokens)`
- `resolveBaseStyleValueForThemeJson(value, property, tokens)`

Both delegate to `classifyBaseStyleValue(value, property, tokens)`, which is the single source of truth for how a `baseStyles` string is interpreted. Classification returns one of:

1. **token** — value matches a key in the property's expected token category. Looked up strictly in that category only (no cross-category fallback). Emits a CSS var in SCSS; emits a `--wp--preset--*` var in theme.json, or the underlying raw value for custom-only categories or `cssOnly` tokens.
2. **raw** — value is obviously a raw CSS value (numeric, hex, `var()`/`rgb()`/`calc()` function, multi-value stack, quoted string) **or** a known CSS keyword allowed for the property. Passes through unchanged.
3. **invalid** — anything else. Caught at config load time by `validateBaseStyles()` with a helpful error.

`PROPERTY_CATEGORY` maps baseStyles property names (`fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `color`, `background`, `hoverColor`, `padding`, `blockGap`) to their strict category. `fontStyle` has no token category and accepts only keywords or raw values.

`CSS_KEYWORDS` is a per-property whitelist of CSS keywords (`normal`, `italic`, `bold`, `inherit`, `sans-serif`, `transparent`, etc.). A token with the same key always wins over the keyword — so a `fontWeight.bold` token resolves to `var(--prefix--font-weight-bold)`, not the bare `bold` keyword.

### baseStyles Strict Validation

`validateBaseStyles(baseStyles, tokens)` walks every string value in `baseStyles` and calls the classifier. Any `invalid` result throws with the context path (`baseStyles.body.color`), the property, the expected token category, the list of available keys in that category, and the allowed CSS keywords. Called from `validateConfig()`, so dangling token refs and typos are caught before any files are written.

Example error:

```
Config error: baseStyles.body.color = "text-black" is not a valid token or CSS keyword for "color".
  Expected a token key from tokens.color (available: primary, black, white, grey-dark, ...).
  Or use one of these CSS keywords: inherit, transparent, currentColor, initial, unset.
  Or provide a raw CSS value (numeric, hex, rgb(), var(), calc(), multi-value, or quoted string).
```

### Category Registry

`CATEGORY_REGISTRY` in `src/types.ts` is the central registry. Each category defines: `cssSegment`, `label`, `order`, `themeJson` path, `wpPreset` prefix, `custom` key, `exclude` flag, and `directMap` flag. Adding a new category to this registry is all that's needed to support it across all generators.

User-facing category names map to internal names via `INPUT_CATEGORY_MAP` (e.g. `color` → `colorPalette`, `gradient` → `colorGradient`).

### Token Entry Types

- **String shorthand in a preset category** (`"primary": "#0073aa"`): registers as a WordPress preset with auto-derived `name`/`slug`.
- **String shorthand in a custom-only category** (`"bold": "700"`): CSS variable only, auto-flagged CSS-only because the category has no preset.
- **Object with `name`/`slug`**: registers as a WordPress preset with explicit overrides.
- **Object with `cssOnly: true`**: CSS variable only, regardless of category. See below.
- **Fluid**: `{ fluid: { min, max } }` or the shorthand `{ "min": "...", "max": "..." }` (fontSize only) generates `clamp()` values. The formula uses 3 decimal place rounding to match WordPress/Gutenberg exactly. The max viewport defaults to `layout.wideSize` (if defined in tokens), then falls back to `1600px`.

### Unified `cssOnly` Semantics

`cssOnly: true` means "emit this token as a CSS variable only, and never expose it to WordPress." That contract is honored identically across every category by every generator:

| Output | Effect of `cssOnly: true` |
|---|---|
| `tokens.css` | CSS var is emitted normally |
| `tokens.wp.css` (themeable mode) | CSS var is emitted with the hardcoded value, never with a `var(--wp--preset--*, fallback)` mapping |
| `theme.json` preset arrays (`settings.color.palette`, `settings.spacing.spacingSizes`, `settings.typography.fontSizes`, `settings.shadow.presets`, …) | Excluded |
| `theme.json` `settings.custom.*` | Excluded (including custom-only categories like `fontWeight`, `lineHeight`, `radius`, `transition`) |
| `baseStyles` reference → SCSS | Still resolves: emits `var(--{prefix}--{segment}-{key})` |
| `baseStyles` reference → theme.json `styles` | Falls back to the underlying raw value, because no `--wp--preset--*` var will exist in WordPress |

The exclusion logic for `settings.custom.*` lives in `theme-json.ts` (one `if (entry.cssOnly) continue;` guard in the custom loop). The fallback for baseStyles references lives in `resolveBaseStyleValueForThemeJson`, which only emits a preset var when `ref.wpPreset && ref.slug` are both truthy.

### Base Styles

`baseStyles` in config generates two outputs from the same data:
- **SCSS**: `base-styles.scss` with `body {}`, `:where()` rules (zero specificity)
- **theme.json**: `styles.typography`, `styles.color`, `styles.elements`, `styles.spacing`

Supported elements: `body`, `heading`, `h1`-`h6`, `caption`, `button`, `link`

Properties per element: `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `fontStyle`, `color`, `background`, `hoverColor` (link only)

Individual headings (h1-h6) get `fontStyle: 'normal'` default via `ensureFontStyle()` if not specified. Because strict resolution routes `fontStyle` through the (empty) `fontStyle` category and the `CSS_KEYWORDS` fallback, this default correctly emits bare `font-style: normal;` instead of cross-resolving to a `fontWeight.normal` token.

Link's `hoverColor` generates `:hover` pseudo-class in both theme.json (nested `":hover"` key) and SCSS (`:where(a:hover)` rule).

### Locked vs Themeable Mode

- **`themeable: false`** (default): Hardcoded token values, `custom`/`customDuotone`/`customGradient` set to `false` in theme.json. integrate.php enforces layout lock and editor restrictions at theme layer.
- **`themeable: true`**: Generates `tokens.wp.css` mapping to `--wp--preset--*` variables. No editor restrictions. Theme has full control.

Auto-detection in integrate.php: presence of `tokens.wp.css` = themeable, absence = locked.

### Font Bundling

When `output.fontsDir` is set (e.g. `public/fonts`), the generator can bundle font files into the dist output for package distribution. `output.bundleFonts` defaults to `true` when `fontsDir` is set.

The generate pipeline handles fonts in two passes:
1. Writes `srcDir/fonts.css` with `/fonts/...` paths (for Storybook/development use)
2. When `fontsDir` + `bundleFonts` are active, writes `dist/fonts.css` with `./fonts/...` relative paths and copies `.woff2` files from `fontsDir/{slug}/` to `dist/fonts/{slug}/`

`generateFontsCss()` accepts an optional `basePath` parameter (default `/fonts`) controlling the URL prefix in `@font-face` declarations. The dist-level `fonts.css` uses `./fonts` so paths are relative to the consuming theme.

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
    copy-fonts.ts     Font file copying from fontsDir to dist
    content-scss.ts   Base typography SCSS with :where() selectors
    integrate-php.ts  PHP integration (reads template)
    fluid.ts          Fluid clamp() calculation utility (3dp rounding, matches WP)
templates/
  integrate.php.tpl   PHP template for WordPress integration
tests/
  config.test.ts        Config loading, validation, baseStyles strict checks
  tokens-css.test.ts    CSS token generation
  tokens-wp-css.test.ts WP CSS generation
  theme-json.test.ts    theme.json generation, cssOnly exclusions
  fonts-css.test.ts     Font CSS generation
  content-scss.test.ts  SCSS generation, per-property resolution
  preset.test.ts        Storybook preset
  integration.test.ts   Full pipeline integration
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
- Vitest with 233+ tests across 9 files
- Unit tests per generator — each test creates its own `C2bConfig` inline
- Integration tests use temp directories with `beforeAll`/`afterAll` for setup/cleanup
- Test fixtures create `c2b.config.json` files in temp dirs
- Run: `npm test` from component2block directory

### Build
- `npm run build` compiles TypeScript to `dist/`
- `npm test` runs all tests
- The parent project runs `node component2block/dist/cli.js generate` to produce output

### Local testing in a consuming project
- `pnpm link /path/to/component2block` inside the consuming project to create a direct symlink — no global store needed
- Run `pnpm run dev` (tsc --watch) in component2block for a live rebuild loop
- See `docs/guides/cli-and-build.md` → "Testing Local Changes in a Consuming Project" for the full workflow, gotchas, and unlink steps

## Key Design Decisions

- **Zero-specificity content styles**: `:where()` selectors ensure component BEM classes always win over base typography without specificity battles
- **Two-layer content approach**: Generated `base-styles.scss` (config-driven, regenerated) + authored `content.scss` (hand-written behavioral rules, never touched)
- **Token key resolution**: Same config value resolves differently per output — SCSS uses `--prefix--segment-key`, theme.json uses `--wp--preset--category--slug`
- **Strict `baseStyles` validation**: Every string in `baseStyles` is classified at config load time as a token (strict per-property category lookup), raw CSS, or invalid. Typos and stale token references throw clearly-located errors before any files are written. No cross-category fallback — `fontStyle: "normal"` cannot accidentally resolve to `fontWeight.normal`.
- **Unified `cssOnly` contract**: `cssOnly: true` means "CSS variable only, never in WordPress" across every category and every generator — including `settings.custom.*` in theme.json.
- **No default preset flags**: The generator never sets `defaultPalette`, `defaultGradients`, etc. — that's the theme's responsibility
- **Locked mode enforcement**: When `themeable: false`, restrictions are enforced at the `wp_theme_json_data_theme` filter layer so themes can't override them
