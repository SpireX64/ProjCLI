import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { parseProjrcText, serializeProjrc, getDisplayName } from '../lib/projrc.js';

test('parseProjrcText comments and case', () => {
  const text = `
# hi
Name = My App
owner  =  Alice
empty =
created = 2020-01-01T00:00:00.000Z
`;
  const m = parseProjrcText(text);
  assert.equal(m.get('name'), 'My App');
  assert.equal(m.get('owner'), 'Alice');
  assert.equal(m.has('empty'), false);
  assert.equal(m.get('created'), '2020-01-01T00:00:00.000Z');
});

test('serializeProjrc stable', () => {
  const m = new Map([
    ['z', 'last'],
    ['a', 'first'],
  ]);
  const s = serializeProjrc(m);
  assert.ok(s.includes('a = first'));
  assert.ok(s.includes('z = last'));
});

test('getDisplayName fallback', () => {
  assert.equal(getDisplayName(new Map(), 'FooBar'), 'FooBar');
  assert.equal(getDisplayName(new Map([['name', 'Nice']]), 'FooBar'), 'Nice');
});

test('parseProjrcText preserves # in URL and strips value-only trailing comment', () => {
  const text = `tracker = https://github.com/org/repo#issues
name = App # display note
`;
  const m = parseProjrcText(text);
  assert.equal(m.get('tracker'), 'https://github.com/org/repo#issues');
  assert.equal(m.get('name'), 'App');
});

test('setRoot merges workspaces (fresh config module)', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'projcfg-'));
  const prevHome = process.env.HOME;
  process.env.HOME = tmp;
  try {
    const cfgUrl = pathToFileURL(path.join(__dirname, '..', 'lib', 'config.js')).href + `?t=${Date.now()}`;
    const cfg = await import(cfgUrl);
    cfg.writeConfig({ root: path.resolve('/old'), workspaces: { w1: '/a' } });
    cfg.setRoot('/new');
    const c = cfg.readConfig();
    assert.equal(c.root, path.resolve('/new'));
    assert.equal(c.workspaces.w1, path.resolve('/a'));
    cfg.setWorkspace('w2', '/b');
    assert.ok(cfg.getWorkspaces().w2);
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(path.join(tmp, '.config'), { recursive: true, force: true });
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
