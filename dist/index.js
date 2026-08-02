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
import { exportSourceDir } from './export-src-dir.js';
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
export { exportSourceDir } from './export-src-dir.js';
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
    // Every filename c2b writes into srcDir carries the config prefix, so
    // generated files are visually distinguishable from hand-maintained files
    // living in the same directory. Leading underscore (Sass partial marker)
    // is preserved ahead of the prefix.
    const prefixed = (filename) => filename.startsWith('_') ? `_${config.prefix}-${filename.slice(1)}` : `${config.prefix}-${filename}`;
    // Write a generated CSS file into srcDir (+ .scss alongside, when enabled).
    // outputDir is populated later, wholesale, by exportSourceDir(). Skips
    // writing when the generator returns null/empty.
    const writeGenerated = (filename, content) => {
        if (!content)
            return;
        const outFilename = prefixed(filename);
        write(join(config.srcDir, outFilename), content);
        if (config.emitScssAlongside && filename.endsWith('.css')) {
            write(join(config.srcDir, outFilename.replace('.css', '.scss')), content);
        }
        if (config.emitAggregate && filename.endsWith('.css')) {
            aggregateParts.push(content.trimEnd());
        }
    };
    // CSS outputs
    writeGenerated('tokens.css', generateTokensCss(config));
    writeGenerated('base-styles.css', generateBaseStylesCss(config));
    writeGenerated('layout.css', generateLayoutCss(config));
    writeGenerated('typography.css', generateTypographyCss(config));
    // Aggregate stylesheet — all CSS outputs combined in source order. Always
    // written into srcDir; additionally routed to wpTheme when set, since that
    // directory isn't covered by the srcDir → outputDir export.
    if (config.emitAggregate && aggregateParts.length > 0) {
        const aggregate = aggregateParts.join('\n\n') + '\n';
        write(join(config.srcDir, prefixed('styles.css')), aggregate);
        if (config.emitScssAlongside) {
            write(join(config.srcDir, prefixed('styles.scss')), aggregate);
        }
        if (config.wpTheme) {
            write(`${config.wpTheme}/styles.css`, aggregate);
            if (config.emitScssAlongside) {
                write(`${config.wpTheme}/styles.scss`, aggregate);
            }
        }
    }
    // JS tokens — srcDir only; outputDir gets its copy via exportSourceDir()
    const tokensJs = generateTokensJs(config);
    const tokensDts = generateTokensDts(config);
    write(join(config.srcDir, prefixed('tokens.js')), tokensJs);
    write(join(config.srcDir, prefixed('tokens.d.ts')), tokensDts);
    // SCSS variables — compile-time only, srcDir only. Opt-in per category.
    const tokensScss = generateTokensScss(config);
    if (tokensScss) {
        write(join(config.srcDir, prefixed('_variables.scss')), tokensScss);
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
            write(join(config.srcDir, prefixed('fonts.css')), fontsCss);
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
    // Mirror srcDir into outputDir wholesale — picks up every generated file
    // above plus any hand-maintained files the user placed in srcDir.
    files.push(...exportSourceDir(config, baseDir));
    return { files };
}
//# sourceMappingURL=index.js.map