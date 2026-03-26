import fs from 'fs';
import path from 'path';
import { parseFolderName, validateFolderName } from './naming.js';
import { projrcPath } from './projrc.js';

/**
 * @param {string} s
 */
export function isCurrentProjectToken(s) {
  const t = String(s).trim();
  return t === '.' || t === '@';
}

/**
 * @param {string} root
 * @returns {{ basename: string, parsed: import('./naming.js').ParsedFolder, abs: string }[]}
 */
export function listProjectEntries(root) {
  if (!fs.existsSync(root)) return [];
  const out = [];
  for (const name of fs.readdirSync(root)) {
    if (name === '.fav' || name === '.tags') continue;
    const abs = path.join(root, name);
    let st;
    try {
      st = fs.lstatSync(abs);
    } catch {
      continue;
    }
    if (st.isSymbolicLink()) continue;
    if (!st.isDirectory()) continue;
    if (!validateFolderName(name)) continue;
    const parsed = parseFolderName(name);
    if (!parsed) continue;
    out.push({ basename: name, parsed, abs });
  }
  return out.sort((a, b) => a.basename.localeCompare(b.basename));
}

/**
 * @param {string} root
 */
export function projectNameIndex(root) {
  const entries = listProjectEntries(root);
  /** @type {Map<string, string[]>} */
  const byName = new Map();
  for (const e of entries) {
    const n = e.parsed.projectName;
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(e.basename);
  }
  return { entries, byName };
}

/**
 * @param {string} root
 * @param {string} projectName
 * @param {string} [exceptBasename]
 */
export function isProjectNameTaken(root, projectName, exceptBasename) {
  const { byName } = projectNameIndex(root);
  const list = byName.get(projectName) || [];
  if (!exceptBasename) return list.length > 0;
  return list.some((b) => b !== exceptBasename);
}

/**
 * @param {string} root
 * @param {string} query basename or ProjectName (not `.` / `@`)
 */
function resolveProjectNamed(root, query) {
  const entries = listProjectEntries(root);
  const exact = entries.filter((e) => e.basename === query);
  if (exact.length === 1) return exact[0];
  const byPn = entries.filter((e) => e.parsed.projectName === query);
  if (byPn.length === 1) return byPn[0];
  if (byPn.length > 1) {
    const err = new Error(
      `Ambiguous project name "${query}". Candidates: ${byPn.map((e) => e.basename).join(', ')}`
    );
    throw err;
  }
  if (exact.length > 1) {
    throw new Error(`Ambiguous basename "${query}"`);
  }
  throw new Error(`Project not found: ${query}`);
}

/**
 * Current project from cwd: must be under `root`, first path segment = project folder, `.projrc` present.
 * @param {string} root
 */
export function resolveProjectFromCwd(root) {
  let cwd;
  let rootAbs;
  try {
    cwd = fs.realpathSync(process.cwd());
    rootAbs = fs.realpathSync(path.resolve(root));
  } catch {
    throw new Error('Current directory is not under the projects root (set via proj dir).');
  }
  const relToRoot = path.relative(rootAbs, cwd);
  const under =
    relToRoot === '' || (!path.isAbsolute(relToRoot) && !relToRoot.split(path.sep).includes('..'));
  if (!under) {
    throw new Error('Current directory is not under the projects root (set via proj dir).');
  }
  if (cwd === rootAbs) {
    throw new Error('Current directory is the projects root; cd into a project first.');
  }
  const parts = relToRoot.split(path.sep).filter(Boolean);
  const basename = parts[0];
  if (!basename) {
    throw new Error('Current directory is the projects root; cd into a project first.');
  }
  if (!validateFolderName(basename)) {
    throw new Error(`Not a project folder under root: ${basename}`);
  }
  const projectAbs = path.join(rootAbs, basename);
  if (!fs.existsSync(projrcPath(projectAbs))) {
    throw new Error(
      `No .projrc in ${projectAbs}. Run proj verify or ensure you are inside a project tree.`
    );
  }
  return resolveProjectNamed(root, basename);
}

/**
 * @param {string} root
 * @param {string} query basename or ProjectName; `.` or `@` = current project (cwd under root)
 */
export function resolveProject(root, query) {
  const q = String(query).trim();
  if (isCurrentProjectToken(q)) return resolveProjectFromCwd(root);
  return resolveProjectNamed(root, q);
}

/**
 * Basenames + unique ProjectNames (for shell completion).
 * @param {string} root
 * @returns {string[]}
 */
export function listCompleteProjectNames(root) {
  const { entries, byName } = projectNameIndex(root);
  /** @type {Set<string>} */
  const lines = new Set();
  for (const e of entries) {
    lines.add(e.basename);
    const list = byName.get(e.parsed.projectName) || [];
    if (list.length === 1) lines.add(e.parsed.projectName);
  }
  lines.add('.');
  lines.add('@');
  return [...lines].sort((a, b) => a.localeCompare(b));
}
