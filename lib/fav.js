import fs from 'fs';
import path from 'path';

/**
 * @param {string} root
 */
export function favDir(root) {
  return path.join(root, '.fav');
}

export function ensureFavDir(root) {
  const d = favDir(root);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

/**
 * @param {string} root
 * @param {string} projectBasename
 */
export function addFavorite(root, projectBasename) {
  ensureFavDir(root);
  const target = path.join(root, projectBasename);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    throw new Error(`Project directory not found: ${projectBasename}`);
  }
  const linkPath = path.join(favDir(root), projectBasename);
  let linkSt;
  try {
    linkSt = fs.lstatSync(linkPath);
  } catch (e) {
    if (/** @type {NodeJS.ErrnoException} */ (e).code !== 'ENOENT') throw e;
    linkSt = null;
  }
  if (linkSt) {
    throw new Error(`Favorite already exists: ${projectBasename}`);
  }
  const rel = path.join('..', projectBasename);
  fs.symlinkSync(rel, linkPath);
}

/**
 * @param {string} root
 * @param {string} name symlink name (usually project basename)
 */
export function removeFavorite(root, name) {
  const linkPath = path.join(favDir(root), name);
  let st;
  try {
    st = fs.lstatSync(linkPath);
  } catch {
    throw new Error(`Favorite not found: ${name}`);
  }
  if (!st.isSymbolicLink()) {
    throw new Error(`Not a symlink: ${name}`);
  }
  fs.unlinkSync(linkPath);
}

/**
 * @param {string} root
 * @returns {{ name: string, targetBasename: string | null, broken: boolean, abs?: string }[]}
 */
export function listFavorites(root) {
  const d = favDir(root);
  if (!fs.existsSync(d)) return [];
  const out = [];
  for (const name of fs.readdirSync(d)) {
    const lp = path.join(d, name);
    let st;
    try {
      st = fs.lstatSync(lp);
    } catch {
      continue;
    }
    if (!st.isSymbolicLink()) {
      out.push({ name, targetBasename: null, broken: false });
      continue;
    }
    let raw;
    try {
      raw = fs.readlinkSync(lp);
    } catch {
      out.push({ name, targetBasename: null, broken: true });
      continue;
    }
    const resolved = path.resolve(d, raw);
    const base = path.basename(resolved);
    const broken = !fs.existsSync(resolved);
    out.push({ name, targetBasename: base, broken, abs: resolved });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @param {string} root
 * @param {string} oldBasename
 * @param {string} newBasename
 */
export function relinkFavoritesAfterRename(root, oldBasename, newBasename) {
  const d = favDir(root);
  if (!fs.existsSync(d)) return;
  const oldLink = path.join(d, oldBasename);
  let st;
  try {
    st = fs.lstatSync(oldLink);
  } catch {
    return;
  }
  if (st.isSymbolicLink()) {
    fs.unlinkSync(oldLink);
    fs.symlinkSync(path.join('..', newBasename), path.join(d, newBasename));
  }
}
