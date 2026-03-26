import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFolderName,
  buildFolderName,
  validateTagSegment,
  validateFolderName,
  normalizeToPascalCaseProjectName,
} from '../lib/naming.js';

test('parseFolderName without tags', () => {
  const p = parseFolderName('pa_MyApp');
  assert.equal(p.projectName, 'MyApp');
  assert.deepEqual(p.tags, []);
});

test('parseFolderName rejects legacy tag suffix in folder name', () => {
  assert.equal(parseFolderName('pa_MyApp_web-rn'), null);
});

test('validateTagSegment', () => {
  assert.equal(validateTagSegment('rn'), true);
  assert.equal(validateTagSegment('iosApp'), true);
  assert.equal(validateTagSegment('Web'), false);
});

test('buildFolderName', () => {
  assert.equal(buildFolderName('p', 'a', 'X'), 'pa_X');
});

test('invalid folder name', () => {
  assert.equal(validateFolderName('not_a_project'), false);
});

test('normalizeToPascalCaseProjectName preserves valid PascalCase', () => {
  assert.equal(normalizeToPascalCaseProjectName('TestProj'), 'TestProj');
  assert.equal(normalizeToPascalCaseProjectName('  MyApp2  '), 'MyApp2');
});

test('normalizeToPascalCaseProjectName capitalizes first letter only for one token', () => {
  assert.equal(normalizeToPascalCaseProjectName('testProj'), 'TestProj');
  assert.equal(normalizeToPascalCaseProjectName('iosApp'), 'IosApp');
});

test('normalizeToPascalCaseProjectName derives from path-like strings', () => {
  assert.equal(normalizeToPascalCaseProjectName('my-cool-app'), 'MyCoolApp');
  assert.equal(normalizeToPascalCaseProjectName('testproj'), 'Testproj');
});
