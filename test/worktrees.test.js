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
    wtMode: 'main',
  });
  assert.deepEqual(parsePwdArgv(['MyApp', '--wt', 'x']), {
    projectQuery: 'MyApp',
    wtMode: 'x',
  });
  assert.deepEqual(parsePwdArgv(['My App']), {
    projectQuery: 'My App',
    wtMode: 'absent',
  });
});

test('parseOpenFlags -r vs --wt mutual exclusion', () => {
  const a = parseOpenFlags(['MyApp', '-r']);
  assert.equal(a.openRoot, true);
  assert.equal(a.wtSlug, 'absent');
  assert.throws(() => parseOpenFlags(['MyApp', '-r', '--wt', 'x']), /only one of/);
});
