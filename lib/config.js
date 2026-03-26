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
