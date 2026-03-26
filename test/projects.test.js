import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { buildFolderName } from '../lib/naming.js';
import { resolveProject, resolveProjectFromCwd, isCurrentProjectToken } from '../lib/projects.js';

test('isCurrentProjectToken', () => {
  assert.equal(isCurrentProjectToken('.'), true);
  assert.equal(isCurrentProjectToken('@'), true);
  assert.equal(isCurrentProjectToken(' . '), true);
  assert.equal(isCurrentProjectToken(' @ '), true);
  assert.equal(isCurrentProjectToken('pp_Foo'), false);
});

test('resolveProject . and @ from nested cwd', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'projt-'));
  const origCwd = process.cwd();
  const base = buildFolderName('p', 'p', 'Foo');
  const projectAbs = path.join(root, base);
  const nested = path.join(projectAbs, 'worktrees', 'Foo-main', 'nested');
  try {
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(projectAbs, '.projrc'), 'name = Foo\n', 'utf8');
    process.chdir(nested);
    const a = resolveProject(root, '.');
    const b = resolveProject(root, '@');
    assert.equal(a.basename, base);
    assert.equal(b.basename, base);
    assert.equal(a.parsed.projectName, 'Foo');
    assert.equal(resolveProjectFromCwd(root).abs, projectAbs);
  } finally {
    process.chdir(origCwd);
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('resolveProjectFromCwd rejects cwd outside root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'projt-'));
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'projt-out-'));
  const origCwd = process.cwd();
  try {
    process.chdir(other);
    assert.throws(() => resolveProjectFromCwd(root), /not under the projects root/);
  } finally {
    process.chdir(origCwd);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(other, { recursive: true, force: true });
  }
});

test('resolveProjectFromCwd rejects projects root as cwd', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'projt-'));
  const origCwd = process.cwd();
  try {
    process.chdir(root);
    assert.throws(() => resolveProjectFromCwd(root), /projects root; cd into a project/);
  } finally {
    process.chdir(origCwd);
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('resolveProjectFromCwd rejects missing .projrc', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'projt-'));
  const base = buildFolderName('p', 'p', 'Bar');
  const projectAbs = path.join(root, base);
  const nested = path.join(projectAbs, 'inside');
  const origCwd = process.cwd();
  try {
    fs.mkdirSync(nested, { recursive: true });
    process.chdir(nested);
    assert.throws(() => resolveProjectFromCwd(root), /No \.projrc/);
  } finally {
    process.chdir(origCwd);
    fs.rmSync(root, { recursive: true, force: true });
  }
});
