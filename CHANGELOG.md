# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Prefix the change with one of these keywords:

- _Added_: for new features.
- _Changed_: for changes in existing functionality.
- _Deprecated_: for soon-to-be removed features.
- _Improved_: for enhancements to code or architecture.
- _Removed_: for now removed features.
- _Fixed_: for any bug fixes.
- _Security_: in case of vulnerabilities.

## [Unreleased]

## [0.4.0] - 2026-04-27

### Added

- New `baseStyles.h1`–`h6` `marginBlockStart` property defining each heading's top margin within constrained-layout flow. Resolves against `tokens.spacing` (or accepts a raw CSS value). Emitted as `:where(.is-layout-constrained) > * + hN { margin-block-start: ... }` in `base-styles.scss` (specificity beats the block-gap rule; first-child headings fall through to the `:first-child` reset) and as `styles.elements.{hN}.spacing.margin.top` preset reference in `theme.json` so block-editor spacing controls pick up the defaults.
- New `baseStyles.spacing.afterHeading` property tightening the gap between a heading and the next sibling, emitted as `:where(.is-layout-constrained) > :where(h1, h2, h3, h4, h5, h6) + * { margin-block-start: ... }`. Source-order-emitted after the block-gap rule (specificity ties on `(0,0,0)`). Sibling-selector — not expressible in `theme.json`, so lives in CSS only.
- New `baseStyles.spacing.listItem` property setting `<li>` rhythm via `li + li { margin-block-start: ... }`. List items aren't direct children of `.is-layout-constrained`, so the block-gap rule doesn't apply to them — this is the path to a tighter list-internal cadence than top-level block flow.
- New `typography.css` output written alongside `tokens.css` in `themeDir`. Carries the same flow-spacing rules as `base-styles.scss` (per-heading top margin, after-heading tightening, `li + li` rhythm) as plain CSS for WordPress contexts. **Not** auto-enqueued by `integrate.php` — consumers import it manually so they retain control over which CSS chunks land in the document. Skipped entirely when no flow-spacing properties are configured.

## [0.3.1] - 2026-04-22

### Added

- Opt-in `_variables.scss` output for compile-time SCSS contexts (e.g. `@media` queries, SCSS math) where CSS custom properties don't work. Controlled by a new `output.scssVars` array listing which token categories to emit — e.g. `"scssVars": ["mediaQuery", "spacing"]`. Emits `$prefix-segment-key: value;` per entry, grouped by category in registry order, with the same fluid `clamp()` handling and `camelToKebab` conversion (layout) as the CSS generator. Omit or set to `[]` to skip the file entirely. Unknown category names throw at config load time.
- New `mediaQuery` token category for breakpoint values. SCSS-only by design — excluded from `tokens.css`, `tokens.wp.css`, and `theme.json` so breakpoints never leak into outputs where they'd have no meaning. Only reachable via `output.scssVars: ["mediaQuery"]`.
- `CategoryDef.scssOnly` flag in the category registry, honored by every non-SCSS generator. Adding future SCSS-only categories is a one-line change.

## [0.3.0] - 2026-04-22

### Added

- New `_tokens.scss` output written alongside `tokens.css` in `srcDir`. Emits the same tokens as SCSS variables (`$prefix-segment-key: value;`) so consumers can reference tokens inside `@media` queries and other compile-time SCSS contexts where CSS custom properties can't be used. Always on — no opt-out needed. Mirrors the CSS output: same category grouping, same fluid `clamp()` handling, same `camelToKebab` conversion for layout keys, includes `cssOnly` entries (SCSS is another compile-time output).


## [0.2.7] - 2026-04-14

### Changed

- Generated theme.json is now named `theme-{prefix}.json` (e.g. `theme-rds.json`), using the `prefix` value from the config. The `integrate.php` template references are updated dynamically to match.

## [0.2.6] - 2026-04-13

### Added

- Token output reference table in `docs/guides/tokens.md` showing which CSS variable namespaces (`--your-prefix--*`, `--wp--preset--*`, `--wp--custom--*`) each category generates.

### Fixed

- Generated `theme.json` now includes `customSpacingSize: false` and `defaultSpacingSizes: false` when spacing tokens are defined. Without these flags, WordPress auto-generates a spacing scale using its own multiplier algorithm, overriding explicit `spacingSizes` values — including responsive `min()` expressions — with static computed values.

