import { describe, it, expect } from 'vitest';
import { validateConfig } from '../src/config.js';
import type { C2bConfigInput } from '../src/types.js';

const minimalConfig: C2bConfigInput = {
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
    expect(result.wpDir).toBe('dist/wp');
  });

  it('applies custom tokensPath and wpDir via legacy outDir', () => {
    const result = validateConfig({
      ...minimalConfig,
      tokensPath: 'custom/tokens.css',
      outDir: 'build/wp',
    });
    expect(result.tokensPath).toBe('custom/tokens.css');
    expect(result.wpDir).toBe('build/wp');
  });

  it('applies custom tokensPath and wpDir via output wrapper', () => {
    const result = validateConfig({
      ...minimalConfig,
      output: {
        tokensPath: 'custom/tokens.css',
        wpDir: 'build/wp',
      },
    });
    expect(result.tokensPath).toBe('custom/tokens.css');
    expect(result.wpDir).toBe('build/wp');
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
      layout: { contentSize: { value: '768px' } },
    });
    expect(result.tokens.layout!.contentSize.slug).toBeUndefined();
    expect(result.tokens.layout!.contentSize.name).toBeUndefined();
  });
});

describe('validateConfig — string shorthand', () => {
  it('expands string value to { value: string }', () => {
    const result = validateConfig({
      prefix: 'test',
      fontWeight: { normal: '400', bold: '700' },
    } as C2bConfigInput);
    expect(result.tokens.fontWeight!.normal.value).toBe('400');
    expect(result.tokens.fontWeight!.bold.value).toBe('700');
  });

  it('does NOT auto-derive slug/name on string shorthand', () => {
    const result = validateConfig({
      prefix: 'test',
      fontWeight: { 'semi-bold': '600' },
    } as C2bConfigInput);
    expect(result.tokens.fontWeight!['semi-bold'].slug).toBeUndefined();
    expect(result.tokens.fontWeight!['semi-bold'].name).toBeUndefined();
  });

  it('registers string shorthand as preset for preset-capable categories (color)', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { muted: '#999' },
    } as C2bConfigInput);
    expect(result.tokens.colorPalette!.muted.value).toBe('#999');
    expect(result.tokens.colorPalette!.muted.slug).toBe('muted');
    expect(result.tokens.colorPalette!.muted.name).toBe('Muted');
  });

  it('auto-derives slug/name on object entries', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { primary: { value: '#0073aa' } },
    } as C2bConfigInput);
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
    } as C2bConfigInput);
    expect(result.tokens.fontSize!.small.value).toBe('1rem');
  });

  it('preserves explicit value when fluid is also set', () => {
    const result = validateConfig({
      prefix: 'test',
      fontSize: {
        small: { value: '1rem', fluid: { min: '0.875rem', max: '1rem' } },
      },
    } as C2bConfigInput);
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
    } as C2bConfigInput);
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
    } as C2bConfigInput);
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
    } as C2bConfigInput);
    // Object without cssOnly — preset
    expect(result.tokens.colorPalette!.primary.slug).toBe('primary');
    // Object with cssOnly — CSS-only
    expect(result.tokens.colorPalette!['primary-hover'].slug).toBeUndefined();
    // String shorthand on preset-capable category — registers as preset
    expect(result.tokens.colorPalette!.border.slug).toBe('border');
    expect(result.tokens.colorPalette!.border.name).toBe('Border');
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
    } as C2bConfigInput);
    expect(result.baseStyles).toBeDefined();
    expect(result.baseStyles!.body!.fontFamily).toBe('inter');
    expect(result.baseStyles!.h1!.fontSize).toBe('3rem');
  });

  it('does not treat baseStyles as a token category', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { primary: { value: '#000' } },
      baseStyles: { body: { fontFamily: 'inter' } },
    } as C2bConfigInput);
    expect(result.tokens).not.toHaveProperty('baseStyles');
  });

  it('works without baseStyles (backward compatible)', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { primary: { value: '#000' } },
    } as C2bConfigInput);
    expect(result.baseStyles).toBeUndefined();
  });
});

describe('validateConfig — output wrapper format', () => {
  it('reads wpThemeable from output wrapper', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { primary: { value: '#000' } },
      output: { wpThemeable: true },
    });
    expect(result.wpThemeable).toBe(true);
  });

  it('output wrapper takes precedence over legacy root-level keys', () => {
    const result = validateConfig({
      prefix: 'test',
      color: { primary: { value: '#000' } },
      tokensPath: 'legacy/tokens.css',
      outDir: 'legacy/wp',
      wpThemeable: false,
      output: {
        tokensPath: 'new/tokens.css',
        wpDir: 'new/wp',
        wpThemeable: true,
      },
    });
    expect(result.tokensPath).toBe('new/tokens.css');
    expect(result.wpDir).toBe('new/wp');
    expect(result.wpThemeable).toBe(true);
  });
});

