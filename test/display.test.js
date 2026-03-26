import test from 'node:test';
import assert from 'node:assert/strict';
import { formatProjectLine } from '../lib/display.js';
import { describeOwnType } from '../lib/naming.js';

test('describeOwnType', () => {
  assert.equal(describeOwnType('p', 'a'), 'personal application');
});

test('formatProjectLine with tags', () => {
  const line = formatProjectLine(
    {
      own: 'p',
      type: 'a',
      projectName: 'MyApp',
      tags: [],
    },
    ['web', 'rn']
  );
  assert.equal(line, 'MyApp (personal application) — web, rn');
});

test('formatProjectLine without tags', () => {
  const line = formatProjectLine(
    {
      own: 'p',
      type: 'a',
      projectName: 'Solo',
      tags: [],
    },
    []
  );
  assert.equal(line, 'Solo (personal application)');
});
