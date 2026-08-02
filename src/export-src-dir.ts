import { readdirSync, statSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import type { C2bConfig } from './types.js';

/**
 * Recursively copies every file present in srcDir to outputDir, preserving
 * relative paths. Picks up both c2b-generated files (already written by the
 * time this runs) and any hand-maintained files the user placed in srcDir —
 * outputDir ends up a full mirror of srcDir.
 */
export function exportSourceDir(
  config: C2bConfig,
  baseDir: string,
): Array<{ path: string; size: number }> {
  const srcRoot = resolve(baseDir, config.srcDir);
  const outRoot = resolve(baseDir, config.outputDir);
  const copied: Array<{ path: string; size: number }> = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
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
