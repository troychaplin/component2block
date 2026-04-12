import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
/**
 * Copy font files listed in fontFace entries from fontsDir to a destination.
 *
 * Source structure: {baseDir}/{fontsDir}/{slug}/{filename}
 * Dest structure:   {destDir}/fonts/{slug}/{filename}
 *
 * Only files explicitly listed in fontFace[].src are copied — nothing is
 * auto-discovered. Returns the list of copied files with relative paths
 * (from destDir) and sizes.
 */
export function copyFontFiles(config, destDir, baseDir) {
    if (!config.fontsDir)
        return [];
    const group = config.tokens.fontFamily;
    if (!group)
        return [];
    const copied = [];
    for (const entry of Object.values(group)) {
        if (!entry.fontFace || !entry.slug)
            continue;
        for (const face of entry.fontFace) {
            const srcPath = resolve(baseDir, config.fontsDir, entry.slug, face.src);
            const relDest = join('fonts', entry.slug, face.src);
            const destPath = join(destDir, relDest);
            try {
                statSync(srcPath);
            }
            catch {
                throw new Error(`Font file not found: ${srcPath}\n` +
                    `  Expected by fontFamily "${entry.slug}" fontFace entry.\n` +
                    `  Ensure the file exists in ${resolve(baseDir, config.fontsDir, entry.slug)}/.`);
            }
            mkdirSync(dirname(destPath), { recursive: true });
            copyFileSync(srcPath, destPath);
            const { size } = statSync(destPath);
            copied.push({ path: relDest, size });
        }
    }
    return copied;
}
//# sourceMappingURL=copy-fonts.js.map