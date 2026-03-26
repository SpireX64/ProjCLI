import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'proj');
export const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export const ROOT_HINT = 'Run: proj dir /path/to/your/projects';

export function readConfig() {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

export function writeConfig(obj) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

export function getRoot() {
  const c = readConfig();
  return c.root ? path.resolve(c.root) : null;
}

export function setRoot(p) {
  const c = readConfig();
  c.root = path.resolve(p);
  writeConfig(c);
}

/**
 * @returns {Record<string, string>}
 */
export function getWorkspaces() {
  const c = readConfig();
  const w = c.workspaces;
  if (!w || typeof w !== 'object' || Array.isArray(w)) return {};
  /** @type {Record<string, string>} */
  const out = {};
  for (const [k, v] of Object.entries(w)) {
    if (typeof v === 'string' && k) out[k] = path.resolve(v);
  }
  return out;
}

/**
 * @param {string} name
 * @param {string} projectRootPath
 */
export function setWorkspace(name, projectRootPath) {
  const c = readConfig();
  if (!c.workspaces || typeof c.workspaces !== 'object' || Array.isArray(c.workspaces)) {
    c.workspaces = {};
  }
  c.workspaces[name] = path.resolve(projectRootPath);
  writeConfig(c);
}

/**
 * @param {string} name
 */
export function useWorkspace(name) {
  const w = getWorkspaces();
  const p = w[name];
  if (!p) throw new Error(`Unknown workspace: ${name}`);
  setRoot(p);
}

/**
 * @returns {string} resolved root path
 * @throws {Error} with `.hint` property when root is not configured
 */
export function requireRoot() {
  const r = getRoot();
  if (!r) {
    const err = new Error('Projects root is not set.');
    /** @type {any} */ (err).hint = ROOT_HINT;
    throw err;
  }
  return r;
}

const EDITOR_NAME_RE = /^[a-zA-Z0-9_-]+$/;

/**
 * Named editor launch templates from ~/.config/proj/config.json (`editors` map).
 * @returns {Record<string, string>}
 */
export function getEditors() {
  const c = readConfig();
  const e = c.editors;
  if (!e || typeof e !== 'object' || Array.isArray(e)) return {};
  /** @type {Record<string, string>} */
  const out = {};
  for (const [k, v] of Object.entries(e)) {
    if (typeof v === 'string' && EDITOR_NAME_RE.test(k)) out[k] = v;
  }
  return out;
}

/**
 * @param {string} name
 * @param {string} template e.g. `nvim $dir`
 */
export function setEditorTemplate(name, template) {
  if (!EDITOR_NAME_RE.test(name)) {
    throw new Error('Editor name must match [a-zA-Z0-9_-]+');
  }
  if (!template || !template.trim()) throw new Error('Missing command template');
  const c = readConfig();
  if (!c.editors || typeof c.editors !== 'object' || Array.isArray(c.editors)) {
    c.editors = {};
  }
  c.editors[name] = template.trim();
  writeConfig(c);
}

/**
 * @returns {string[]}
 */
export function listEditorNames() {
  return Object.keys(getEditors()).sort((a, b) => a.localeCompare(b));
}
