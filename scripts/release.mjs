#!/usr/bin/env node
/* Release helper for component2block.
 *
 * Usage:  pnpm run release <version>
 * Example: pnpm run release 0.2.2
 *
 * What it does (all local, nothing is pushed):
 *   1. Validates the version (semver) and that the working tree is clean
 *   2. Verifies you're on main and the tag doesn't already exist
 *   3. Moves CHANGELOG.md [Unreleased] content into a new [<version>] - YYYY-MM-DD section
 *   4. Bumps package.json version
 *   5. Runs pnpm install (refreshes pnpm-lock.yaml), pnpm test --run, pnpm build
 *   6. Stages CHANGELOG.md, package.json, pnpm-lock.yaml, and dist/
 *   7. Creates a "release: <version>" commit and a <version> tag
 *   8. Prints push instructions — pushing the tag triggers the publish workflow
 *
 * To undo before pushing: git tag -d <version> && git reset --hard HEAD^
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function capture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();
}

function fail(msg) {
  console.error(`release: ${msg}`);
  process.exit(1);
}

// --- 1. Node version must match .nvmrc --------------------------------------
// A mismatched Node version is the single biggest source of half-finished
// releases: pnpm install rewrites the lockfile differently on Node 18 vs 22,
// tests may fail to start, and native bindings (rolldown) can break outright.
// Fail fast before touching anything on disk.
try {
  const required = readFileSync(resolve(ROOT, '.nvmrc'), 'utf-8').trim().replace(/^v/, '');
  const requiredMajor = required.split('.')[0];
  const currentMajor = process.versions.node.split('.')[0];
  if (requiredMajor && currentMajor !== requiredMajor) {
    fail(
      `Node ${process.versions.node} is in use, but .nvmrc requires Node ${required}.\n` +
      `  Run: nvm use  (or: nvm install ${requiredMajor} && nvm use ${requiredMajor})\n` +
      `  Then re-run this script.`,
    );
  }
} catch (err) {
  // ENOENT (missing .nvmrc) is not fatal — skip the check. Anything else rethrows.
  if (err && err.code !== 'ENOENT') throw err;
}

// --- 2. Validate args --------------------------------------------------------
const version = process.argv[2];
if (!version) fail('Usage: pnpm run release <version>');
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  fail(`"${version}" is not a valid semver version.`);
}

// --- 2. Working tree must be clean -------------------------------------------
const status = capture('git status --porcelain');
if (status.length > 0) {
  fail('Working tree is not clean. Commit or stash changes first.');
}

// --- 3. Must be on main ------------------------------------------------------
const branch = capture('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') {
  fail(`Must be on main branch (currently on ${branch}).`);
}

// --- 4. Tag must not exist ---------------------------------------------------
try {
  capture(`git rev-parse --verify --quiet refs/tags/${version}`);
  fail(`Tag ${version} already exists.`);
} catch {
  // good — rev-parse exits non-zero when the tag doesn't exist
}

// --- 5. Read current version -------------------------------------------------
const pkgPath = resolve(ROOT, 'package.json');
const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));
if (pkgJson.version === version) {
  fail(`package.json is already at ${version}.`);
}

// --- 6. Update CHANGELOG.md --------------------------------------------------
// Moves everything between "## [Unreleased]" and the next "## [" heading into
// a new "## [<version>] - <date>" section. Fails loudly if Unreleased is empty
// so you can't ship a release with no notes.
const clPath = resolve(ROOT, 'CHANGELOG.md');
const cl = readFileSync(clPath, 'utf-8');
const UNRELEASED = '## [Unreleased]';
const idx = cl.indexOf(UNRELEASED);
if (idx === -1) fail('CHANGELOG.md is missing a "## [Unreleased]" section.');

const afterUnreleased = cl.slice(idx + UNRELEASED.length);
const nextSectionMatch = afterUnreleased.search(/\n## \[/);
const unreleasedBody = nextSectionMatch === -1
  ? afterUnreleased
  : afterUnreleased.slice(0, nextSectionMatch);
// Keep the leading newline so there's a blank line separator before the next
// version section in the output.
const rest = nextSectionMatch === -1 ? '' : afterUnreleased.slice(nextSectionMatch);

if (unreleasedBody.trim().length === 0) {
  fail('CHANGELOG.md [Unreleased] section is empty. Add entries before releasing.');
}

const today = new Date().toISOString().slice(0, 10);
const newChangelog =
  cl.slice(0, idx) +
  `${UNRELEASED}\n\n## [${version}] - ${today}${unreleasedBody}${rest}`;

writeFileSync(clPath, newChangelog, 'utf-8');

// --- 7. Bump package.json ----------------------------------------------------
pkgJson.version = version;
writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf-8');

// --- 8. Refresh lockfile, test, build ----------------------------------------
console.log('release: Refreshing pnpm-lock.yaml...');
run('pnpm install');

console.log('release: Running tests...');
run('pnpm test -- --run');

console.log('release: Building...');
run('pnpm run build');

// --- 9. Commit and tag -------------------------------------------------------
run('git add CHANGELOG.md package.json pnpm-lock.yaml dist');
run(`git commit -m "release: ${version}"`);
run(`git tag ${version}`);

// --- 10. Done ----------------------------------------------------------------
console.log('');
console.log(`release: ${version} ready.`);
console.log('');
console.log('Next steps:');
console.log('  1. Review the commit:  git show HEAD');
console.log('  2. Push to publish:    git push && git push --tags');
console.log('');
console.log('To undo before pushing:');
console.log(`  git tag -d ${version} && git reset --hard HEAD^`);
