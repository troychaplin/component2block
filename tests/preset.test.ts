import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { previewAnnotations } from '../src/preset.js';

const TEST_DIR = resolve(import.meta.dirname ?? '.', '__test-preset__');
const STYLES_DIR = join(TEST_DIR, 'src/styles');

const minimalConfig = {
  prefix: 'test',
  output: {
    srcDir: 'src/styles',
  },
  tokens: {
    color: { primary: { value: '#000', name: 'Primary' } },
  },
};

describe('preset: previewAnnotations — partial files', () => {
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
    mkdirSync(STYLES_DIR, { recursive: true });
    writeFileSync(
      join(TEST_DIR, 'c2b.config.json'),
      JSON.stringify(minimalConfig, null, 2),
    );

    // Only create tokens.css and reset.scss — not fonts.css or content.scss
    writeFileSync(join(STYLES_DIR, 'tokens.css'), ':root {}');
    writeFileSync(join(STYLES_DIR, 'reset.scss'), '* { box-sizing: border-box; }');

    process.chdir(TEST_DIR);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('includes files that exist on disk', () => {
    const result = previewAnnotations([]);
    expect(result).toContain(join(STYLES_DIR, 'tokens.css'));
    expect(result).toContain(join(STYLES_DIR, 'reset.scss'));
  });

  it('excludes files that do not exist', () => {
    const result = previewAnnotations([]);
    const paths = result.join('\n');
    expect(paths).not.toContain('fonts.css');
    expect(paths).not.toContain('content.scss');
  });

  it('preserves existing input entries', () => {
    const result = previewAnnotations(['/some/other/annotation.js']);
    expect(result[0]).toBe('/some/other/annotation.js');
    expect(result.length).toBeGreaterThan(1);
  });

  it('returns absolute paths', () => {
    const result = previewAnnotations([]);
    for (const p of result) {
      expect(p).toMatch(/^\//);
    }
  });
});

describe('preset: previewAnnotations — all files', () => {
  const ALL_DIR = resolve(import.meta.dirname ?? '.', '__test-preset-all__');
  const ALL_STYLES = join(ALL_DIR, 'src/styles');
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
    mkdirSync(ALL_STYLES, { recursive: true });
    writeFileSync(
      join(ALL_DIR, 'c2b.config.json'),
      JSON.stringify(minimalConfig, null, 2),
    );

    writeFileSync(join(ALL_STYLES, 'tokens.css'), ':root {}');
    writeFileSync(join(ALL_STYLES, 'fonts.css'), '@font-face {}');
    writeFileSync(join(ALL_STYLES, 'reset.scss'), '* {}');
    writeFileSync(join(ALL_STYLES, 'content.scss'), '@use "base-styles";');

    process.chdir(ALL_DIR);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    rmSync(ALL_DIR, { recursive: true, force: true });
  });

  it('includes all four files when all exist', () => {
    const result = previewAnnotations([]);
    expect(result).toHaveLength(4);
    expect(result).toContain(join(ALL_STYLES, 'tokens.css'));
    expect(result).toContain(join(ALL_STYLES, 'fonts.css'));
    expect(result).toContain(join(ALL_STYLES, 'reset.scss'));
    expect(result).toContain(join(ALL_STYLES, 'content.scss'));
  });
});

describe('preset: previewAnnotations — no config', () => {
  const EMPTY_DIR = resolve(import.meta.dirname ?? '.', '__test-preset-empty__');
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
    mkdirSync(EMPTY_DIR, { recursive: true });
    // No c2b.config.json
    process.chdir(EMPTY_DIR);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    rmSync(EMPTY_DIR, { recursive: true, force: true });
  });

  it('returns input unchanged when config is missing', () => {
    const input = ['/existing/annotation.js'];
    const result = previewAnnotations(input);
    expect(result).toEqual(input);
  });

  it('returns empty array when called with no args and no config', () => {
    const result = previewAnnotations();
    expect(result).toEqual([]);
  });
});
