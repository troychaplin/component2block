import { describe, it, expect } from 'vitest';
import { generateFontsCss } from '../src/generators/fonts-css.js';
import type { C2bConfig } from '../src/types.js';

const config: C2bConfig = {
  prefix: 'test',
  tokensPath: 'src/styles/tokens.css',

  wpDir: 'dist/wp',
  tokens: {
    fontFamily: {
      inter: {
        value: 'Inter, sans-serif',
        name: 'Inter',
        slug: 'inter',
        fontFace: [
          { weight: '300', style: 'normal', src: 'inter-300-normal.woff2' },
          { weight: '400', style: 'italic', src: 'inter-400-italic.woff' },
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

describe('generateFontsCss', () => {
  const output = generateFontsCss(config)!;

  it('generates @font-face declarations', () => {
    expect(output).toContain("font-family: 'Inter';");
    expect(output).toContain('font-weight: 300;');
    expect(output).toContain('font-style: normal;');
  });

  it('uses correct URL path with slug subfolder', () => {
    expect(output).toContain("url('/fonts/inter/inter-300-normal.woff2')");
  });

  it('infers woff2 format', () => {
    expect(output).toContain("format('woff2')");
  });

  it('infers woff format', () => {
    expect(output).toContain("format('woff')");
  });

  it('skips fonts without fontFace', () => {
    expect(output).not.toContain('System');
    expect(output).not.toContain('apple-system');
  });

  it('returns null when no fontFace entries exist', () => {
    const noFaceConfig: C2bConfig = {
      ...config,
      tokens: {
        fontFamily: {
          system: { value: 'sans-serif', name: 'System', slug: 'system' },
        },
      },
    };
    expect(generateFontsCss(noFaceConfig)).toBeNull();
  });

  it('returns null when no fontFamily tokens exist', () => {
    const noFontConfig: C2bConfig = {
      ...config,
      tokens: {},
    };
    expect(generateFontsCss(noFontConfig)).toBeNull();
  });
});
