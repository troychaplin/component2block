/**
 * Storybook Preset for component2block
 *
 * Auto-injects generated and authored style files into the Storybook preview.
 * Add to .storybook/main.ts addons array:
 *
 *   addons: ['../component2block/dist/preset.js']
 *
 * The preset reads c2b.config.json, derives file paths from tokensPath,
 * and injects any that exist: tokens.css, fonts.css, reset.scss, content.scss.
 */
export declare function previewAnnotations(entry?: string[]): string[];
//# sourceMappingURL=preset.d.ts.map