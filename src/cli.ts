#!/usr/bin/env node

import { generate } from './index.js';
import { init } from './init.js';

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || command === '--help') {
  printUsage();
  process.exit(0);
}

if (command === 'init') {
  try {
    init();
  } catch (error) {
    console.error(`c2b: ${error instanceof Error ? error.message : 'An unexpected error occurred.'}`);
    process.exit(1);
  }
  process.exit(0);
}

if (command !== 'generate') {
  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

// Parse flags
let configPath: string | undefined;
let dryRun = false;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--config' && args[i + 1]) {
    configPath = args[++i];
  } else if (args[i] === '--dry-run') {
    dryRun = true;
  }
}

try {
  if (dryRun) {
    const { loadConfig } = await import('./config.js');
    const { generateTokensCss } = await import('./generators/tokens-css.js');
    const { generateTokensScss } = await import('./generators/tokens-scss.js');
    const { generateTokensWpCss } = await import('./generators/tokens-wp-css.js');
    const { generateThemeJson } = await import('./generators/theme-json.js');
    const { generateIntegratePhp } = await import('./generators/integrate-php.js');
    const { generateFontsCss } = await import('./generators/fonts-css.js');
    const { generateContentScss } = await import('./generators/content-scss.js');

    const config = loadConfig(configPath);

    console.log('=== tokens.css ===');
    console.log(generateTokensCss(config));
    console.log('=== _tokens.scss ===');
    console.log(generateTokensScss(config));
    const fontsCss = generateFontsCss(config);
    if (fontsCss) {
      console.log('=== fonts.css ===');
      console.log(fontsCss);
    }
    const contentScss = generateContentScss(config);
    if (contentScss) {
      console.log('=== base-styles.scss ===');
      console.log(contentScss);
    }
    if (config.themeable) {
      console.log('=== tokens.wp.css ===');
      console.log(generateTokensWpCss(config));
    }
    console.log(`=== theme-${config.prefix}.json ===`);
    console.log(generateThemeJson(config));
    console.log('=== integrate.php ===');
    console.log(generateIntegratePhp(config.prefix));
  } else {
    const result = generate(configPath);
    console.log('c2b: generated files:');
    for (const file of result.files) {
      console.log(`  ${file.path} (${file.size} bytes)`);
    }
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(`c2b: ${error.message}`);
  } else {
    console.error('c2b: An unexpected error occurred.');
  }
  process.exit(1);
}

function printUsage(): void {
  console.log(`
c2b — Generate WordPress assets from design token config

Usage:
  c2b <command> [options]

Commands:
  init              Create a c2b.config.json from the example template
  generate          Read config and generate all output files
  help              Show this help message

Options (generate):
  --config <path>   Path to config file (default: ./c2b.config.json)
  --dry-run         Output to stdout instead of writing files
`.trim());
}
