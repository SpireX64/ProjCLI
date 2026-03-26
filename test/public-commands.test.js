import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_CLI_COMMANDS } from '../lib/public-commands.js';
import { helpForCommand } from '../lib/help.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const helpDir = path.join(__dirname, '..', 'help');

test('every public command has help file and helpForCommand works', () => {
  for (const cmd of PUBLIC_CLI_COMMANDS) {
    assert.ok(fs.existsSync(path.join(helpDir, `${cmd}.txt`)), `missing help/${cmd}.txt`);
    const h = helpForCommand(cmd);
    assert.ok(h && h.length > 0, `helpForCommand(${cmd})`);
  }
});

test('PUBLIC_CLI_COMMANDS is sorted', () => {
  const sorted = [...PUBLIC_CLI_COMMANDS].sort((a, b) => a.localeCompare(b));
  assert.deepEqual([...PUBLIC_CLI_COMMANDS], sorted);
});
