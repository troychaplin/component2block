import { describe, it, expect } from 'vitest';
import { validateConfig } from '../src/config.js';
import type { StbConfigInput } from '../src/types.js';

const minimalConfig: StbConfigInput = {
  prefix: 'test',
  color: {
    primary: { value: '#0073aa' },
  },
};

describe('validateConfig', () => {
  it('accepts a valid minimal config', () => {
    const result = validateConfig(minimalConfig);
    expect(result.prefix).toBe('test');
    expect(result.tokensPath).toBe('src/styles/tokens.css');
    expect(result.outDir).toBe('dist/wp');
  });

  it('applies custom tokensPath and outDir', () => {
    const result = validateConfig({
      ...minimalConfig,
      tokensPath: 'custom/tokens.css',
      outDir: 'build/wp',
    });
    expect(result.tokensPath).toBe('custom/tokens.css');
    expect(result.outDir).toBe('build/wp');
  });

  it('throws if prefix is missing', () => {
    expect(() =>
      validateConfig({ prefix: '', color: { primary: { value: '#000' } } }),
    ).toThrow('"prefix" is required');
  });

  it('throws if a token has no value', () => {
    expect(() =>
      validateConfig({
        prefix: 'test',
        color: { primary: {} as any },
      }),
    ).toThrow('missing a "value"');
  });

  it('throws on unknown category', () => {
    expect(() =>
      validateConfig({
        prefix: 'test',
        bogus: { x: { value: '1' } },
      } as any),
    ).toThrow('Unknown token category');
  });

  it('maps "color" to internal colorPalette', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { primary: { value: '#0073aa' } },
    });
    expect(result.tokens.colorPalette).toBeDefined();
    expect(result.tokens.colorPalette!.primary.value).toBe('#0073aa');
  });

  it('maps "gradient" to internal colorGradient', () => {
    const result = validateConfig({
      prefix: 'test',
      gradient: {
        sunset: { value: 'linear-gradient(135deg, #ff6b6b, #feca57)' },
      },
    });
    expect(result.tokens.colorGradient).toBeDefined();
    expect(result.tokens.colorGradient!.sunset.value).toContain('linear-gradient');
  });

  it('accepts fontFace on fontFamily tokens', () => {
    const result = validateConfig({
      prefix: 'test',
      fontFamily: {
        inter: {
          value: 'Inter, sans-serif',
          fontFace: [{ weight: '400', style: 'normal', src: 'inter-400-normal.woff2' }],
        },
      },
    });
    expect(result.tokens.fontFamily!.inter.fontFace).toHaveLength(1);
  });

  it('throws if fontFace entry is missing required fields', () => {
    expect(() =>
      validateConfig({
        prefix: 'test',
        fontFamily: {
          inter: {
            value: 'Inter, sans-serif',
            fontFace: [{ weight: '400', style: 'normal' } as any],
          },
        },
      }),
    ).toThrow('must have "weight", "style", and "src"');
  });
});

describe('validateConfig — auto-derived fields', () => {
  it('auto-derives slug from token key', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { primary: { value: '#0073aa' } },
    });
    expect(result.tokens.colorPalette!.primary.slug).toBe('primary');
  });

  it('auto-derives name from token key (title-case)', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { 'primary-hover': { value: '#005a87' } },
    });
    expect(result.tokens.colorPalette!['primary-hover'].name).toBe('Primary Hover');
  });

  it('allows explicit name override', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { primary: { value: '#0073aa', name: 'Primary Brand Color' } },
    });
    expect(result.tokens.colorPalette!.primary.name).toBe('Primary Brand Color');
    expect(result.tokens.colorPalette!.primary.slug).toBe('primary');
  });

  it('does not add slug/name to layout tokens (directMap)', () => {
    const result = validateConfig({
      prefix: 'test',
      layout: { 'content-size': { value: '768px' } },
    });
    expect(result.tokens.layout!['content-size'].slug).toBeUndefined();
    expect(result.tokens.layout!['content-size'].name).toBeUndefined();
  });
});

describe('validateConfig — string shorthand (CSS-only)', () => {
  it('expands string value to { value: string }', () => {
    const result = validateConfig({
      prefix: 'test',
      fontWeight: { normal: '400', bold: '700' },
    } as StbConfigInput);
    expect(result.tokens.fontWeight!.normal.value).toBe('400');
    expect(result.tokens.fontWeight!.bold.value).toBe('700');
  });

  it('does NOT auto-derive slug/name on string shorthand', () => {
    const result = validateConfig({
      prefix: 'test',
      fontWeight: { 'semi-bold': '600' },
    } as StbConfigInput);
    expect(result.tokens.fontWeight!['semi-bold'].slug).toBeUndefined();
    expect(result.tokens.fontWeight!['semi-bold'].name).toBeUndefined();
  });

  it('produces CSS variable but no preset for string shorthand colors', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { muted: '#999' },
    } as StbConfigInput);
    expect(result.tokens.colorPalette!.muted.value).toBe('#999');
    expect(result.tokens.colorPalette!.muted.slug).toBeUndefined();
    expect(result.tokens.colorPalette!.muted.name).toBeUndefined();
  });

  it('auto-derives slug/name on object entries', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { primary: { value: '#0073aa' } },
    } as StbConfigInput);
    expect(result.tokens.colorPalette!.primary.value).toBe('#0073aa');
    expect(result.tokens.colorPalette!.primary.slug).toBe('primary');
    expect(result.tokens.colorPalette!.primary.name).toBe('Primary');
  });
});

