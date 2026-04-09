import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { init } from '../src/init.js';

const TEST_DIR = resolve(import.meta.dirname ?? '.', '__test-init__');
const CONFIG_FILE = resolve(TEST_DIR, 'c2b.config.json');
const EXAMPLE_CONFIG = resolve(import.meta.dirname ?? '.', '..', 'c2b.config.example.json');

describe('init', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('creates c2b.config.json in the target directory', () => {
    init({ cwd: TEST_DIR });

    expect(existsSync(CONFIG_FILE)).toBe(true);
  });

  it('output is valid JSON matching the example config', () => {
    init({ cwd: TEST_DIR });

    const created = readFileSync(CONFIG_FILE, 'utf-8');
    const example = readFileSync(EXAMPLE_CONFIG, 'utf-8');
    expect(JSON.parse(created)).toEqual(JSON.parse(example));
  });

  it('refuses to overwrite an existing c2b.config.json', () => {
    writeFileSync(CONFIG_FILE, '{}');

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => init({ cwd: TEST_DIR })).toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(1);

    // Original file should be untouched
    expect(readFileSync(CONFIG_FILE, 'utf-8')).toBe('{}');

    mockExit.mockRestore();
  });
});
