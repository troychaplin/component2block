import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { generate } from '../src/index.js';

const TEST_DIR = resolve(import.meta.dirname ?? '.', '__test-output__');
const CONFIG_PATH = resolve(TEST_DIR, 'c2b.config.json');

// New config format: tokens wrapper + output wrapper, auto-derived slug/name
const testConfig = {
  prefix: 'inttest',
  output: {
    srcDir: 'src',
    themeDir: 'out/wp',
  },
  tokens: {
    color: {
      primary: { value: '#ff0000', name: 'Primary' },
      muted: '#999999',
    },
    spacing: {
      md: { value: '1rem', slug: '40', name: 'Medium' },
    },
    fontWeight: {
      bold: '700',
    },
    zIndex: {
      modal: '300',
    },
  },
};

describe('integration: generate() — default (locked)', () => {
  beforeAll(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    writeFileSync(CONFIG_PATH, JSON.stringify(testConfig, null, 2));
  });

  afterAll(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('generates expected files without tokens.wp.css', () => {
    const result = generate(CONFIG_PATH, TEST_DIR);

    expect(result.files).toHaveLength(4);

    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('src/tokens.css');
    expect(paths).not.toContain('src/_variables.scss');
    expect(paths).toContain('out/wp/tokens.css');
    expect(paths).not.toContain('out/wp/tokens.wp.css');
    expect(paths).toContain('out/wp/theme-inttest.json');
    expect(paths).toContain('out/wp/integrate.php');
  });

  it('writes tokens.css with correct content', () => {
    const content = readFileSync(resolve(TEST_DIR, 'src/tokens.css'), 'utf-8');
    expect(content).toContain('--inttest--color-primary: #ff0000;');
    expect(content).toContain('--inttest--color-muted: #999999;');
    expect(content).toContain('--inttest--spacing-md: 1rem;');
    expect(content).toContain('--inttest--font-weight-bold: 700;');
    expect(content).toContain('--inttest--z-modal: 300;');
  });

  it('writes theme.json — only object tokens appear in presets', () => {
    const content = readFileSync(resolve(TEST_DIR, 'out/wp/theme-inttest.json'), 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed.version).toBe(3);
    // Both "primary" (object entry) and "muted" (string shorthand in preset category) appear in palette
    expect(parsed.settings.color.palette).toEqual([
      { slug: 'primary', color: '#ff0000', name: 'Primary' },
      { slug: 'muted', color: '#999999', name: 'Muted' },
    ]);
    expect(parsed.settings.custom.fontWeight).toEqual({ bold: '700' });
    expect(parsed.settings.custom).not.toHaveProperty('zIndex');
  });

  it('writes integrate.php with theme.json filter and token enqueue', () => {
    const content = readFileSync(resolve(TEST_DIR, 'out/wp/integrate.php'), 'utf-8');
    expect(content).toContain('wp_theme_json_data_default');
    expect(content).toContain('update_with');
    expect(content).toContain('wp_enqueue_style');
    expect(content).toContain('tokens.wp.css');
    expect(content).toContain('tokens.css');
    expect(content).toContain('wp_enqueue_scripts');
    expect(content).toContain('enqueue_block_editor_assets');
  });
});

