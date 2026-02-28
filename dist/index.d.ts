export { loadConfig, validateConfig } from './config.js';
export { generateTokensCss } from './generators/tokens-css.js';
export { generateTokensWpCss } from './generators/tokens-wp-css.js';
export { generateThemeJson } from './generators/theme-json.js';
export { generateIntegratePhp } from './generators/integrate-php.js';
export { generateFontsCss } from './generators/fonts-css.js';
export { generateContentScss } from './generators/content-scss.js';
export type { StbConfig, StbConfigInput, TokenEntry, TokenGroup, TokenCategory, FontFaceEntry, BaseStylesConfig } from './types.js';
export interface GenerateResult {
    files: Array<{
        path: string;
        size: number;
    }>;
}
export declare function generate(configPath?: string, cwd?: string): GenerateResult;
//# sourceMappingURL=index.d.ts.map