describe('validateConfig — tokens wrapper format', () => {
  it('reads token categories from tokens wrapper', () => {
    const result = validateConfig({
      prefix: 'test',
      tokens: {
        color: { primary: { value: '#0073aa' } },
        fontWeight: { bold: { value: '700' } },
      },
    });
    expect(result.tokens.colorPalette).toBeDefined();
    expect(result.tokens.colorPalette!.primary.value).toBe('#0073aa');
    expect(result.tokens.fontWeight).toBeDefined();
    expect(result.tokens.fontWeight!.bold.value).toBe('700');
  });

  it('maps color and gradient aliases inside tokens wrapper', () => {
    const result = validateConfig({
      prefix: 'test',
      tokens: {
        color: { primary: { value: '#0073aa' } },
        gradient: { sunset: { value: 'linear-gradient(135deg, #ff6b6b, #feca57)' } },
      },
    });
    expect(result.tokens.colorPalette).toBeDefined();
    expect(result.tokens.colorGradient).toBeDefined();
  });

  it('throws on unknown category inside tokens wrapper', () => {
    expect(() =>
      validateConfig({
        prefix: 'test',
        tokens: {
          bogus: { x: { value: '1' } },
        },
      }),
    ).toThrow('Unknown token category');
  });
});

describe('validateConfig — fluid fontSize shorthand', () => {
  it('expands { min, max } shorthand to { value, fluid }', () => {
    const result = validateConfig({
      prefix: 'test',
      fontSize: {
        small: { min: '0.875rem', max: '1rem' },
      },
    } as C2bConfigInput);
    expect(result.tokens.fontSize!.small.value).toBe('1rem');
    expect(result.tokens.fontSize!.small.fluid).toEqual({ min: '0.875rem', max: '1rem' });
  });
});

describe('validateConfig — string shorthand preset registration', () => {
  it('registers string shorthand as preset for spacing (preset-capable)', () => {
    const result = validateConfig({
      prefix: 'test',
      spacing: { small: '0.5rem', large: '2rem' },
    } as C2bConfigInput);
    expect(result.tokens.spacing!.small.value).toBe('0.5rem');
    expect(result.tokens.spacing!.small.slug).toBe('small');
    expect(result.tokens.spacing!.small.name).toBe('Small');
  });

  it('does NOT register string shorthand as preset for fontWeight (custom-only)', () => {
    const result = validateConfig({
      prefix: 'test',
      fontWeight: { bold: '700' },
    } as C2bConfigInput);
    expect(result.tokens.fontWeight!.bold.value).toBe('700');
    expect(result.tokens.fontWeight!.bold.slug).toBeUndefined();
    expect(result.tokens.fontWeight!.bold.name).toBeUndefined();
  });

  it('does NOT register string shorthand as preset for lineHeight (custom-only)', () => {
    const result = validateConfig({
      prefix: 'test',
      lineHeight: { normal: '1.5' },
    } as C2bConfigInput);
    expect(result.tokens.lineHeight!.normal.value).toBe('1.5');
    expect(result.tokens.lineHeight!.normal.slug).toBeUndefined();
    expect(result.tokens.lineHeight!.normal.name).toBeUndefined();
  });

  it('registers string shorthand as preset for gradient (preset-capable)', () => {
    const result = validateConfig({
      prefix: 'test',
      gradient: { sunset: 'linear-gradient(135deg, #ff6b6b, #feca57)' },
    } as C2bConfigInput);
    expect(result.tokens.colorGradient!.sunset.slug).toBe('sunset');
    expect(result.tokens.colorGradient!.sunset.name).toBe('Sunset');
  });
});

describe('validateConfig — layout camelCase keys', () => {
  it('accepts camelCase layout keys', () => {
    const result = validateConfig({
      prefix: 'test',
      layout: {
        contentSize: { value: '768px' },
        wideSize: { value: '1200px' },
      },
    });
    expect(result.tokens.layout!.contentSize.value).toBe('768px');
    expect(result.tokens.layout!.wideSize.value).toBe('1200px');
  });

  it('does not add slug/name to camelCase layout tokens', () => {
    const result = validateConfig({
      prefix: 'test',
      layout: { contentSize: { value: '768px' } },
    });
    expect(result.tokens.layout!.contentSize.slug).toBeUndefined();
    expect(result.tokens.layout!.contentSize.name).toBeUndefined();
  });
});
