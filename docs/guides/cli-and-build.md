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

## Testing Local Changes in a Consuming Project

When iterating on component2block itself, you can test changes in a consuming project (for example a component library or WordPress block theme) without publishing a new version to npm. The workflow uses `pnpm link --global` to replace the installed package with a symlink to your local checkout, and `tsc --watch` to rebuild on every save.

### One-time setup

Run these commands once per session (or any time you re-clone either repo):

```bash
# 1. In the component2block checkout: build once, then expose it globally
cd ~/path/to/component2block
pnpm run build
pnpm link --global

# 2. In the consuming project: replace the installed package with the symlink
cd ~/path/to/consuming-project
pnpm link --global @troychaplin/component2block
```

The consuming project's `node_modules/@troychaplin/component2block` now points at your local checkout. Any `import` statement — and the `c2b` CLI binary on `$PATH` — resolves to the linked code.

### Fast iteration loop

In one terminal, keep TypeScript rebuilding:

```bash
cd ~/path/to/component2block
pnpm run dev       # tsc --watch — recompiles src/ → dist/ on save
```

In another terminal, run whatever you're testing in the consuming project:

```bash
cd ~/path/to/consuming-project
npx c2b generate   # or pnpm run generate, or whatever script uses c2b
```

Edit source in `component2block/src/`, save, and the next `c2b` invocation in the consuming project picks up the change. No republishing, no version bumps, no `pnpm install` gymnastics.

### Unlinking when you're done

```bash
# In the consuming project
cd ~/path/to/consuming-project
pnpm unlink @troychaplin/component2block
pnpm install    # re-install the published version from npm

# In the component2block checkout (optional — cleans up the global symlink)
cd ~/path/to/component2block
pnpm unlink --global
```

### Gotchas

- **`dist/` must exist and be fresh.** The consuming project loads compiled JS from `dist/`, not TypeScript source. Running `pnpm run dev` in `component2block` keeps it fresh; if you stop the watcher, remember to run `pnpm run build` before testing again.
- **Don't commit `package.json` changes in the consuming project** when using `pnpm link`. Unlike `pnpm add file:../component2block`, `pnpm link` doesn't rewrite `package.json`, so there's nothing to accidentally commit — but if the consuming project's `package.json` does get touched, revert it before pushing.
- **Workflow replaces the need for pre-release publishing.** Previously the only way to test pre-release c2b changes in a real project was to bump the version, publish to npm, and install the new version in the consumer. With `pnpm link --global` you skip all of that and only cut an actual release (via `pnpm run release <version>`) once the changes are verified.

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
