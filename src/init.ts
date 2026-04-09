import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_FILENAME = 'c2b.config.json';
const EXAMPLE_FILENAME = 'c2b.config.example.json';

/**
 * Resolve the path to c2b.config.example.json shipped with the package.
 * Works whether the package is installed globally, locally, or run from source.
 */
function getExampleConfigPath(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // Package root is one level up from src/ (source) or dist/ (compiled)
  const packageRoot = dirname(dirname(thisFile));
  return join(packageRoot, EXAMPLE_FILENAME);
}

export interface InitOptions {
  cwd?: string;
}

export function init(options?: InitOptions): void {
  const cwd = options?.cwd ?? process.cwd();
  const targetPath = resolve(cwd, CONFIG_FILENAME);

  if (existsSync(targetPath)) {
    console.error(`c2b: ${CONFIG_FILENAME} already exists. Remove it first if you want to reinitialize.`);
    process.exit(1);
  }

  const examplePath = getExampleConfigPath();

  let content: string;
  try {
    content = readFileSync(examplePath, 'utf-8');
  } catch {
    throw new Error(`Could not read example config at ${examplePath}`);
  }

  writeFileSync(targetPath, content, 'utf-8');
  console.log(`c2b: Created ${CONFIG_FILENAME}\n`);
  console.log(`Next steps:`);
  console.log(`  1. Edit ${CONFIG_FILENAME} to match your project`);
  console.log(`  2. Add a script to your package.json:\n`);
  console.log(`     "scripts": {`);
  console.log(`       "c2b": "c2b generate"`);
  console.log(`     }\n`);
  console.log(`  3. Run: npm run c2b`);
}
