# Storybook Preset

The `component2block` Storybook preset auto-injects all generated and authored style files into Storybook. No manual imports needed in `preview.ts`.

## Setup

Add the preset to your `.storybook/main.ts` addons:

```ts
// .storybook/main.ts
export default {
  addons: [
    '@storybook/addon-docs',
    '../component2block/dist/preset.js',
  ],
};
```

## What It Injects

The preset reads `c2b.config.json`, derives file paths from `tokensPath`, and injects any that exist:

| File | Description |
|------|-------------|
| `tokens.css` | CSS custom properties (generated) |
| `fonts.css` | @font-face declarations (generated, if fontFace defined) |
| `reset.scss` | Structural CSS reset (authored by you) |
| `content.scss` | Base typography — imports `_content-generated.scss` + your behavioral rules (authored by you) |

All paths are derived from the `tokensPath` config value. If `tokensPath` is `src/styles/tokens.css`, the preset looks for `src/styles/fonts.css`, `src/styles/reset.scss`, and `src/styles/content.scss` in the same directory.

## How It Works

The preset uses Storybook's `previewAnnotations` API to return file paths for auto-import. Each file path becomes an import in the Storybook preview iframe, making the styles available to all stories.

Files that don't exist on disk are silently skipped. For example, if you haven't defined any `fontFace` entries, `fonts.css` won't exist and the preset won't try to inject it.

## Verifying It Works

1. Start Storybook: `npm run dev`
2. Open browser dev tools on any story
3. Check that `tokens.css` variables are available on `:root`
4. Check that base typography from `_content-generated.scss` is applied to body and heading elements
5. Check that `@font-face` declarations from `fonts.css` are present (if you have font tokens)

## No Manual Imports Needed

With the preset configured, you do **not** need to import style files in `.storybook/preview.ts`. The preset handles all style injection automatically.

If you previously had manual imports like these in `preview.ts`, they can be removed:

```ts
// These are no longer needed — the preset handles them
// import '../src/styles/tokens.css';
// import '../src/styles/fonts.css';
// import '../src/styles/reset.scss';
// import '../src/styles/content.scss';
```