describe('validateConfig — fluid value auto-derive', () => {
  it('auto-derives value from fluid.max when value is missing', () => {
    const result = validateConfig({
      prefix: 'test',
      fontSize: {
        small: { fluid: { min: '0.875rem', max: '1rem' } },
      },
    } as StbConfigInput);
    expect(result.tokens.fontSize!.small.value).toBe('1rem');
  });

  it('preserves explicit value when fluid is also set', () => {
    const result = validateConfig({
      prefix: 'test',
      fontSize: {
        small: { value: '1rem', fluid: { min: '0.875rem', max: '1rem' } },
      },
    } as StbConfigInput);
    expect(result.tokens.fontSize!.small.value).toBe('1rem');
  });
});

describe('validateConfig — wpThemeable flag', () => {
  it('defaults wpThemeable to false when omitted', () => {
    const result = validateConfig({ prefix: 'test', color: { primary: { value: '#000' } } });
    expect(result.wpThemeable).toBe(false);
  });

  it('sets wpThemeable to true when explicitly true', () => {
    const result = validateConfig({ prefix: 'test', wpThemeable: true, color: { primary: { value: '#000' } } });
    expect(result.wpThemeable).toBe(true);
  });

  it('does not treat wpThemeable as a token category', () => {
    const result = validateConfig({ prefix: 'test', wpThemeable: true, color: { primary: { value: '#000' } } });
    expect(result.wpThemeable).toBe(true);
    expect(result.tokens).not.toHaveProperty('wpThemeable');
  });
});

describe('validateConfig — cssOnly flag', () => {
  it('skips slug/name auto-derive when cssOnly is true', () => {
    const result = validateConfig({
      prefix: 'test',
      color: {
        'primary-hover': { value: '#005a87', cssOnly: true },
      },
    } as StbConfigInput);
    expect(result.tokens.colorPalette!['primary-hover'].value).toBe('#005a87');
    expect(result.tokens.colorPalette!['primary-hover'].slug).toBeUndefined();
    expect(result.tokens.colorPalette!['primary-hover'].name).toBeUndefined();
    expect(result.tokens.colorPalette!['primary-hover'].cssOnly).toBe(true);
  });

  it('auto-derives slug/name when cssOnly is not set', () => {
    const result = validateConfig({
      prefix: 'test',
      color: {
        primary: { value: '#0073aa' },
      },
    } as StbConfigInput);
    expect(result.tokens.colorPalette!.primary.slug).toBe('primary');
    expect(result.tokens.colorPalette!.primary.name).toBe('Primary');
  });

  it('works alongside string shorthand in same category', () => {
    const result = validateConfig({
      prefix: 'test',
      color: {
        primary: { value: '#0073aa' },
        'primary-hover': { value: '#005a87', cssOnly: true },
        border: '#e2e8f0',
      },
    } as StbConfigInput);
    // Object without cssOnly — preset
    expect(result.tokens.colorPalette!.primary.slug).toBe('primary');
    // Object with cssOnly — CSS-only
    expect(result.tokens.colorPalette!['primary-hover'].slug).toBeUndefined();
    // String shorthand — CSS-only
    expect(result.tokens.colorPalette!.border.slug).toBeUndefined();
  });
});

describe('validateConfig — baseStyles', () => {
  it('passes baseStyles through to config', () => {
    const result = validateConfig({
      prefix: 'test',
      fontFamily: { inter: { value: 'Inter, sans-serif' } },
      baseStyles: {
        body: { fontFamily: 'inter', fontSize: 'medium' },
        h1: { fontSize: '3rem' },
      },
    } as StbConfigInput);
    expect(result.baseStyles).toBeDefined();
    expect(result.baseStyles!.body!.fontFamily).toBe('inter');
    expect(result.baseStyles!.h1!.fontSize).toBe('3rem');
  });

  it('does not treat baseStyles as a token category', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { primary: { value: '#000' } },
      baseStyles: { body: { fontFamily: 'inter' } },
    } as StbConfigInput);
    expect(result.tokens).not.toHaveProperty('baseStyles');
  });

  it('works without baseStyles (backward compatible)', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { primary: { value: '#000' } },
    } as StbConfigInput);
    expect(result.baseStyles).toBeUndefined();
  });
});
