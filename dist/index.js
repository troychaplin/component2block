import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { loadConfig } from './config.js';
import { generateTokensCss } from './generators/tokens-css.js';
import { generateTokensScss } from './generators/tokens-scss.js';
import { generateTokensWpCss } from './generators/tokens-wp-css.js';
import { generateThemeJson } from './generators/theme-json.js';
import { generateIntegratePhp } from './generators/integrate-php.js';
import { generateFontsCss } from './generators/fonts-css.js';
import { generateBaseStylesCss } from './generators/base-styles-css.js';
import { generateLayoutCss } from './generators/layout-css.js';
import { generateTypographyCss } from './generators/typography-css.js';
import { copyFontFiles } from './generators/copy-fonts.js';
import { generateTokensJs, generateTokensDts } from './generators/tokens-js.js';
export { loadConfig, validateConfig } from './config.js';
export { generateTokensCss } from './generators/tokens-css.js';
export { generateTokensScss } from './generators/tokens-scss.js';
export { generateTokensWpCss } from './generators/tokens-wp-css.js';
export { generateThemeJson } from './generators/theme-json.js';
export { generateIntegratePhp } from './generators/integrate-php.js';
export { generateFontsCss } from './generators/fonts-css.js';
export { generateBaseStylesCss } from './generators/base-styles-css.js';
export { generateLayoutCss } from './generators/layout-css.js';
export { generateTypographyCss } from './generators/typography-css.js';
export { copyFontFiles } from './generators/copy-fonts.js';
export { generateTokensJs, generateTokensDts } from './generators/tokens-js.js';
export function generate(configPath, cwd) {
    const config = loadConfig(configPath);
    const baseDir = cwd ?? process.cwd();
    const files = [];
    const write = (relativePath, content) => {
        const fullPath = resolve(baseDir, relativePath);
        mkdirSync(dirname(fullPath), { recursive: true });
        writeFileSync(fullPath, content, 'utf-8');
        files.push({ path: relativePath, size: content.length });
    };
    // Aggregate CSS parts collected in source order for emitAggregate.
    const aggregateParts = [];
    // Dual-output helper: write the same CSS file into both srcDir (for the
    // local build, e.g. Storybook / Next) and outputDir (for the WP context).
    // Skips writing when the generator returns null/empty.
    const writeDual = (filename, content) => {
        if (!content)
            return;
        write(join(config.srcDir, filename), content);
        write(`${config.outputDir}/${filename}`, content);
        if (config.emitScssAlongside && filename.endsWith('.css')) {
            const scssFilename = filename.replace('.css', '.scss');
            write(join(config.srcDir, scssFilename), content);
            write(`${config.outputDir}/${scssFilename}`, content);
        }
        if (config.emitAggregate && filename.endsWith('.css')) {
            aggregateParts.push(content.trimEnd());
        }
    };
    // CSS outputs that ship to both contexts
    writeDual('tokens.css', generateTokensCss(config));
    writeDual('base-styles.css', generateBaseStylesCss(config));
    writeDual('layout.css', generateLayoutCss(config));
    writeDual('typography.css', generateTypographyCss(config));
    // Aggregate stylesheet — all CSS outputs combined in source order.
    // Routed to wpTheme when set (lives alongside theme-rds.json / integrate.php),
    // otherwise falls back to outputDir.
    if (config.emitAggregate && aggregateParts.length > 0) {
        const aggregate = aggregateParts.join('\n\n') + '\n';
        const aggregateOut = config.wpTheme ?? config.outputDir;
        write(join(config.srcDir, 'styles.css'), aggregate);
        write(`${aggregateOut}/styles.css`, aggregate);
        if (config.emitScssAlongside) {
            write(join(config.srcDir, 'styles.scss'), aggregate);
            write(`${aggregateOut}/styles.scss`, aggregate);
        }
    }
    // JS tokens — srcDir for local dev, outputDir for package consumers
    const tokensJs = generateTokensJs(config);
    const tokensDts = generateTokensDts(config);
    write(join(config.srcDir, 'tokens.js'), tokensJs);
    write(join(config.srcDir, 'tokens.d.ts'), tokensDts);
    write(`${config.outputDir}/tokens.js`, tokensJs);
    write(`${config.outputDir}/tokens.d.ts`, tokensDts);
    // SCSS variables — compile-time only, srcDir only. Opt-in per category.
    const tokensScss = generateTokensScss(config);
    if (tokensScss) {
        write(join(config.srcDir, '_variables.scss'), tokensScss);
    }
    // Generate fonts.css if fontFace entries exist
    const fontsCss = generateFontsCss(config);
    if (fontsCss) {
        if (config.fontsDir) {
            // Write fonts.css alongside font files (e.g. public/fonts.css) for static serving
            const fontsDirParent = dirname(config.fontsDir);
            write(join(fontsDirParent, 'fonts.css'), fontsCss);
        }
        else {
            // No fontsDir — write to srcDir as before
            write(join(config.srcDir, 'fonts.css'), fontsCss);
        }
    }
    // Bundle font files and generate outputDir-level fonts.css for published package
    if (config.fontsDir && config.bundleFonts) {
        const distFontsCss = generateFontsCss(config, './fonts');
        if (distFontsCss) {
            const distRoot = dirname(config.outputDir);
            write(join(distRoot, 'fonts.css'), distFontsCss);
            const copied = copyFontFiles(config, resolve(baseDir, distRoot), baseDir);
            files.push(...copied);
        }
    }
    // WP-only outputs — routed to wpTheme when set, otherwise outputDir
    const wpOut = config.wpTheme ?? config.outputDir;
    if (config.themeable) {
        write(`${wpOut}/tokens.wp.css`, generateTokensWpCss(config));
    }
    write(`${wpOut}/theme-${config.prefix}.json`, generateThemeJson(config));
    write(`${wpOut}/integrate.php`, generateIntegratePhp(config.prefix));
    return { files };
}
//# sourceMappingURL=index.js.map