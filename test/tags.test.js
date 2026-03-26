import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadTags, saveTags } from '../lib/tags.js';

test('loadTags empty file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'projt-'));
  try {
    const { ids, duplicateWarnings } = loadTags(dir);
    assert.deepEqual(ids, []);
    assert.deepEqual(duplicateWarnings, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('duplicate tag ids first wins + warning', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'projt-'));
  try {
    fs.writeFileSync(path.join(dir, '.tags'), 'web a\nweb b\n', 'utf8');
    const { ids, descriptions, duplicateWarnings } = loadTags(dir);
    assert.equal(descriptions.get('web'), 'a');
    assert.ok(duplicateWarnings.some((w) => w.includes('web')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('saveTags roundtrip', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'projt-'));
  try {
    const m = new Map([
      ['rn', ''],
      ['web', 'browser'],
    ]);
    saveTags(dir, m);
    const { ids } = loadTags(dir);
    assert.ok(ids.includes('rn'));
    assert.ok(ids.includes('web'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
