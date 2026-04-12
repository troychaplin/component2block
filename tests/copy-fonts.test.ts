import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { copyFontFiles } from '../src/generators/copy-fonts.js';
import type { C2bConfig } from '../src/types.js';

const TEST_DIR = resolve(import.meta.dirname ?? '.', '__test-copy-fonts__');
const FONTS_SRC = join(TEST_DIR, 'public/fonts');
const DEST_DIR = join(TEST_DIR, 'dist');

const config: C2bConfig = {
  prefix: 'test',
  srcDir: 'src/styles',
  themeDir: 'dist/wp',
  bundleFonts: true,
  fontsDir: 'public/fonts',
  tokens: {
    fontFamily: {
      inter: {
        value: 'Inter, sans-serif',
        name: 'Inter',
        slug: 'inter',
        fontFace: [
          { weight: '300', style: 'normal', src: 'inter-300-normal.woff2' },
          { weight: '400', style: 'normal', src: 'inter-400-normal.woff2' },
        ],
      },
      system: {
        value: '-apple-system, BlinkMacSystemFont, sans-serif',
        name: 'System',
        slug: 'system',
      },
    },
  },
};

describe('copyFontFiles', () => {
  beforeAll(() => {
    mkdirSync(join(FONTS_SRC, 'inter'), { recursive: true });
    writeFileSync(join(FONTS_SRC, 'inter/inter-300-normal.woff2'), 'fake-font-data-300');
    writeFileSync(join(FONTS_SRC, 'inter/inter-400-normal.woff2'), 'fake-font-data-400');
  });

  afterAll(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('copies font files to dest/fonts/{slug}/', () => {
    const copied = copyFontFiles(config, DEST_DIR, TEST_DIR);

    expect(copied).toHaveLength(2);
    expect(existsSync(join(DEST_DIR, 'fonts/inter/inter-300-normal.woff2'))).toBe(true);
    expect(existsSync(join(DEST_DIR, 'fonts/inter/inter-400-normal.woff2'))).toBe(true);
  });

  it('preserves file content', () => {
    copyFontFiles(config, DEST_DIR, TEST_DIR);

    const content = readFileSync(join(DEST_DIR, 'fonts/inter/inter-300-normal.woff2'), 'utf-8');
    expect(content).toBe('fake-font-data-300');
  });

  it('returns relative paths and sizes', () => {
    const copied = copyFontFiles(config, DEST_DIR, TEST_DIR);

    expect(copied[0].path).toBe(join('fonts', 'inter', 'inter-300-normal.woff2'));
    expect(copied[0].size).toBeGreaterThan(0);
  });

  it('skips font families without fontFace entries', () => {
    const copied = copyFontFiles(config, DEST_DIR, TEST_DIR);

    // Only inter has fontFace, system does not
    const paths = copied.map(c => c.path);
    expect(paths.every(p => p.includes('inter'))).toBe(true);
  });

  it('returns empty array when fontsDir is not set', () => {
    const noFontsDirConfig: C2bConfig = {
      ...config,
      fontsDir: undefined,
    };
    const copied = copyFontFiles(noFontsDirConfig, DEST_DIR, TEST_DIR);
    expect(copied).toEqual([]);
  });

  it('throws when a listed font file does not exist', () => {
    const missingFileConfig: C2bConfig = {
      ...config,
      tokens: {
        fontFamily: {
          inter: {
            value: 'Inter, sans-serif',
            name: 'Inter',
            slug: 'inter',
            fontFace: [
              { weight: '700', style: 'normal', src: 'inter-700-normal.woff2' },
            ],
          },
        },
      },
    };

    expect(() => copyFontFiles(missingFileConfig, DEST_DIR, TEST_DIR)).toThrow(
      /Font file not found.*inter-700-normal\.woff2/,
    );
  });
});
