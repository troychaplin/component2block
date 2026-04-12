import { describe, it, expect } from 'vitest';
import { generateThemeJson } from '../src/generators/theme-json.js';
import type { C2bConfig } from '../src/types.js';

const config: C2bConfig = {
  prefix: 'test',
  tokensPath: 'src/styles/tokens.css',

  wpDir: 'dist/wp',
  wpThemeable: false,
  tokens: {
    colorPalette: {
      primary: { value: '#0073aa', name: 'Primary', slug: 'primary' },
      'primary-hover': { value: '#005a87' },
    },
    spacing: {
      md: { value: '1rem', slug: '40', name: 'Medium' },
    },
    fontFamily: {
      base: { value: 'sans-serif', name: 'Sans', slug: 'body' },
    },
    fontSize: {
      sm: { value: '0.875rem', slug: 'small', name: 'Small' },
      xs: { value: '0.75rem' },
    },
    fontWeight: {
      bold: { value: '700' },
    },
    lineHeight: {
      normal: { value: '1.5' },
    },
    radius: {
      md: { value: '4px' },
    },
    shadow: {
      sm: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
    },
    transition: {
      fast: { value: '150ms ease' },
    },
    zIndex: {
      modal: { value: '300' },
    },
  },
};

describe('generateThemeJson', () => {
  const output = generateThemeJson(config);
  const parsed = JSON.parse(output);

  it('includes schema and version', () => {
    expect(parsed.$schema).toBe('https://schemas.wp.org/trunk/theme.json');
    expect(parsed.version).toBe(3);
  });

  it('includes named colors in palette', () => {
    expect(parsed.settings.color.palette).toEqual([
      { slug: 'primary', color: '#0073aa', name: 'Primary' },
    ]);
  });

  it('excludes unnamed colors from palette', () => {
    const slugs = parsed.settings.color.palette.map((p: any) => p.slug);
    expect(slugs).not.toContain('primary-hover');
  });

  it('does not set default color preset flags (theme responsibility)', () => {
    expect(parsed.settings.color.defaultDuotone).toBeUndefined();
    expect(parsed.settings.color.defaultPalette).toBeUndefined();
    expect(parsed.settings.color.defaultGradients).toBeUndefined();
  });

  it('includes spacing sizes', () => {
    expect(parsed.settings.spacing.spacingSizes).toEqual([
      { slug: '40', size: '1rem', name: 'Medium' },
    ]);
  });

  it('does not set default spacing size flag (theme responsibility)', () => {
    expect(parsed.settings.spacing.defaultSpacingSizes).toBeUndefined();
  });

  it('includes font families', () => {
    expect(parsed.settings.typography.fontFamilies).toEqual([
      { slug: 'body', fontFamily: 'sans-serif', name: 'Sans' },
    ]);
  });

  it('includes named font sizes only', () => {
    expect(parsed.settings.typography.fontSizes).toEqual([
      { slug: 'small', size: '0.875rem', name: 'Small' },
    ]);
  });

  it('places fontWeight under settings.custom', () => {
    expect(parsed.settings.custom.fontWeight).toEqual({ bold: '700' });
  });

  it('places lineHeight under settings.custom', () => {
    expect(parsed.settings.custom.lineHeight).toEqual({ normal: '1.5' });
  });

  it('places radius under settings.custom', () => {
    expect(parsed.settings.custom.radius).toEqual({ md: '4px' });
  });

  it('places shadow under settings.custom', () => {
    expect(parsed.settings.custom.shadow).toEqual({
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    });
  });

  it('places transition under settings.custom', () => {
    expect(parsed.settings.custom.transition).toEqual({ fast: '150ms ease' });
  });

  it('excludes zIndex entirely', () => {
    expect(parsed.settings.custom.zIndex).toBeUndefined();
  });
});

describe('generateThemeJson — layout tokens', () => {
  const layoutConfig: C2bConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
  
    wpDir: 'dist/wp',
    wpThemeable: false,
    tokens: {
      layout: {
        contentSize: { value: '645px' },
        wideSize: { value: '1340px' },
      },
    },
  };

  const output = generateThemeJson(layoutConfig);
  const parsed = JSON.parse(output);

  it('generates settings.layout with camelCase keys', () => {
    expect(parsed.settings.layout).toEqual({
      contentSize: '645px',
      wideSize: '1340px',
    });
  });
});

