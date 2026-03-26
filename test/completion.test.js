import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  completeTagIdsOutput,
  completeProjrcKeysOutput,
} from '../lib/completion.js';

test('completeProjrcKeysOutput is non-empty sorted lines', () => {
  const s = completeProjrcKeysOutput();
  assert.ok(s.includes('name'));
  assert.ok(s.includes('\n'));
});

test('completeTagIdsOutput reads .tags', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'projc-'));
  try {
    fs.writeFileSync(path.join(root, '.tags'), 'web a\niosApp b\n', 'utf8');
    const s = completeTagIdsOutput(root);
    assert.ok(s.includes('web'));
    assert.ok(s.includes('iosApp'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
