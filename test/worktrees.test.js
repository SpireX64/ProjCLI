import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import {
  validateWorktreeSlug,
  mainWorktreePath,
  worktreePathForSlug,
  resolveWtDirectory,
  parsePwdArgv,
  parseOpenFlags,
  resolveSubprojectUnderWorktree,
} from '../lib/worktrees.js';

test('validateWorktreeSlug accepts ASCII folder-safe names', () => {
  assert.equal(validateWorktreeSlug('StoreRefactor'), null);
  assert.equal(validateWorktreeSlug('new-store'), null);
  assert.equal(validateWorktreeSlug('a1_b2-c'), null);
});

test('validateWorktreeSlug rejects main and spaces', () => {
  assert.ok(validateWorktreeSlug('main'));
  assert.ok(validateWorktreeSlug('Main'));
  assert.ok(validateWorktreeSlug('a b'));
  assert.ok(validateWorktreeSlug(''));
});

test('mainWorktreePath and worktreePathForSlug', () => {
  const p = '/projects/pa_Foo';
  assert.equal(mainWorktreePath(p, 'Foo'), path.join(p, 'worktrees', 'Foo-main'));
  assert.equal(worktreePathForSlug(p, 'Foo', 'x'), path.join(p, 'worktrees', 'Foo-x'));
});

test('resolveWtDirectory accepts short slug and full dirname', () => {
  const p = '/proj/pa_MyApp';
  assert.equal(resolveWtDirectory(p, 'MyApp', 'fix'), path.join(p, 'worktrees', 'MyApp-fix'));
  assert.equal(
    resolveWtDirectory(p, 'MyApp', 'MyApp-fix'),
    path.join(p, 'worktrees', 'MyApp-fix')
  );
});

test('parsePwdArgv', () => {
  assert.deepEqual(parsePwdArgv(['MyApp', '--wt']), {
    projectQuery: 'MyApp',
    wtSlug: 'main',
    subproject: 'absent',
    openRoot: false,
  });
  assert.deepEqual(parsePwdArgv(['MyApp', '--wt', 'x']), {
    projectQuery: 'MyApp',
    wtSlug: 'x',
    subproject: 'absent',
    openRoot: false,
  });
  assert.deepEqual(parsePwdArgv(['My App']), {
    projectQuery: 'My App',
    wtSlug: 'absent',
    subproject: 'absent',
    openRoot: false,
  });
  assert.deepEqual(parsePwdArgv(['MyApp', '-r']), {
    projectQuery: 'MyApp',
    wtSlug: 'absent',
    subproject: 'absent',
    openRoot: true,
  });
  assert.deepEqual(parsePwdArgv(['MyApp', '-p', 'core', '--wt', 'fix']), {
    projectQuery: 'MyApp',
    wtSlug: 'fix',
    subproject: 'core',
    openRoot: false,
  });
});

test('parseOpenFlags -r vs --wt mutual exclusion', () => {
  const a = parseOpenFlags(['MyApp', '-r']);
  assert.equal(a.openRoot, true);
  assert.equal(a.wtSlug, 'absent');
  assert.equal(a.subproject, 'absent');
  assert.throws(() => parseOpenFlags(['MyApp', '-r', '--wt', 'x']), /only one of/);
});

test('parseOpenFlags ignores unsupported flags', () => {
  const r = parseOpenFlags(['.', '--bogus', '-x', 'code']);
  assert.deepEqual(r.positional, ['.', 'code']);
  assert.equal(r.openRoot, false);
  assert.equal(r.subproject, 'absent');
  const r2 = parseOpenFlags(['MyApp', '--foo']);
  assert.deepEqual(r2.positional, ['MyApp']);
});

test('parseOpenFlags -p and duplicate -p', () => {
  assert.deepEqual(parseOpenFlags(['MyApp', '-p', 'sub', 'vim']).positional, ['MyApp', 'vim']);
  assert.equal(parseOpenFlags(['MyApp', '-p', 'sub', 'vim']).subproject, 'sub');
  assert.equal(parseOpenFlags(['MyApp', '--project', 'sub', 'vim']).subproject, 'sub');
  assert.throws(() => parseOpenFlags(['MyApp', '-p', 'a', '-p', 'b']), /Duplicate -p/);
  assert.throws(() => parseOpenFlags(['MyApp', '-p']), /-p requires/);
});

test('parseOpenFlags -r ignores subproject for caller; still parses -p', () => {
  const r = parseOpenFlags(['MyApp', '-r', '-p', 'sub']);
  assert.equal(r.openRoot, true);
  assert.equal(r.subproject, 'sub');
});

test('parsePwdArgv -r vs --wt', () => {
  assert.throws(() => parsePwdArgv(['MyApp', '-r', '--wt']), /only one of/);
});

test('resolveSubprojectUnderWorktree', () => {
  const wt = '/proj/pa_X/worktrees/X-main';
  assert.equal(
    resolveSubprojectUnderWorktree(wt, 'packages/core'),
    path.join(wt, 'packages', 'core')
  );
  assert.throws(() => resolveSubprojectUnderWorktree(wt, '../outside'), /escapes/);
  assert.throws(() => resolveSubprojectUnderWorktree(wt, '/abs'), /relative/);
});