## [0.2.5] - 2026-04-12

### Added

- `output.fontsDir` option to specify where font source files live (e.g. `public/fonts`). When set, c2b copies `.woff2` files to dist and generates two `fonts.css` outputs with different URL paths.
- `output.bundleFonts` option (defaults to `true` when `fontsDir` is set) to control whether font files are bundled in dist.

### Changed

- Renamed `output.tokensPath` to `output.srcDir` — now accepts a directory path (default: `src/styles`) instead of a file path. The `tokens.css` filename is hardcoded internally, consistent with how `fonts.css` and `base-styles.scss` are handled.
- Renamed `output.wpDir` to `output.themeDir`.
- Renamed `output.wpThemeable` to `output.themeable`.
- `generateFontsCss()` now accepts an optional `basePath` parameter to control the URL prefix in `@font-face` declarations.
- When `fontsDir` is set, the dev-facing `fonts.css` is written to the parent of `fontsDir` (e.g. `public/fonts.css`) for static serving, instead of `srcDir`. This avoids Vite mangling font URLs during CSS processing. Without `fontsDir`, `fonts.css` is still written to `srcDir` as before.

### Removed

- Deprecated root-level config keys (`tokensPath`, `outDir`, `wpThemeable`). All output settings must now use the `output` wrapper.

## [0.2.4] - 2026-04-12

### Fixed

- Added `README.md` to the `files` array in `package.json` so it is included in the published npm package and displayed on the npm registry page.

## [0.2.3] - 2026-04-12

### Changed

- Fluid typography rounding precision changed from 4 decimal places to 3, matching Gutenberg's `roundToPrecision(value, 3)`. Rates like `0.2083` now emit as `0.208`, producing byte-for-byte identical `clamp()` values to WordPress.
- `fluid.maxViewport` now automatically falls back to `layout.wideSize` when not explicitly set, mirroring how WordPress/Gutenberg uses `settings.layout.wideSize` as the max viewport for fluid typography calculations. Resolution order: explicit `fluid.maxViewport` > `layout.wideSize` from tokens > `1600px` default.

## [0.2.2] - 2026-04-11

### Added

- `pnpm run release <version>` command (`scripts/release.mjs`) that moves `CHANGELOG.md` `[Unreleased]` entries into a dated section, bumps `package.json`, refreshes `pnpm-lock.yaml`, runs tests and build, and creates a `release: <version>` commit and tag. Verifies the active Node version matches `.nvmrc` up front so a stale Node version can't produce a half-finished release.
- Optional top-level `fluid` config section for fluid typography viewport anchors: `{ "fluid": { "minViewport": "320px", "maxViewport": "1600px" } }`. Both fields default to WordPress's conventional values and must be CSS lengths with a `px` unit. When a non-default range is set, it also propagates to `settings.typography.fluid` in the generated `theme.json` so WordPress's own fluid calculations stay in sync.

### Changed

- `settings.typography.fluid` in generated `theme.json` is now always an explicit `{ minViewportWidth, maxViewportWidth }` object rather than `true`. This forces WordPress to use the exact same viewport anchors as `buildFluidClamp()`, so the `clamp()` WordPress writes into `:root` from theme.json matches the one in our `tokens.css` / `tokens.wp.css` byte-for-byte. Previously a `true` value let WP pick its own defaults, which have drifted between versions and produced visibly different `clamp()` values in the same `:root`.

### Fixed

- Fluid font-size `clamp()` output was mathematically broken: the denominator had no unit, so `(100vw - 320px) / 1280` resolved to a length instead of a unit-free ratio, and the scaling constant was a bare number instead of a rem delta. The result: fluid tokens stayed pinned near their minimum value and never actually scaled with the viewport. The generator now emits `clamp(<min>, <min> + ((1vw - <minVwRem>rem) * <rate>), <max>)` — the same shape WordPress emits from `settings.typography.fluid` — so c2b tokens and WP-generated tokens in the same `:root` match byte-for-byte when the viewport anchors agree. Fluid output is restricted to `rem` and `em` tokens (matching WordPress); `px` fluid ranges now fall back to the static value. Regression coverage includes a test that evaluates the emitted formula across several viewport widths and asserts it actually interpolates between min and max, plus a byte-for-byte parity test against a known WordPress reference output.

