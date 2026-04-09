# CLI & Build

This page covers the command-line interface, build pipeline integration, and publishing setup. For the full config file reference, see [Configuration Reference](../config/README.md).

## CLI Reference

```bash
# Scaffold a starter config file
npx c2b init

# Generate from default config (./c2b.config.json)
npx c2b generate

# Generate from a custom config path
npx c2b generate --config path/to/config.json

# Preview output without writing files
npx c2b generate --dry-run
```

### Commands

| Command | Description |
|---------|-------------|
| `init` | Create a `c2b.config.json` from the example template |
| `generate` | Read config and generate all output files |
| `help` | Show usage information |

### Options (generate)

| Option | Description |
|--------|-------------|
| `--config <path>` | Path to config file (default: `./c2b.config.json`) |
| `--dry-run` | Output to stdout instead of writing files |

## Build Scripts

Add the generate step to your project's build pipeline:

```json
{
  "scripts": {
    "generate": "component2block generate",
    "dev": "npm run generate && storybook dev -p 6006",
    "build": "npm run generate && npm run build:lib && npm run build:css && npm run build:wp",
    "build:lib": "vite build",
    "build:css": "node scripts/build-css.js",
    "build:wp": "component2block generate"
  }
}
```

The generate step runs before both `dev` and `build` to ensure `tokens.css` exists when Storybook or Vite needs it. The `build:wp` step re-runs after `build:css` because Vite's `emptyDirBeforeWrite` clears the `dist/` directory.

## Publishing the Library

When publishing your component library to npm, include the WordPress assets in your package exports:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css",
    "./css/*": "./dist/css/*",
    "./wp/*": "./dist/wp/*"
  },
  "files": ["dist"]
}
```