describe('generateThemeJson — shadow presets', () => {
  const shadowConfig: C2bConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
  
    wpDir: 'dist/wp',
    wpThemeable: false,
    tokens: {
      shadow: {
        sm: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', name: 'Small', slug: 'sm' },
        md: { value: '0 4px 6px -1px rgb(0 0 0 / 0.1)', name: 'Medium', slug: 'md' },
        custom: { value: '0 0 0 2px rgb(0 0 0 / 0.2)' },
      },
    },
  };

  const output = generateThemeJson(shadowConfig);
  const parsed = JSON.parse(output);

  it('does not set default shadow preset flag (theme responsibility)', () => {
    expect(parsed.settings.shadow.defaultPresets).toBeUndefined();
  });

  it('places named shadows in settings.shadow.presets', () => {
    expect(parsed.settings.shadow.presets).toEqual([
      { slug: 'sm', shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', name: 'Small' },
      { slug: 'md', shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', name: 'Medium' },
    ]);
  });

  it('places unnamed shadows in settings.custom.shadow', () => {
    expect(parsed.settings.custom.shadow).toEqual({
      custom: '0 0 0 2px rgb(0 0 0 / 0.2)',
    });
  });

  it('excludes named shadows from settings.custom', () => {
    expect(parsed.settings.custom.shadow.sm).toBeUndefined();
    expect(parsed.settings.custom.shadow.md).toBeUndefined();
  });

  it('excludes cssOnly shadows from both settings.shadow.presets and settings.custom.shadow', () => {
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',
      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        shadow: {
          sm: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', name: 'Small', slug: 'sm' },
          internal: { value: '0 0 0 1px rgb(0 0 0 / 0.1)', cssOnly: true },
        },
      },
    };
    const out = JSON.parse(generateThemeJson(cfg));
    expect(out.settings.shadow.presets).toEqual([
      { slug: 'sm', shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', name: 'Small' },
    ]);
    expect(out.settings.custom?.shadow?.internal).toBeUndefined();
  });
});

describe('generateThemeJson — cssOnly in custom-only categories', () => {
  it('excludes cssOnly fontWeight entries from settings.custom.fontWeight', () => {
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',
      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        fontWeight: {
          normal: { value: '400' },
          bold: { value: '700' },
          black: { value: '900', cssOnly: true },
        },
      },
    };
    const out = JSON.parse(generateThemeJson(cfg));
    expect(out.settings.custom.fontWeight).toEqual({ normal: '400', bold: '700' });
    expect(out.settings.custom.fontWeight.black).toBeUndefined();
  });

  it('excludes cssOnly lineHeight entries from settings.custom.lineHeight', () => {
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',
      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        lineHeight: {
          normal: { value: '1.6' },
          internal: { value: '1.15', cssOnly: true },
        },
      },
    };
    const out = JSON.parse(generateThemeJson(cfg));
    expect(out.settings.custom.lineHeight).toEqual({ normal: '1.6' });
    expect(out.settings.custom.lineHeight.internal).toBeUndefined();
  });

  it('excludes cssOnly radius entries from settings.custom.radius', () => {
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',
      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        radius: {
          md: { value: '4px' },
          pill: { value: '9999px', cssOnly: true },
        },
      },
    };
    const out = JSON.parse(generateThemeJson(cfg));
    expect(out.settings.custom.radius).toEqual({ md: '4px' });
    expect(out.settings.custom.radius.pill).toBeUndefined();
  });

  it('drops settings.custom.* entry entirely when all tokens in a custom-only category are cssOnly', () => {
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',
      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        transition: {
          internal: { value: '150ms ease', cssOnly: true },
        },
      },
    };
    const out = JSON.parse(generateThemeJson(cfg));
    expect(out.settings.custom?.transition).toBeUndefined();
  });

  it('still emits cssOnly tokens as CSS variables via baseStyles SCSS resolution', () => {
    // Sanity check: a cssOnly token in a custom category should still be
    // resolvable as a CSS var in the SCSS output path, even though it does
    // not appear anywhere in theme.json.
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',
      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        fontWeight: {
          normal: { value: '400' },
          black: { value: '900', cssOnly: true },
        },
      },
      baseStyles: {
        body: { fontWeight: 'black' },
      },
    };
    // Validation should pass (token exists in the fontWeight category)
    const out = JSON.parse(generateThemeJson(cfg));
    // In theme.json styles, custom-only category tokens resolve to the raw value
    expect(out.styles.typography.fontWeight).toBe('900');
    // And the token is excluded from settings.custom.fontWeight
    expect(out.settings.custom.fontWeight.black).toBeUndefined();
  });
});