## [0.2.1] - 2026-04-11

### Changed

- Renamed the generated base typography file from `_content-generated.scss` to `base-styles.scss`. Authored `content.scss` files should update their import to `@use 'base-styles'`.

### Fixed

- `baseStyles` values like `6x-large` that reference an undefined font-size token no longer slip through validation and emit bare identifiers in the generated SCSS. `looksLikeRawValue` now only classifies real CSS numeric/length values as raw, so undefined token references are caught by `validateBaseStyles()` and fail the build with a clear error.

## [0.2.0] - 2026-04-10

### Added

- Strict `baseStyles` validation. Every string in `baseStyles` is classified at config load time against its expected token category, so typos and stale token references throw with the context path (`baseStyles.body.color`), the property, the expected category, the available keys, and any allowed CSS keywords — before any files are written.
- Per-property classifier (`classifyBaseStyleValue`) with `PROPERTY_CATEGORY` and `CSS_KEYWORDS` tables, plus dedicated `resolveBaseStyleValueForScss` / `resolveBaseStyleValueForThemeJson` resolvers that route every `baseStyles` value through the same strict path.
- `tokens` and `output` wrapper format for `c2b.config.json`. Token categories now live under a `tokens` key and output paths/flags under an `output` key. Legacy flat format still loads for backwards compatibility.
- `INPUT_CATEGORY_MAP` so user-facing category names (`color`, `gradient`) map to internal category names (`colorPalette`, `colorGradient`).
- String shorthand for token entries in preset-capable categories (auto-derives `slug`/`name`) and custom-only categories (CSS-only).
- Fluid shorthand `{ "min": "...", "max": "..." }` for `fontSize` entries, expanding to `clamp()` values.

### Changed

- Unified `cssOnly` semantics across every generator: `cssOnly: true` now means "CSS variable only, never in WordPress" consistently — including exclusion from `settings.custom.*` in theme.json and fallback to the underlying raw value when referenced from `baseStyles`.
- Individual headings (`h1`–`h6`) get `fontStyle: 'normal'` as a default via `ensureFontStyle()`. Strict per-property resolution ensures this cannot cross-resolve to a `fontWeight.normal` token.
- Replaced `package-lock.json` with `pnpm-lock.yaml`.

### Fixed

- GitHub Actions workflows.

## [0.1.3] - 2026-04-09

### Added

- `docs/guides/cli-and-build.md` commands and options tables covering `init`, `generate`, and `help`.

### Changed

- Rewrote the README Getting Started section to cover install → `init` → `generate` → build pipeline integration.
- Updated `docs/README.md` and `docs/advanced/ARCHITECTURE.md` to document the `init` command and current project structure.

## [0.1.2] - 2026-04-08

### Added

- Post-install instructions in the `c2b init` output: next steps, a `package.json` script snippet (`"c2b": "c2b generate"`), and how to run it.

## [0.1.1] - 2026-04-08

### Added

- `c2b init` command that scaffolds a `c2b.config.json` from the bundled `c2b.config.example.json` template, with an existing-file guard and tests.
- `c2b.config.example.json` shipped in the published package (added to the `files` array).
- `.nvmrc` pinning Node 22.

### Fixed

- npm publish workflow and package name.

## [0.1.0] - 2026-04-08

### Added

- Initial release of `@troychaplin/component2block`.
- CLI (`c2b generate`) and programmatic `generate()` API.
- Generators for `tokens.css`, `fonts.css`, `_content-generated.scss`, `tokens.wp.css`, `theme.json`, and `integrate.php`.
- Central `CATEGORY_REGISTRY` covering 12 token categories: color, gradient, spacing, fontFamily, fontSize, shadow, fontWeight, lineHeight, radius, transition, zIndex, and layout.
- `baseStyles` config section generating both zero-specificity SCSS (`:where()` selectors) and WordPress `theme.json` styles from the same data.
- Locked vs themeable mode (`wpThemeable` flag) controlling whether `tokens.wp.css` is generated and whether editor restrictions are applied.
- Storybook preset that auto-injects `tokens.css`, `fonts.css`, `reset.scss`, and `content.scss` into the preview iframe.
- Full documentation set under `docs/` (getting started, configuration reference, guides, WordPress integration, and architecture).