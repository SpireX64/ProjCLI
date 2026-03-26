import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { expandEditorTemplate } from '../lib/commands/open.js';

function q(p) {
  return process.platform === 'win32'
    ? `"${String(p).replace(/"/g, '\\"')}"`
    : `'${String(p).replace(/'/g, `'\\''`)}'`;
}

test('expandEditorTemplate replaces $dir and $root', () => {
  const m = new Map();
  const out = expandEditorTemplate('a $dir b $root c', '/wt', '/proj', m);
  assert.equal(out, `a ${q('/wt')} b ${q('/proj')} c`);
});

test('expandEditorTemplate $rc_workspace resolves relative to project root', () => {
  const m = new Map([['workspace', 'My.code-workspace']]);
  const out = expandEditorTemplate('code $rc_workspace', '/proj/worktrees/App-main', '/proj', m);
  assert.equal(out, `code ${q(path.join('/proj', 'My.code-workspace'))}`);
});

test('expandEditorTemplate $rc_code_workspace same as workspace', () => {
  const m = new Map([['code_workspace', 'w.code-workspace']]);
  const out = expandEditorTemplate('code $rc_code_workspace', '/wt', '/proj', m);
  assert.equal(out, `code ${q(path.join('/proj', 'w.code-workspace'))}`);
});

test('expandEditorTemplate $rc_* non-path keys are literal quoted', () => {
  const m = new Map([['tracker', 'https://github.com/org/repo']]);
  const out = expandEditorTemplate('x $rc_tracker y', '/wt', '/proj', m);
  assert.equal(out, `x ${q('https://github.com/org/repo')} y`);
});