describe('generateThemeJson — fluid font sizes', () => {
  const fluidConfig: C2bConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
  
    wpDir: 'dist/wp',
    wpThemeable: false,
    tokens: {
      fontSize: {
        small: { value: '1rem', name: 'Small', slug: 'small', fluid: { min: '0.875rem', max: '1rem' } },
        medium: { value: '1.125rem', name: 'Medium', slug: 'medium' },
      },
    },
  };

  const output = generateThemeJson(fluidConfig);
  const parsed = JSON.parse(output);

  it('includes fluid object on font sizes that have it', () => {
    const small = parsed.settings.typography.fontSizes.find((f: Record<string, unknown>) => f.slug === 'small');
    expect(small.fluid).toEqual({ min: '0.875rem', max: '1rem' });
  });

  it('omits fluid on font sizes without it', () => {
    const medium = parsed.settings.typography.fontSizes.find((f: Record<string, unknown>) => f.slug === 'medium');
    expect(medium.fluid).toBeUndefined();
  });
});

describe('generateThemeJson — typography flags', () => {
  it('sets fluid with explicit viewport anchors when fontSize tokens exist', () => {
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',

      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        fontSize: {
          small: { value: '1rem', name: 'Small', slug: 'small' },
        },
      },
      fluid: { minViewport: '320px', maxViewport: '1600px' },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    expect(parsed.settings.typography.fluid).toEqual({
      minViewportWidth: '320px',
      maxViewportWidth: '1600px',
    });
  });

  it('defaults to 320px / 1600px anchors when config.fluid is omitted', () => {
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',
      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        fontSize: {
          small: { value: '1rem', name: 'Small', slug: 'small' },
        },
      },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    expect(parsed.settings.typography.fluid).toEqual({
      minViewportWidth: '320px',
      maxViewportWidth: '1600px',
    });
  });

  it('passes custom viewport anchors through to theme.json', () => {
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',
      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        fontSize: {
          small: { value: '1rem', name: 'Small', slug: 'small' },
        },
      },
      fluid: { minViewport: '480px', maxViewport: '1440px' },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    expect(parsed.settings.typography.fluid).toEqual({
      minViewportWidth: '480px',
      maxViewportWidth: '1440px',
    });
  });

  it('does not set typography.fluid when no fontSize tokens', () => {
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',
    
      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        fontFamily: {
          base: { value: 'sans-serif', name: 'Sans', slug: 'body' },
        },
      },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    expect(parsed.settings.typography.fluid).toBeUndefined();
  });
});

