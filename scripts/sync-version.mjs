#!/usr/bin/env node
/**
 * Propagate a release version into the Claude Code plugin manifest.
 *
 * semantic-release bumps package.json only, but Claude Code reads the version from
 * .claude-plugin/plugin.json and serves the cached copy until that string changes.
 * Without this step the two drift apart and plugin users stop receiving updates.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];

if (!version) {
  console.error('usage: sync-version.mjs <version>');
  process.exit(1);
}

const manifestPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.claude-plugin',
  'plugin.json'
);

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.version = version;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`.claude-plugin/plugin.json version -> ${version}`);
