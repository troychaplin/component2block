import type { C2bConfig } from '../types.js';
export interface CopiedFile {
    path: string;
    size: number;
}
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
export declare function copyFontFiles(config: C2bConfig, destDir: string, baseDir: string): CopiedFile[];
//# sourceMappingURL=copy-fonts.d.ts.map