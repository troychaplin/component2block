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
    expect(paths).toContain('out/wp/tokens.css');
    expect(paths).not.toContain('out/wp/tokens.wp.css');
    expect(paths).toContain('out/wp/theme.json');
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
    const content = readFileSync(resolve(TEST_DIR, 'out/wp/theme.json'), 'utf-8');
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

  it('file count includes base-styles.scss', () => {
    const result = generate(BS_CONFIG_PATH, BS_TEST_DIR);

    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('src/base-styles.scss');
    // base files: src/tokens.css, out/wp/tokens.css, theme.json, integrate.php + base-styles.scss = 5
    expect(result.files.length).toBeGreaterThanOrEqual(5);
  });

  it('base-styles.scss has :where() selectors', () => {
    generate(BS_CONFIG_PATH, BS_TEST_DIR);
    const content = readFileSync(
      resolve(BS_TEST_DIR, 'src/base-styles.scss'),
      'utf-8',
    );

    expect(content).toContain(':where(h1, h2, h3, h4, h5, h6) {');
    expect(content).toContain(':where(h1) {');
    expect(content).toContain(':where(h2) {');
    expect(content).toContain(':where(figcaption) {');
    expect(content).toContain('var(--inttest--font-family-inter)');
    expect(content).toContain('var(--inttest--font-size-medium)');
  });

  it('theme.json includes styles block', () => {
    generate(BS_CONFIG_PATH, BS_TEST_DIR);
    const content = readFileSync(
      resolve(BS_TEST_DIR, 'out/wp/theme.json'),
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
      resolve(BS_TEST_DIR, 'out/wp/theme.json'),
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
    const content = readFileSync(resolve(SP_TEST_DIR, 'out/wp/theme.json'), 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed.styles.spacing).toBeDefined();
    expect(parsed.styles.spacing.padding.right).toBe('var(--wp--preset--spacing--60)');
    expect(parsed.styles.spacing.padding.left).toBe('var(--wp--preset--spacing--60)');
    expect(parsed.styles.spacing.padding.top).toBe('0');
  });

  it('base-styles.scss includes root padding and alignfull rules', () => {
    generate(SP_CONFIG_PATH, SP_TEST_DIR);
    const content = readFileSync(
      resolve(SP_TEST_DIR, 'src/base-styles.scss'),
      'utf-8',
    );

    expect(content).toContain('--inttest--root-padding-right: var(--inttest--spacing-large);');
    expect(content).toContain('.has-global-padding');
    expect(content).toContain('.alignfull');
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
    expect(paths).toContain('out/wp/tokens.css');
    expect(paths).toContain('out/wp/tokens.wp.css');
    expect(paths).toContain('out/wp/theme.json');
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
