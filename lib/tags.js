import fs from 'fs';
import path from 'path';
import { validateTagSegment } from './naming.js';

/**
 * @param {string} root
 */
export function tagsFilePath(root) {
  return path.join(root, '.tags');
}

/**
 * @returns {{ ids: string[], descriptions: Map<string, string>, duplicateWarnings: string[] }}
 */
export function loadTags(root) {
  const p = tagsFilePath(root);
  const duplicateWarnings = [];
  /** @type {Map<string, string>} */
  const descriptions = new Map();
  if (!fs.existsSync(p)) {
    return { ids: [], descriptions, duplicateWarnings };
  }
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const t = line.trimEnd();
    if (!t || t.startsWith('#')) continue;
    const sp = t.indexOf(' ');
    const id = sp === -1 ? t : t.slice(0, sp);
    const desc = sp === -1 ? '' : t.slice(sp + 1);
    if (!validateTagSegment(id)) continue;
    if (/\r|\n/.test(desc)) continue;
    if (descriptions.has(id)) {
      duplicateWarnings.push(`Duplicate tag id in .tags (keeping first): ${id}`);
      continue;
    }
    descriptions.set(id, desc);
  }
  return { ids: [...descriptions.keys()], descriptions, duplicateWarnings };
}

/**
 * @param {string} root
 * @param {Map<string, string>} map id -> description
 */
export function saveTags(root, map) {
  const p = tagsFilePath(root);
  const lines = [];
  for (const [id, desc] of [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (desc === '') lines.push(id);
    else lines.push(`${id} ${desc}`);
  }
  fs.writeFileSync(p, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');
}

/**
 * When .tags is empty or missing, register tag ids with empty descriptions.
 * @param {string} root
 * @param {string[]} tagIds
 */
export function ensureTagsInRegistry(root, tagIds) {
  if (tagIds.length === 0) return;
  const { ids, descriptions, duplicateWarnings } = loadTags(root);
  for (const w of duplicateWarnings) console.warn(w);
  if (ids.length > 0) return;
  for (const id of tagIds) {
    if (!validateTagSegment(id)) throw new Error(`Invalid tag id: ${id}`);
    if (!descriptions.has(id)) descriptions.set(id, '');
  }
  saveTags(root, descriptions);
}

/**
 * @param {string} root
 * @param {string[]} segments
 */
export function validateTagsAgainstRegistry(root, segments) {
  const { ids } = loadTags(root);
  if (ids.length === 0) return { ok: true, unknown: [] };
  const set = new Set(ids);
  const unknown = segments.filter((s) => !set.has(s));
  return { ok: unknown.length === 0, unknown };
}
