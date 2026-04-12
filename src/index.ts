import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { loadConfig } from './config.js';
import { generateTokensCss } from './generators/tokens-css.js';
import { generateTokensWpCss } from './generators/tokens-wp-css.js';
import { generateThemeJson } from './generators/theme-json.js';
import { generateIntegratePhp } from './generators/integrate-php.js';
import { generateFontsCss } from './generators/fonts-css.js';
import { generateContentScss } from './generators/content-scss.js';
import { copyFontFiles } from './generators/copy-fonts.js';

export { loadConfig, validateConfig } from './config.js';
export { generateTokensCss } from './generators/tokens-css.js';
export { generateTokensWpCss } from './generators/tokens-wp-css.js';
export { generateThemeJson } from './generators/theme-json.js';
export { generateIntegratePhp } from './generators/integrate-php.js';
export { generateFontsCss } from './generators/fonts-css.js';
export { generateContentScss } from './generators/content-scss.js';
export { copyFontFiles } from './generators/copy-fonts.js';
export type { C2bConfig, C2bConfigInput, TokenEntry, TokenGroup, TokenCategory, FontFaceEntry, BaseStylesConfig } from './types.js';

export interface GenerateResult {
  files: Array<{ path: string; size: number }>;
}

export function generate(configPath?: string, cwd?: string): GenerateResult {
  const config = loadConfig(configPath);
  const baseDir = cwd ?? process.cwd();
  const files: GenerateResult['files'] = [];

  const write = (relativePath: string, content: string) => {
    const fullPath = resolve(baseDir, relativePath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, 'utf-8');
    files.push({ path: relativePath, size: content.length });
  };

  // Generate tokens.css for local dev (Storybook)
  write(join(config.srcDir, 'tokens.css'), generateTokensCss(config));

  // Generate fonts.css if fontFace entries exist
  const fontsCss = generateFontsCss(config);
  if (fontsCss) {
    if (config.fontsDir) {
      // Write fonts.css alongside font files (e.g. public/fonts.css) for static serving
      const fontsDirParent = dirname(config.fontsDir);
      write(join(fontsDirParent, 'fonts.css'), fontsCss);
    } else {
      // No fontsDir — write to srcDir as before
      write(join(config.srcDir, 'fonts.css'), fontsCss);
    }
  }

  // Generate base-styles.scss if baseStyles are defined
  const contentScss = generateContentScss(config);
  if (contentScss) {
    write(join(config.srcDir, 'base-styles.scss'), contentScss);
  }

  // Bundle font files and generate dist-level fonts.css for published package
  if (config.fontsDir && config.bundleFonts) {
    const distFontsCss = generateFontsCss(config, './fonts');
    if (distFontsCss) {
      const distRoot = dirname(config.themeDir);
      write(join(distRoot, 'fonts.css'), distFontsCss);
      const copied = copyFontFiles(config, resolve(baseDir, distRoot), baseDir);
      files.push(...copied);
    }
  }

  // Generate WordPress assets
  write(`${config.themeDir}/tokens.css`, generateTokensCss(config));
  if (config.themeable) {
    write(`${config.themeDir}/tokens.wp.css`, generateTokensWpCss(config));
  }
  write(`${config.themeDir}/theme.json`, generateThemeJson(config));
  write(`${config.themeDir}/integrate.php`, generateIntegratePhp());

  return { files };
}
