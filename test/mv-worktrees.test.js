import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { syncWorktreesAfterProjectRename } from '../lib/worktrees-sync.js';

function mktemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function gitWorktreeMvSupported() {
  const r = spawnSync('git', ['--version'], { encoding: 'utf8' });
  if (r.status !== 0 || r.error) return false;
  const m = (r.stdout || '').match(/git version (\d+)\.(\d+)/i);
  if (!m) return false;
  const ma = parseInt(m[1], 10);
  const mi = parseInt(m[2], 10);
  return ma > 2 || (ma === 2 && mi >= 30);
}

test('syncWorktreesAfterProjectRename renames worktree dirs without git (prefix change)', () => {
  const root = mktemp('proj-mv-');
  const wt = path.join(root, 'worktrees');
  fs.mkdirSync(path.join(wt, 'Foo-main'), { recursive: true });
  fs.mkdirSync(path.join(wt, 'Foo-extra'), { recursive: true });
  fs.writeFileSync(path.join(wt, 'Foo-main', 'f.txt'), 'x');

  syncWorktreesAfterProjectRename(root, 'Foo', 'Bar');

  assert.ok(fs.existsSync(path.join(wt, 'Bar-main', 'f.txt')));
  assert.ok(fs.existsSync(path.join(wt, 'Bar-extra')));
  assert.ok(!fs.existsSync(path.join(wt, 'Foo-main')));
});

test('syncWorktreesAfterProjectRename no main: fs rename only when project name changes', () => {
  const root = mktemp('proj-mv-');
  const wt = path.join(root, 'worktrees');
  fs.mkdirSync(path.join(wt, 'Foo-only'), { recursive: true });

  syncWorktreesAfterProjectRename(root, 'Foo', 'Bar');

  assert.ok(fs.existsSync(path.join(wt, 'Bar-only')));
  assert.ok(!fs.existsSync(path.join(wt, 'Foo-only')));
});

test('syncWorktreesAfterProjectRename no main same project: no-op', () => {
  const root = mktemp('proj-mv-');
  const wt = path.join(root, 'worktrees');
  fs.mkdirSync(path.join(wt, 'Foo-orphan'), { recursive: true });

  syncWorktreesAfterProjectRename(root, 'Foo', 'Foo');

  assert.ok(fs.existsSync(path.join(wt, 'Foo-orphan')));
});

test('syncWorktreesAfterProjectRename fs branch throws on collision', () => {
  const root = mktemp('proj-mv-');
  const wt = path.join(root, 'worktrees');
  fs.mkdirSync(path.join(wt, 'Foo-main'), { recursive: true });
  fs.mkdirSync(path.join(wt, 'Bar-main'), { recursive: true });

  assert.throws(
    () => syncWorktreesAfterProjectRename(root, 'Foo', 'Bar'),
    /target already exists/
  );
});

test(
  'syncWorktreesAfterProjectRename with git: renames dirs and git worktree list matches',
  { skip: !gitWorktreeMvSupported() },
  () => {
  const root = mktemp('proj-mv-git-');
  const wt = path.join(root, 'worktrees');
  const main = path.join(wt, 'Foo-main');
  fs.mkdirSync(main, { recursive: true });
  execFileSync('git', ['init'], { cwd: main, stdio: 'pipe' });
  execFileSync('git', ['config', 'user.email', 't@t.t'], { cwd: main, stdio: 'pipe' });
  execFileSync('git', ['config', 'user.name', 't'], { cwd: main, stdio: 'pipe' });
  fs.writeFileSync(path.join(main, 'a.txt'), 'a');
  execFileSync('git', ['add', 'a.txt'], { cwd: main, stdio: 'pipe' });
  execFileSync('git', ['commit', '-m', 'init'], { cwd: main, stdio: 'pipe' });

  const linked = path.join(wt, 'Foo-w1');
  execFileSync('git', ['worktree', 'add', '-b', 'w1', linked], { cwd: main, stdio: 'pipe' });

  syncWorktreesAfterProjectRename(root, 'Foo', 'Bar');

  const mainBar = path.join(wt, 'Bar-main');
  const linkedBar = path.join(wt, 'Bar-w1');
  assert.ok(fs.existsSync(path.join(mainBar, '.git')));
  assert.ok(fs.existsSync(path.join(linkedBar, '.git')));

  const list = execFileSync('git', ['worktree', 'list', '--porcelain'], {
    cwd: mainBar,
    encoding: 'utf8',
  });
  assert.match(list, /Bar-main/);
  assert.match(list, /Bar-w1/);
  }
);
