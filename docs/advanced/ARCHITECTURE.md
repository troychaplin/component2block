# Architecture

This document describes the key design decisions and project structure of the `component2block` package.

## Key Design Decisions

- **Zero runtime dependencies** — Uses only Node.js built-ins
- **Pure generator functions** — Each generator takes config in, returns string out
- **TypeScript with ESM** — Compiled to `dist/` for consumption
- **Registry-driven** — `CATEGORY_REGISTRY` defines behavior for all categories
- **Template for PHP** — `integrate.php` is static, reads `theme.json` at runtime

## Project Structure

```
component2block/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts             # Main entry — exports programmatic API
│   ├── cli.ts               # CLI entry — npx c2b generate
│   ├── config.ts            # Reads + validates c2b.config.json
│   ├── types.ts             # TypeScript types and registry
│   ├── preset.ts            # Storybook preset (auto-injects styles)
│   └── generators/
│       ├── tokens-css.ts    # Generates tokens.css
│       ├── tokens-wp-css.ts # Generates tokens.wp.css
│       ├── theme-json.ts    # Generates theme.json
│       ├── fonts-css.ts     # Generates fonts.css
│       ├── content-scss.ts  # Generates _content-generated.scss
│       └── integrate-php.ts # Generates integrate.php
├── templates/
│   └── integrate.php.tpl    # PHP template
├── docs/
│   ├── getting-started/     # Installation, tokens, base styles, preset
│   └── advanced/            # Architecture, integrations, reference
└── tests/
    ├── config.test.ts
    ├── tokens-css.test.ts
    ├── tokens-wp-css.test.ts
    ├── theme-json.test.ts
    ├── fonts-css.test.ts
    ├── content-scss.test.ts
    └── integration.test.ts
```

## Supported Token Categories

| Category | theme.json Path | Editor UI |
|----------|----------------|-----------|
| `color` | `settings.color.palette` | Color picker |
| `gradient` | `settings.color.gradients` | Gradient picker |
| `spacing` | `settings.spacing.spacingSizes` | Spacing controls |
| `fontFamily` | `settings.typography.fontFamilies` | Font picker |
| `fontSize` | `settings.typography.fontSizes` | Size picker |
| `shadow` | `settings.shadow.presets` | Shadow picker |
| `layout` | `settings.layout` | Layout controls |
| `fontWeight` | `settings.custom.fontWeight` | CSS only |
| `lineHeight` | `settings.custom.lineHeight` | CSS only |
| `radius` | `settings.custom.radius` | CSS only |
| `transition` | `settings.custom.transition` | CSS only |
| `zIndex` | *(excluded)* | CSS only |
