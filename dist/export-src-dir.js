import { readdirSync, statSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
/**
 * Recursively copies every file present in srcDir to outputDir, preserving
 * relative paths. Picks up both c2b-generated files (already written by the
 * time this runs) and any hand-maintained files the user placed in srcDir —
 * outputDir ends up a full mirror of srcDir.
 */
export function exportSourceDir(config, baseDir) {
    const srcRoot = resolve(baseDir, config.srcDir);
    const outRoot = resolve(baseDir, config.outputDir);
    const copied = [];
    const walk = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
                continue;
            }
            if (!entry.isFile())
                continue;
            const relPath = relative(srcRoot, fullPath);
            const destPath = join(outRoot, relPath);
            mkdirSync(dirname(destPath), { recursive: true });
            copyFileSync(fullPath, destPath);
            copied.push({ path: relative(baseDir, destPath), size: statSync(fullPath).size });
        }
    };
    walk(srcRoot);
    return copied;
}
//# sourceMappingURL=export-src-dir.js.map