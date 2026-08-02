import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { exportSourceDir } from '../src/export-src-dir.js';
import { generate } from '../src/index.js';
import type { C2bConfig } from '../src/types.js';

const TEST_DIR = resolve(import.meta.dirname ?? '.', '__test-export-src-dir__');

describe('exportSourceDir', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  const baseConfig: C2bConfig = {
    prefix: 'test',
    srcDir: 'src/styles',
    outputDir: 'dist/styles',
    themeable: false,
    bundleFonts: false,
    emitScssAlongside: false,
    emitAggregate: false,
    tokens: {},
  };

  it('copies every file from srcDir to outputDir, preserving relative paths', () => {
    mkdirSync(join(TEST_DIR, 'src/styles/nested'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'src/styles/test-tokens.css'), ':root {}');
    writeFileSync(join(TEST_DIR, 'src/styles/nested/hand-authored.scss'), '.foo { color: red; }');

    const copied = exportSourceDir(baseConfig, TEST_DIR);

    const paths = copied.map((f) => f.path);
    expect(paths).toContain('dist/styles/test-tokens.css');
    expect(paths).toContain('dist/styles/nested/hand-authored.scss');

    expect(readFileSync(join(TEST_DIR, 'dist/styles/test-tokens.css'), 'utf-8')).toBe(':root {}');
    expect(readFileSync(join(TEST_DIR, 'dist/styles/nested/hand-authored.scss'), 'utf-8')).toBe(
      '.foo { color: red; }',
    );
  });

  it('returns an empty list when srcDir has no files', () => {
    mkdirSync(join(TEST_DIR, 'src/styles'), { recursive: true });
    const copied = exportSourceDir(baseConfig, TEST_DIR);
    expect(copied).toEqual([]);
  });
});

describe('generate() — srcDir export with prefixed filenames', () => {
  const GEN_DIR = resolve(import.meta.dirname ?? '.', '__test-export-src-dir-generate__');
  const CONFIG_PATH = resolve(GEN_DIR, 'c2b.config.json');

  const config = {
    prefix: 'rds',
    output: {
      srcDir: 'src/styles',
      outputDir: 'dist/styles',
    },
    tokens: {
      color: {
        primary: '#ff0000',
      },
    },
  };

  beforeEach(() => {
    mkdirSync(GEN_DIR, { recursive: true });
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  });

  afterEach(() => {
    rmSync(GEN_DIR, { recursive: true, force: true });
  });

  it('prefixes generated filenames in both srcDir and outputDir', () => {
    const result = generate(CONFIG_PATH, GEN_DIR);
    const paths = result.files.map((f) => f.path);

    expect(paths).toContain('src/styles/rds-tokens.css');
    expect(paths).toContain('dist/styles/rds-tokens.css');
    expect(paths).not.toContain('src/styles/tokens.css');
    expect(paths).not.toContain('dist/styles/tokens.css');
  });

  it('exports a hand-maintained file placed in srcDir, unprefixed and untouched', () => {
    // Simulate a file the user manually maintains alongside the generated ones.
    mkdirSync(resolve(GEN_DIR, 'src/styles'), { recursive: true });
    writeFileSync(resolve(GEN_DIR, 'src/styles/custom.scss'), '.custom { color: blue; }');

    const result = generate(CONFIG_PATH, GEN_DIR);
    const paths = result.files.map((f) => f.path);

    expect(paths).toContain('dist/styles/custom.scss');
    expect(readFileSync(resolve(GEN_DIR, 'dist/styles/custom.scss'), 'utf-8')).toBe(
      '.custom { color: blue; }',
    );
  });

  it('keeps the leading underscore on the prefixed _variables.scss partial', () => {
    const scssConfig = {
      ...config,
      output: { ...config.output, scssVars: ['color'] },
    };
    writeFileSync(CONFIG_PATH, JSON.stringify(scssConfig, null, 2));

    const result = generate(CONFIG_PATH, GEN_DIR);
    const paths = result.files.map((f) => f.path);

    expect(paths).toContain('src/styles/_rds-variables.scss');
    // exportSourceDir mirrors everything in srcDir, including this partial
    expect(paths).toContain('dist/styles/_rds-variables.scss');
    expect(existsSync(resolve(GEN_DIR, 'dist/styles/_rds-variables.scss'))).toBe(true);
  });
});