describe('generateThemeJson — WordPress default preset flags', () => {
  const baseConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',

    wpDir: 'dist/wp',
  };

  it('never sets default preset flags (theme responsibility, not library)', () => {
    const cfg: C2bConfig = {
      ...baseConfig,
      wpThemeable: false,
      tokens: {
        colorPalette: { primary: { value: '#0073aa', name: 'Primary', slug: 'primary' } },
        colorGradient: { sunset: { value: 'linear-gradient(#ff6b6b, #feca57)', name: 'Sunset', slug: 'sunset' } },
        spacing: { md: { value: '1rem', slug: '40', name: 'Medium' } },
        shadow: { sm: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', name: 'Small', slug: 'sm' } },
      },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    expect(parsed.settings.color.defaultDuotone).toBeUndefined();
    expect(parsed.settings.color.defaultPalette).toBeUndefined();
    expect(parsed.settings.color.defaultGradients).toBeUndefined();
    expect(parsed.settings.spacing.defaultSpacingSizes).toBeUndefined();
    expect(parsed.settings.shadow.defaultPresets).toBeUndefined();
  });

  it('does not set shadow defaults when no shadow tokens', () => {
    const cfg: C2bConfig = {
      ...baseConfig,
      wpThemeable: false,
      tokens: {
        colorPalette: { primary: { value: '#0073aa', name: 'Primary', slug: 'primary' } },
      },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    expect(parsed.settings.shadow).toBeUndefined();
  });
});

describe('generateThemeJson — locked vs themeable mode', () => {
  const baseConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
    wpDir: 'dist/wp',
  };

  it('disables custom color, duotone, and gradient when wpThemeable is false', () => {
    const cfg: C2bConfig = {
      ...baseConfig,
      wpThemeable: false,
      tokens: {
        colorPalette: { primary: { value: '#0073aa', name: 'Primary', slug: 'primary' } },
      },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    expect(parsed.settings.color.custom).toBe(false);
    expect(parsed.settings.color.customDuotone).toBe(false);
    expect(parsed.settings.color.customGradient).toBe(false);
  });

  it('does not set custom flags when wpThemeable is true', () => {
    const cfg: C2bConfig = {
      ...baseConfig,
      wpThemeable: true,
      tokens: {
        colorPalette: { primary: { value: '#0073aa', name: 'Primary', slug: 'primary' } },
      },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    expect(parsed.settings.color.custom).toBeUndefined();
    expect(parsed.settings.color.customDuotone).toBeUndefined();
    expect(parsed.settings.color.customGradient).toBeUndefined();
  });

  it('places custom flags before palette and gradients in output', () => {
    const cfg: C2bConfig = {
      ...baseConfig,
      wpThemeable: false,
      tokens: {
        colorPalette: { primary: { value: '#0073aa', name: 'Primary', slug: 'primary' } },
        colorGradient: { sunset: { value: 'linear-gradient(#ff6b6b, #feca57)', name: 'Sunset', slug: 'sunset' } },
      },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    // Palette and gradients still present
    expect(parsed.settings.color.palette).toHaveLength(1);
    expect(parsed.settings.color.gradients).toHaveLength(1);
    // Custom creation disabled
    expect(parsed.settings.color.custom).toBe(false);
    expect(parsed.settings.color.customDuotone).toBe(false);
    expect(parsed.settings.color.customGradient).toBe(false);
    // Verify key order: custom flags appear before palette
    const keys = Object.keys(parsed.settings.color);
    expect(keys.indexOf('custom')).toBeLessThan(keys.indexOf('palette'));
    expect(keys.indexOf('customGradient')).toBeLessThan(keys.indexOf('gradients'));
  });

  it('creates color settings object for custom flags even without color tokens', () => {
    const cfg: C2bConfig = {
      ...baseConfig,
      wpThemeable: false,
      tokens: {
        spacing: { md: { value: '1rem', slug: '40', name: 'Medium' } },
      },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    expect(parsed.settings.color.custom).toBe(false);
    expect(parsed.settings.color.customDuotone).toBe(false);
    expect(parsed.settings.color.customGradient).toBe(false);
    expect(parsed.settings.color.palette).toBeUndefined();
  });
});

describe('generateThemeJson — fontFace', () => {
  const fontConfig: C2bConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
  
    wpDir: 'dist/wp',
    wpThemeable: false,
    tokens: {
      fontFamily: {
        inter: {
          value: 'Inter, sans-serif',
          name: 'Inter',
          slug: 'inter',
          fontFace: [
            { weight: '300', style: 'normal', src: 'inter-300-normal.woff2' },
          ],
        },
        system: {
          value: '-apple-system, sans-serif',
          name: 'System',
          slug: 'system',
        },
      },
    },
  };

  const output = generateThemeJson(fontConfig);
  const parsed = JSON.parse(output);

  it('includes fontFace array on fonts that have it', () => {
    const inter = parsed.settings.typography.fontFamilies.find((f: Record<string, unknown>) => f.slug === 'inter');
    expect(inter.fontFace).toEqual([
      {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '300',
        src: ['file:./assets/fonts/inter/inter-300-normal.woff2'],
      },
    ]);
  });

  it('omits fontFace on fonts without it', () => {
    const system = parsed.settings.typography.fontFamilies.find((f: Record<string, unknown>) => f.slug === 'system');
    expect(system.fontFace).toBeUndefined();
  });
});

describe('generateThemeJson — baseStyles', () => {
  const baseStylesConfig: C2bConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
    wpDir: 'dist/wp',
    wpThemeable: false,
    tokens: {
      fontFamily: {
        inter: { value: 'Inter, sans-serif', name: 'Inter', slug: 'inter' },
      },
      fontSize: {
        small: { value: '1rem', name: 'Small', slug: 'small' },
        medium: { value: '1.125rem', name: 'Medium', slug: 'medium' },
      },
    },
    baseStyles: {
      body: {
        fontFamily: 'inter',
        fontSize: 'medium',
        fontWeight: '400',
        lineHeight: '1.6',
      },
      heading: { fontFamily: 'inter' },
      h1: { fontSize: '4.5rem', fontWeight: '500' },
      h6: { fontSize: '1.45rem', fontWeight: '500', fontStyle: 'italic' },
      caption: { fontSize: 'small', fontStyle: 'italic', fontWeight: '300' },
    },
  };

  const parsed = JSON.parse(generateThemeJson(baseStylesConfig));

  it('does not include styles block when baseStyles absent', () => {
    const noBaseStyles = JSON.parse(generateThemeJson({ ...baseStylesConfig, baseStyles: undefined }));
    expect(noBaseStyles.styles).toBeUndefined();
  });

  it('resolves cssOnly preset tokens to their raw value in styles, not to a dangling preset var', () => {
    // A cssOnly fontSize token is not emitted to settings.typography.fontSizes,
    // so `--wp--preset--font-size--{slug}` will not exist in WordPress.
    // styles.elements.h1.typography.fontSize must use the underlying value
    // instead of a dangling preset var reference.
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',
      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        fontSize: {
          display: { value: '4.5rem', cssOnly: true },
        },
      },
      baseStyles: {
        h1: { fontSize: 'display' },
      },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    expect(parsed.settings.typography?.fontSizes).toBeUndefined();
    expect(parsed.styles.elements.h1.typography.fontSize).toBe('4.5rem');
  });

  it('resolves fontWeight and lineHeight token refs to their underlying value', () => {
    const cfg: C2bConfig = {
      prefix: 'test',
      tokensPath: 'src/styles/tokens.css',
      wpDir: 'dist/wp',
      wpThemeable: false,
      tokens: {
        fontWeight: { medium: { value: '500' } },
        lineHeight: { normal: { value: '1.6' } },
      },
      baseStyles: {
        body: { fontWeight: 'medium', lineHeight: 'normal' },
      },
    };
    const parsed = JSON.parse(generateThemeJson(cfg));
    expect(parsed.styles.typography.fontWeight).toBe('500');
    expect(parsed.styles.typography.lineHeight).toBe('1.6');
  });

  it('maps body to styles.typography with resolved token refs', () => {
    expect(parsed.styles.typography.fontFamily).toBe('var(--wp--preset--font-family--inter)');
    expect(parsed.styles.typography.fontSize).toBe('var(--wp--preset--font-size--medium)');
  });

  it('passes raw body values through', () => {
    expect(parsed.styles.typography.fontWeight).toBe('400');
    expect(parsed.styles.typography.lineHeight).toBe('1.6');
  });

  it('maps heading to styles.elements.heading', () => {
    expect(parsed.styles.elements.heading.typography.fontFamily).toBe('var(--wp--preset--font-family--inter)');
  });

  it('maps h1 to styles.elements.h1 with fontStyle normal default', () => {
    expect(parsed.styles.elements.h1.typography.fontSize).toBe('4.5rem');
    expect(parsed.styles.elements.h1.typography.fontWeight).toBe('500');
    expect(parsed.styles.elements.h1.typography.fontStyle).toBe('normal');
  });

  it('includes explicit fontStyle on h6', () => {
    expect(parsed.styles.elements.h6.typography.fontStyle).toBe('italic');
  });

  it('maps caption to styles.elements.caption with resolved token ref', () => {
    expect(parsed.styles.elements.caption.typography.fontSize).toBe('var(--wp--preset--font-size--small)');
    expect(parsed.styles.elements.caption.typography.fontStyle).toBe('italic');
    expect(parsed.styles.elements.caption.typography.fontWeight).toBe('300');
  });

  it('does not affect existing settings block', () => {
    expect(parsed.settings.typography.fontFamilies).toBeDefined();
    expect(parsed.settings.typography.fontSizes).toBeDefined();
    expect(parsed.version).toBe(3);
  });
});

describe('generateThemeJson — baseStyles spacing', () => {
  const spacingConfig: C2bConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
    wpDir: 'dist/wp',
    wpThemeable: false,
    tokens: {
      spacing: {
        large: { value: 'min(2.25rem, 3vw)', slug: '60', name: 'Large' },
      },
      fontFamily: {
        inter: { value: 'Inter, sans-serif', name: 'Inter', slug: 'inter' },
      },
    },
    baseStyles: {
      body: { fontFamily: 'inter', fontWeight: '400' },
      spacing: {
        padding: {
          top: '0',
          right: 'large',
          bottom: '0',
          left: 'large',
        },
      },
    },
  };

  const parsed = JSON.parse(generateThemeJson(spacingConfig));

  it('produces styles.spacing.padding with resolved token refs', () => {
    expect(parsed.styles.spacing.padding.right).toBe('var(--wp--preset--spacing--60)');
    expect(parsed.styles.spacing.padding.left).toBe('var(--wp--preset--spacing--60)');
  });

  it('passes raw padding values through unchanged', () => {
    expect(parsed.styles.spacing.padding.top).toBe('0');
    expect(parsed.styles.spacing.padding.bottom).toBe('0');
  });

  it('includes spacing alongside typography in styles', () => {
    expect(parsed.styles.typography).toBeDefined();
    expect(parsed.styles.spacing).toBeDefined();
  });

  it('handles partial padding (only some sides defined)', () => {
    const partialConfig: C2bConfig = {
      ...spacingConfig,
      baseStyles: {
        spacing: {
          padding: { left: 'large', right: 'large' },
        },
      },
    };
    const result = JSON.parse(generateThemeJson(partialConfig));
    expect(result.styles.spacing.padding).toEqual({
      left: 'var(--wp--preset--spacing--60)',
      right: 'var(--wp--preset--spacing--60)',
    });
    expect(result.styles.spacing.padding.top).toBeUndefined();
    expect(result.styles.spacing.padding.bottom).toBeUndefined();
  });

  it('does not produce styles.spacing when no spacing in baseStyles', () => {
    const noSpacingConfig: C2bConfig = {
      ...spacingConfig,
      baseStyles: {
        body: { fontFamily: 'inter' },
      },
    };
    const result = JSON.parse(generateThemeJson(noSpacingConfig));
    expect(result.styles.spacing).toBeUndefined();
  });
});

describe('generateThemeJson — baseStyles blockGap', () => {
  const baseConfig: C2bConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
    wpDir: 'dist/wp',
    wpThemeable: false,
    tokens: {
      spacing: {
        medium: { value: 'min(1.5rem, 2vw)', slug: '50', name: 'Medium' },
        large: { value: 'min(2.25rem, 3vw)', slug: '60', name: 'Large' },
      },
    },
  };

  it('resolves blockGap token ref to wp preset variable', () => {
    const config: C2bConfig = {
      ...baseConfig,
      baseStyles: {
        spacing: { blockGap: 'medium' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.spacing.blockGap).toBe('var(--wp--preset--spacing--50)');
  });

  it('passes raw blockGap values through unchanged', () => {
    const config: C2bConfig = {
      ...baseConfig,
      baseStyles: {
        spacing: { blockGap: '2rem' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.spacing.blockGap).toBe('2rem');
  });

  it('includes blockGap alongside padding in styles.spacing', () => {
    const config: C2bConfig = {
      ...baseConfig,
      baseStyles: {
        spacing: {
          blockGap: 'medium',
          padding: { right: 'large', left: 'large' },
        },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.spacing.blockGap).toBe('var(--wp--preset--spacing--50)');
    expect(result.styles.spacing.padding.right).toBe('var(--wp--preset--spacing--60)');
    expect(result.styles.spacing.padding.left).toBe('var(--wp--preset--spacing--60)');
  });

  it('produces only blockGap when no padding defined', () => {
    const config: C2bConfig = {
      ...baseConfig,
      baseStyles: {
        spacing: { blockGap: 'large' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.spacing.blockGap).toBe('var(--wp--preset--spacing--60)');
    expect(result.styles.spacing.padding).toBeUndefined();
  });
});

describe('generateThemeJson — baseStyles color', () => {
  const colorConfig: C2bConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
    wpDir: 'dist/wp',
    wpThemeable: false,
    tokens: {
      colorPalette: {
        primary: { value: '#0073aa', name: 'Primary', slug: 'primary' },
        secondary: { value: '#23282d', name: 'Secondary', slug: 'secondary' },
        base: { value: '#ffffff', name: 'Base', slug: 'base' },
      },
      fontFamily: {
        inter: { value: 'Inter, sans-serif', name: 'Inter', slug: 'inter' },
      },
    },
  };

  it('maps body color to styles.color.text', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        body: { color: 'secondary' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.color.text).toBe('var(--wp--preset--color--secondary)');
  });

  it('maps body background to styles.color.background', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        body: { background: 'base' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.color.background).toBe('var(--wp--preset--color--base)');
  });

  it('maps body color and background together', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        body: { color: 'secondary', background: 'base' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.color.text).toBe('var(--wp--preset--color--secondary)');
    expect(result.styles.color.background).toBe('var(--wp--preset--color--base)');
  });

  it('includes body color alongside body typography', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        body: { fontFamily: 'inter', color: 'secondary', background: 'base' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.typography.fontFamily).toBe('var(--wp--preset--font-family--inter)');
    expect(result.styles.color.text).toBe('var(--wp--preset--color--secondary)');
    expect(result.styles.color.background).toBe('var(--wp--preset--color--base)');
  });

  it('maps heading color to styles.elements.heading.color.text', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        heading: { fontFamily: 'inter', color: 'primary' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.elements.heading.color.text).toBe('var(--wp--preset--color--primary)');
    expect(result.styles.elements.heading.typography.fontFamily).toBe('var(--wp--preset--font-family--inter)');
  });

  it('maps individual heading color', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        h1: { fontSize: '4.5rem', color: 'primary' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.elements.h1.color.text).toBe('var(--wp--preset--color--primary)');
    expect(result.styles.elements.h1.typography.fontSize).toBe('4.5rem');
  });

  it('passes raw color values through unchanged', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        body: { color: '#333333', background: '#ffffff' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.color.text).toBe('#333333');
    expect(result.styles.color.background).toBe('#ffffff');
  });

  it('does not produce styles.color when no color in baseStyles', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        body: { fontFamily: 'inter' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.color).toBeUndefined();
    expect(result.styles.typography).toBeDefined();
  });

  it('creates element with only color and no typography', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        caption: { color: 'secondary' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.elements.caption.color.text).toBe('var(--wp--preset--color--secondary)');
    expect(result.styles.elements.caption.typography).toBeUndefined();
  });

  it('maps button color and background to styles.elements.button.color', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        button: { color: 'base', background: 'primary' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.elements.button.color.text).toBe('var(--wp--preset--color--base)');
    expect(result.styles.elements.button.color.background).toBe('var(--wp--preset--color--primary)');
  });

  it('maps link color to styles.elements.link.color.text', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        link: { color: 'primary' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.elements.link.color.text).toBe('var(--wp--preset--color--primary)');
  });

  it('maps link hoverColor to styles.elements.link.:hover.color.text', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        link: { color: 'primary', hoverColor: 'secondary' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.elements.link.color.text).toBe('var(--wp--preset--color--primary)');
    expect(result.styles.elements.link[':hover'].color.text).toBe('var(--wp--preset--color--secondary)');
  });

  it('does not include :hover when hoverColor is not defined', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        link: { color: 'primary' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.elements.link[':hover']).toBeUndefined();
  });

  it('passes raw hoverColor values through unchanged', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        link: { color: '#0000ff', hoverColor: '#ff0000' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.elements.link.color.text).toBe('#0000ff');
    expect(result.styles.elements.link[':hover'].color.text).toBe('#ff0000');
  });

  it('creates button element with only background', () => {
    const config: C2bConfig = {
      ...colorConfig,
      baseStyles: {
        button: { background: 'primary' },
      },
    };
    const result = JSON.parse(generateThemeJson(config));
    expect(result.styles.elements.button.color.background).toBe('var(--wp--preset--color--primary)');
    expect(result.styles.elements.button.color.text).toBeUndefined();
  });
});
