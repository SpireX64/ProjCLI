import fs from 'fs';
import path from 'path';
import { computeCreatedTimestamp } from './git-status.js';
import { validateTagSegment } from './naming.js';

export const PROJRC_FILENAME = '.projrc';

/**
 * @param {string} projectAbs
 */
export function projrcPath(projectAbs) {
  return path.join(projectAbs, PROJRC_FILENAME);
}

/**
 * Strip trailing inline comment: whitespace + # ... at end of value only.
 * Keeps URLs like https://host/path#fragment (no space before #).
 * @param {string} value
 */
function stripTrailingValueComment(value) {
  return value.replace(/\s+#.*$/, '');
}

/**
 * Parse .projrc into a Map (keys lowercased).
 * Full-line comments: trimmed line empty or starts with #.
 * @param {string} text
 * @returns {Map<string, string>}
 */
export function parseProjrcText(text) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim().toLowerCase();
    let value = trimmed.slice(eq + 1).trim();
    value = stripTrailingValueComment(value).trim();
    if (!key || value === '') continue;
    map.set(key, value);
  }
  return map;
}

/**
 * @param {string} projectAbs
 * @returns {Map<string, string>}
 */
export function readProjrc(projectAbs) {
  const p = projrcPath(projectAbs);
  if (!fs.existsSync(p)) return new Map();
  const text = fs.readFileSync(p, 'utf8');
  return parseProjrcText(text);
}

/**
 * @param {string} raw
 * @returns {string[]}
 */
export function parseTagsValue(raw) {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[\s,]+/)
    .filter(Boolean);
}

/**
 * @param {string[]} tags
 */
export function formatTagsForProjrc(tags) {
  return tags.join(', ');
}

/**
 * @param {string} projectAbs
 * @returns {string[]}
 */
export function readProjectTags(projectAbs) {
  return parseTagsValue(readProjrc(projectAbs).get('tags'));
}

/**
 * @param {string[]} tags
 */
export function assertValidTagList(tags) {
  if (tags.length > 5) throw new Error('At most 5 tags');
  for (const t of tags) {
    if (!validateTagSegment(t)) throw new Error(`Invalid tag: ${t}`);
  }
}

/**
 * @param {string} projectAbs
 * @param {string[]} tags
 */
export function setProjectTags(projectAbs, tags) {
  assertValidTagList(tags);
  const map = readProjrc(projectAbs);
  if (tags.length === 0) map.delete('tags');
  else map.set('tags', formatTagsForProjrc(tags));
  writeProjrc(projectAbs, map);
}

/**
 * @param {Map<string, string>} map
 */
export function serializeProjrc(map) {
  const keys = [...map.keys()].sort((a, b) => a.localeCompare(b));
  const lines = [];
  for (const k of keys) {
    const v = map.get(k);
    if (v === undefined || v === '') continue;
    lines.push(`${k} = ${v}`);
  }
  return lines.join('\n') + (lines.length ? '\n' : '');
}

/**
 * @param {string} projectAbs
 * @param {Map<string, string>} map
 */
export function writeProjrc(projectAbs, map) {
  fs.writeFileSync(projrcPath(projectAbs), serializeProjrc(map), 'utf8');
}

/**
 * Read .projrc, set one key (lowercase), write back.
 * @param {string} projectAbs
 * @param {string} key
 * @param {string} value
 */
export function mergeProjrcValue(projectAbs, key, value) {
  const map = readProjrc(projectAbs);
  map.set(key.toLowerCase(), value);
  writeProjrc(projectAbs, map);
}

/**
 * @param {Map<string, string>} map
 * @param {string} folderProjectName PascalCase from folder
 */
export function getDisplayName(map, folderProjectName) {
  const n = map.get('name');
  if (n && n.trim()) return n.trim();
  return folderProjectName;
}

/**
 * Write or merge minimal .projrc: created, optional name, optional owner, optional tags.
 * @param {string} projectAbs
 * @param {{ projectName: string, owner?: string, tags?: string[] }} meta
 */
export function writeInitialProjrc(projectAbs, meta) {
  const created = computeCreatedTimestamp(projectAbs, meta.projectName);
  /** @type {Map<string, string>} */
  const map = new Map();
  map.set('created', created);
  map.set('name', meta.projectName);
  if (meta.owner && meta.owner.trim()) map.set('owner', meta.owner.trim());
  if (meta.tags && meta.tags.length > 0) {
    assertValidTagList(meta.tags);
    map.set('tags', formatTagsForProjrc(meta.tags));
  }
  writeProjrc(projectAbs, map);
}
