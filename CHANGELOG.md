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