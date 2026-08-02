import type { C2bConfig } from './types.js';
/**
 * Recursively copies every file present in srcDir to outputDir, preserving
 * relative paths. Picks up both c2b-generated files (already written by the
 * time this runs) and any hand-maintained files the user placed in srcDir —
 * outputDir ends up a full mirror of srcDir.
 */
export declare function exportSourceDir(config: C2bConfig, baseDir: string): Array<{
    path: string;
    size: number;
}>;
//# sourceMappingURL=export-src-dir.d.ts.map