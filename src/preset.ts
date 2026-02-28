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

import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { loadConfig } from './config.js';

export function previewAnnotations(entry: string[] = []): string[] {
  try {
    const config = loadConfig();
    const stylesDir = dirname(resolve(config.tokensPath));

    const candidates = [
      resolve(config.tokensPath),
      join(stylesDir, 'fonts.css'),
      join(stylesDir, 'reset.scss'),
      join(stylesDir, 'content.scss'),
    ];

    return [...entry, ...candidates.filter(existsSync)];
  } catch {
    return entry;
  }
}
