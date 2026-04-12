import { describe, it, expect } from 'vitest';
import { generateTokensWpCss } from '../src/generators/tokens-wp-css.js';
import type { C2bConfig } from '../src/types.js';

const config: C2bConfig = {
  prefix: 'test',
  tokensPath: 'src/styles/tokens.css',

  wpDir: 'dist/wp',
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
    radius: {
      md: { value: '4px' },
    },
    zIndex: {
      modal: { value: '300' },
    },
  },
};

describe('generateTokensWpCss', () => {
  const output = generateTokensWpCss(config);

  it('maps color tokens with slug to --wp--preset--color--{slug}', () => {
    expect(output).toContain(
      '--test--color-primary: var(--wp--preset--color--primary, #0073aa);',
    );
  });

  it('uses hardcoded value for color tokens without slug', () => {
    expect(output).toContain('--test--color-primary-hover: #005a87;');
  });

  it('maps spacing tokens to --wp--preset--spacing--{slug}', () => {
    expect(output).toContain(
      '--test--spacing-md: var(--wp--preset--spacing--40, 1rem);',
    );
  });

  it('maps fontFamily tokens to --wp--preset--font-family--{slug}', () => {
    expect(output).toContain(
      '--test--font-family-base: var(--wp--preset--font-family--body, sans-serif);',
    );
  });

  it('maps fontSize tokens with slug to --wp--preset--font-size--{slug}', () => {
    expect(output).toContain(
      '--test--font-size-sm: var(--wp--preset--font-size--small, 0.875rem);',
    );
  });

  it('uses hardcoded value for fontSize tokens without slug', () => {
    expect(output).toContain('--test--font-size-xs: 0.75rem;');
  });

  it('always uses hardcoded values for fontWeight (no wp preset)', () => {
    expect(output).toContain('--test--font-weight-bold: 700;');
    expect(output).not.toContain('--wp--preset--font-weight');
  });

  it('always uses hardcoded values for radius (no wp preset)', () => {
    expect(output).toContain('--test--radius-md: 4px;');
    expect(output).not.toContain('--wp--preset--radius');
  });

  it('always uses hardcoded values for zIndex (no wp preset)', () => {
    expect(output).toContain('--test--z-modal: 300;');
    expect(output).not.toContain('--wp--preset--z');
  });
});

describe('generateTokensWpCss — shadow presets', () => {
  const shadowConfig: C2bConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
  
    wpDir: 'dist/wp',
    tokens: {
      shadow: {
        sm: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', name: 'Small', slug: 'sm' },
        custom: { value: '0 0 0 2px rgb(0 0 0 / 0.2)' },
      },
    },
  };

  const output = generateTokensWpCss(shadowConfig);

  it('maps shadow tokens with slug to --wp--preset--shadow--{slug}', () => {
    expect(output).toContain(
      '--test--shadow-sm: var(--wp--preset--shadow--sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));',
    );
  });

  it('uses hardcoded value for shadow tokens without slug', () => {
    expect(output).toContain('--test--shadow-custom: 0 0 0 2px rgb(0 0 0 / 0.2);');
  });
});

describe('generateTokensWpCss — layout tokens', () => {
  const layoutConfig: C2bConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
  
    wpDir: 'dist/wp',
    tokens: {
      layout: {
        contentSize: { value: '645px' },
        wideSize: { value: '1340px' },
      },
    },
  };

  const output = generateTokensWpCss(layoutConfig);

  it('uses hardcoded values for layout (no wp preset)', () => {
    expect(output).toContain('--test--layout-content-size: 645px;');
    expect(output).toContain('--test--layout-wide-size: 1340px;');
    expect(output).not.toContain('--wp--preset--layout');
  });
});

describe('generateTokensWpCss — fluid font size fallbacks', () => {
  const fluidConfig: C2bConfig = {
    prefix: 'test',
    tokensPath: 'src/styles/tokens.css',
    wpDir: 'dist/wp',
    tokens: {
      fontSize: {
        medium: {
          value: '1.125rem',
          slug: 'medium',
          name: 'Medium',
          fluid: { min: '0.875rem', max: '1.125rem' },
        },
        static: {
          value: '0.75rem',
          slug: 'static',
          name: 'Static',
        },
      },
    },
  };

  const output = generateTokensWpCss(fluidConfig);

  it('uses clamp() as fallback for fluid font sizes', () => {
    expect(output).toContain(
      '--test--font-size-medium: var(--wp--preset--font-size--medium, clamp(0.875rem, 0.875rem + ((1vw - 0.2rem) * 0.3125), 1.125rem));'
    );
  });

  it('uses static fallback for non-fluid font sizes', () => {
    expect(output).toContain(
      '--test--font-size-static: var(--wp--preset--font-size--static, 0.75rem);'
    );
  });
});