describe('integration: generate() — baseStyles', () => {
  const BS_TEST_DIR = resolve(import.meta.dirname ?? '.', '__test-output-bs__');
  const BS_CONFIG_PATH = resolve(BS_TEST_DIR, 'c2b.config.json');

  const baseStylesConfig = {
    ...testConfig,
    tokens: {
      ...testConfig.tokens,
      fontFamily: {
        inter: { value: 'Inter, sans-serif', name: 'Inter' },
      },
      fontSize: {
        medium: { value: '1.125rem', name: 'Medium' },
        small: { value: '1rem', name: 'Small' },
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
      h2: { fontSize: '3rem', fontWeight: '500' },
      caption: { fontSize: 'small', fontStyle: 'italic', fontWeight: '300' },
    },
  };

  beforeAll(() => {
    mkdirSync(BS_TEST_DIR, { recursive: true });
    writeFileSync(BS_CONFIG_PATH, JSON.stringify(baseStylesConfig, null, 2));
  });

  afterAll(() => {
    rmSync(BS_TEST_DIR, { recursive: true, force: true });
  });

  it('file count includes dual-output base-styles.css', () => {
    const result = generate(BS_CONFIG_PATH, BS_TEST_DIR);

    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('src/base-styles.css');
    expect(paths).toContain('out/wp/base-styles.css');
    // base files: src/tokens.css, out/wp/tokens.css, theme.json, integrate.php + base-styles.css ×2 = 6
    expect(result.files.length).toBeGreaterThanOrEqual(6);
  });

  it('base-styles.css has :where() selectors and matches across srcDir/themeDir', () => {
    generate(BS_CONFIG_PATH, BS_TEST_DIR);
    const srcContent = readFileSync(
      resolve(BS_TEST_DIR, 'src/base-styles.css'),
      'utf-8',
    );
    const wpContent = readFileSync(
      resolve(BS_TEST_DIR, 'out/wp/base-styles.css'),
      'utf-8',
    );

    expect(srcContent).toContain(':where(h1, h2, h3, h4, h5, h6) {');
    expect(srcContent).toContain(':where(h1) {');
    expect(srcContent).toContain(':where(h2) {');
    expect(srcContent).toContain(':where(figcaption) {');
    expect(srcContent).toContain('var(--inttest--font-family-inter)');
    expect(srcContent).toContain('var(--inttest--font-size-medium)');
    // Dual outputs are byte-identical
    expect(srcContent).toBe(wpContent);
  });

  it('theme.json includes styles block', () => {
    generate(BS_CONFIG_PATH, BS_TEST_DIR);
    const content = readFileSync(
      resolve(BS_TEST_DIR, 'out/wp/theme-inttest.json'),
      'utf-8',
    );
    const parsed = JSON.parse(content);

    expect(parsed.styles).toBeDefined();
    expect(parsed.styles.typography).toBeDefined();
    expect(parsed.styles.typography.fontFamily).toContain('--wp--preset--font-family--inter');
    expect(parsed.styles.elements).toBeDefined();
    expect(parsed.styles.elements.heading).toBeDefined();
    expect(parsed.styles.elements.h1).toBeDefined();
    expect(parsed.styles.elements.caption).toBeDefined();
  });

  it('settings remain unchanged when baseStyles is added', () => {
    generate(BS_CONFIG_PATH, BS_TEST_DIR);
    const content = readFileSync(
      resolve(BS_TEST_DIR, 'out/wp/theme-inttest.json'),
      'utf-8',
    );
    const parsed = JSON.parse(content);

    expect(parsed.version).toBe(3);
    expect(parsed.settings).toBeDefined();
    expect(parsed.settings.color.palette).toEqual([
      { slug: 'primary', color: '#ff0000', name: 'Primary' },
      { slug: 'muted', color: '#999999', name: 'Muted' },
    ]);
  });
});

describe('integration: generate() — baseStyles spacing', () => {
  const SP_TEST_DIR = resolve(import.meta.dirname ?? '.', '__test-output-sp__');
  const SP_CONFIG_PATH = resolve(SP_TEST_DIR, 'c2b.config.json');

  const spacingConfig = {
    ...testConfig,
    tokens: {
      ...testConfig.tokens,
      fontFamily: {
        inter: { value: 'Inter, sans-serif', name: 'Inter' },
      },
      fontSize: {
        medium: { value: '1.125rem', name: 'Medium' },
      },
    },
    baseStyles: {
      body: {
        fontFamily: 'inter',
        fontSize: 'medium',
        fontWeight: '400',
      },
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

  // Update spacing to include the "large" token referenced in padding
  const configWithLarge = {
    ...spacingConfig,
    tokens: {
      ...spacingConfig.tokens,
      spacing: {
        ...testConfig.tokens.spacing,
        large: { value: 'min(2.25rem, 3vw)', slug: '60', name: 'Large' },
      },
    },
  };

  beforeAll(() => {
    mkdirSync(SP_TEST_DIR, { recursive: true });
    writeFileSync(SP_CONFIG_PATH, JSON.stringify(configWithLarge, null, 2));
  });

  afterAll(() => {
    rmSync(SP_TEST_DIR, { recursive: true, force: true });
  });

  it('theme.json includes styles.spacing.padding with resolved refs', () => {
    generate(SP_CONFIG_PATH, SP_TEST_DIR);
    const content = readFileSync(resolve(SP_TEST_DIR, 'out/wp/theme-inttest.json'), 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed.styles.spacing).toBeDefined();
    expect(parsed.styles.spacing.padding.right).toBe('var(--wp--preset--spacing--60)');
    expect(parsed.styles.spacing.padding.left).toBe('var(--wp--preset--spacing--60)');
    expect(parsed.styles.spacing.padding.top).toBe('0');
  });

  it('layout.css includes root padding and alignfull rules (dual-output)', () => {
    generate(SP_CONFIG_PATH, SP_TEST_DIR);
    const srcContent = readFileSync(
      resolve(SP_TEST_DIR, 'src/layout.css'),
      'utf-8',
    );
    const wpContent = readFileSync(
      resolve(SP_TEST_DIR, 'out/wp/layout.css'),
      'utf-8',
    );

    expect(srcContent).toContain('--inttest--root-padding-right: var(--inttest--spacing-large);');
    expect(srcContent).toContain('.has-global-padding');
    expect(srcContent).toContain('.alignfull');
    expect(srcContent).toBe(wpContent);
  });

  it('base-styles.css does NOT contain layout utilities', () => {
    generate(SP_CONFIG_PATH, SP_TEST_DIR);
    const content = readFileSync(
      resolve(SP_TEST_DIR, 'src/base-styles.css'),
      'utf-8',
    );
    expect(content).not.toContain('.has-global-padding');
    expect(content).not.toContain('--inttest--root-padding-');
  });
});

describe('integration: generate() — themeable', () => {
  const WP_TEST_DIR = resolve(import.meta.dirname ?? '.', '__test-output-wp__');
  const WP_CONFIG_PATH = resolve(WP_TEST_DIR, 'c2b.config.json');

  const wpTestConfig = {
    ...testConfig,
    output: {
      ...testConfig.output,
      themeable: true,
    },
  };

  beforeAll(() => {
    mkdirSync(WP_TEST_DIR, { recursive: true });
    writeFileSync(WP_CONFIG_PATH, JSON.stringify(wpTestConfig, null, 2));
  });

  afterAll(() => {
    rmSync(WP_TEST_DIR, { recursive: true, force: true });
  });

  it('generates tokens.wp.css when themeable is true', () => {
    const result = generate(WP_CONFIG_PATH, WP_TEST_DIR);

    expect(result.files).toHaveLength(5);

    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('src/tokens.css');
    expect(paths).not.toContain('src/_variables.scss');
    expect(paths).toContain('out/wp/tokens.css');
    expect(paths).toContain('out/wp/tokens.wp.css');
    expect(paths).toContain('out/wp/theme-inttest.json');
    expect(paths).toContain('out/wp/integrate.php');
  });

  it('writes tokens.wp.css with var() mappings for object tokens only', () => {
    const content = readFileSync(resolve(WP_TEST_DIR, 'out/wp/tokens.wp.css'), 'utf-8');
    // "primary" is an object entry — gets slug, mapped to WP preset
    expect(content).toContain(
      '--inttest--color-primary: var(--wp--preset--color--primary, #ff0000);',
    );
    // "muted" is string shorthand in preset category — also gets WP preset mapping
    expect(content).toContain(
      '--inttest--color-muted: var(--wp--preset--color--muted, #999999);',
    );
    // spacing slug is explicitly set to "40"
    expect(content).toContain(
      '--inttest--spacing-md: var(--wp--preset--spacing--40, 1rem);',
    );
    expect(content).toContain('--inttest--font-weight-bold: 700;');
  });
});

describe('integration: generate() — scssVars + mediaQuery', () => {
  const SV_TEST_DIR = resolve(import.meta.dirname ?? '.', '__test-output-sv__');
  const SV_CONFIG_PATH = resolve(SV_TEST_DIR, 'c2b.config.json');

  const svConfig = {
    prefix: 'sv',
    output: {
      srcDir: 'src',
      themeDir: 'out/wp',
      scssVars: ['mediaQuery', 'spacing'],
    },
    tokens: {
      color: {
        primary: '#ff0000',
      },
      spacing: {
        sm: { value: '0.5rem', slug: '30', name: 'Small' },
        md: { value: '1rem', slug: '40', name: 'Medium' },
      },
      mediaQuery: {
        sm: '600px',
        md: '784px',
        lg: '1024px',
      },
    },
  };

  beforeAll(() => {
    mkdirSync(SV_TEST_DIR, { recursive: true });
    writeFileSync(SV_CONFIG_PATH, JSON.stringify(svConfig, null, 2));
  });

  afterAll(() => {
    rmSync(SV_TEST_DIR, { recursive: true, force: true });
  });

  it('emits _variables.scss only for opted-in categories', () => {
    const result = generate(SV_CONFIG_PATH, SV_TEST_DIR);
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('src/_variables.scss');

    const content = readFileSync(resolve(SV_TEST_DIR, 'src/_variables.scss'), 'utf-8');
    expect(content).toContain('$sv-media-query-sm: 600px;');
    expect(content).toContain('$sv-media-query-md: 784px;');
    expect(content).toContain('$sv-media-query-lg: 1024px;');
    expect(content).toContain('$sv-spacing-sm: 0.5rem;');
    expect(content).toContain('$sv-spacing-md: 1rem;');
    expect(content).not.toContain('$sv-color-');
  });

  it('keeps mediaQuery tokens out of tokens.css, tokens.wp.css, and theme.json', () => {
    generate(SV_CONFIG_PATH, SV_TEST_DIR);
    const tokensCss = readFileSync(resolve(SV_TEST_DIR, 'src/tokens.css'), 'utf-8');
    expect(tokensCss).not.toContain('media-query');

    const themeJson = JSON.parse(
      readFileSync(resolve(SV_TEST_DIR, 'out/wp/theme-sv.json'), 'utf-8'),
    );
    expect(JSON.stringify(themeJson)).not.toContain('media-query');
    expect(JSON.stringify(themeJson)).not.toContain('mediaQuery');
  });

  it('throws on unknown category in scssVars', () => {
    const badDir = resolve(import.meta.dirname ?? '.', '__test-output-sv-bad__');
    const badPath = resolve(badDir, 'c2b.config.json');
    mkdirSync(badDir, { recursive: true });
    writeFileSync(
      badPath,
      JSON.stringify({
        ...svConfig,
        output: { ...svConfig.output, scssVars: ['spacings'] },
      }),
    );
    expect(() => generate(badPath, badDir)).toThrow(/unknown category "spacings"/);
    rmSync(badDir, { recursive: true, force: true });
  });
});

describe('integration: generate() — flow-spacing emits typography.css', () => {
  const FS_TEST_DIR = resolve(import.meta.dirname ?? '.', '__test-output-flow__');
  const FS_CONFIG_PATH = resolve(FS_TEST_DIR, 'c2b.config.json');

  const fsConfig = {
    prefix: 'rds',
    output: {
      srcDir: 'src',
      themeDir: 'out/wp',
    },
    tokens: {
      spacing: {
        'x-small': { value: '0.5rem', slug: '20', name: 'X Small' },
        small: { value: '0.75rem', slug: '30', name: 'Small' },
        medium: { value: '1rem', slug: '40', name: 'Medium' },
        large: { value: '1.5rem', slug: '60', name: 'Large' },
        'x-large': { value: '2.25rem', slug: '70', name: 'X Large' },
      },
    },
    baseStyles: {
      h2: { marginBlockStart: 'x-large' },
      h3: { marginBlockStart: 'large' },
      spacing: {
        blockGap: 'medium',
        afterHeading: 'small',
      },
    },
  };

  beforeAll(() => {
    mkdirSync(FS_TEST_DIR, { recursive: true });
    writeFileSync(FS_CONFIG_PATH, JSON.stringify(fsConfig, null, 2));
  });

  afterAll(() => {
    rmSync(FS_TEST_DIR, { recursive: true, force: true });
  });

  it('writes typography.css to BOTH srcDir and themeDir (dual output)', () => {
    const result = generate(FS_CONFIG_PATH, FS_TEST_DIR);
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('src/typography.css');
    expect(paths).toContain('out/wp/typography.css');
  });

  it('typography.css contains heading + after-heading rules (and srcDir matches themeDir)', () => {
    generate(FS_CONFIG_PATH, FS_TEST_DIR);
    const wpContent = readFileSync(resolve(FS_TEST_DIR, 'out/wp/typography.css'), 'utf-8');
    const srcContent = readFileSync(resolve(FS_TEST_DIR, 'src/typography.css'), 'utf-8');
    expect(wpContent).toContain('.is-layout-constrained > * + h2 {');
    expect(wpContent).toContain('  margin-block-start: var(--rds--spacing-x-large);');
    expect(wpContent).toContain('.is-layout-constrained > :is(h1, h2, h3, h4, h5, h6) + * {');
    expect(wpContent).not.toContain(':where(.is-layout-constrained)');
    expect(wpContent).not.toContain('li + li');
    expect(srcContent).toBe(wpContent);
  });

  it('flow-spacing rules do NOT leak into base-styles.css', () => {
    generate(FS_CONFIG_PATH, FS_TEST_DIR);
    const content = readFileSync(resolve(FS_TEST_DIR, 'src/base-styles.css'), 'utf-8');
    expect(content).not.toContain('* + h2');
    expect(content).not.toContain('h1, h2, h3, h4, h5, h6) + *');
  });

  it('theme.json carries per-heading margin via styles.elements.{hN}.spacing.margin.top', () => {
    generate(FS_CONFIG_PATH, FS_TEST_DIR);
    const parsed = JSON.parse(
      readFileSync(resolve(FS_TEST_DIR, 'out/wp/theme-rds.json'), 'utf-8'),
    );
    expect(parsed.styles.elements.h2.spacing).toEqual({
      margin: { top: 'var(--wp--preset--spacing--70)' },
    });
    expect(parsed.styles.elements.h3.spacing).toEqual({
      margin: { top: 'var(--wp--preset--spacing--60)' },
    });
  });

  it('integrate.php is unchanged — typography.css is NOT auto-enqueued', () => {
    generate(FS_CONFIG_PATH, FS_TEST_DIR);
    const phpContent = readFileSync(resolve(FS_TEST_DIR, 'out/wp/integrate.php'), 'utf-8');
    expect(phpContent).not.toContain('typography.css');
  });

  it('skips typography.css when no flow-spacing properties are configured', () => {
    const noFlowDir = resolve(import.meta.dirname ?? '.', '__test-output-noflow__');
    const noFlowPath = resolve(noFlowDir, 'c2b.config.json');
    mkdirSync(noFlowDir, { recursive: true });
    writeFileSync(
      noFlowPath,
      JSON.stringify({
        prefix: 'noflow',
        output: { srcDir: 'src', themeDir: 'out/wp' },
        tokens: {
          spacing: {
            md: { value: '1rem', slug: '40', name: 'Medium' },
          },
        },
        baseStyles: { spacing: { blockGap: 'md' } },
      }),
    );
    const result = generate(noFlowPath, noFlowDir);
    const paths = result.files.map((f) => f.path);
    expect(paths).not.toContain('out/wp/typography.css');
    expect(paths).not.toContain('src/typography.css');
    rmSync(noFlowDir, { recursive: true, force: true });
  });
});
