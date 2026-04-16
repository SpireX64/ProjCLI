import fs from 'fs';
import path from 'path';

const SLUG_MAX_LEN = 200;

const WIN_BAD = /[<>:"|?*\x00-\x1f]/;
const WIN_BAD_END = /[. ]+$/;

export function mainWorktreePath(projectAbs, projectName) {
  return path.join(projectAbs, 'worktrees', `${projectName}-main`);
}

export function worktreePathForSlug(projectAbs, projectName, slug) {
  return path.join(projectAbs, 'worktrees', `${projectName}-${slug}`);
}

export function validateWorktreeSlug(slug) {
  if (!slug || typeof slug !== 'string') return 'Worktree slug is empty';
  if (slug.length > SLUG_MAX_LEN) return `Worktree slug too long (max ${SLUG_MAX_LEN})`;
  if (/\s/.test(slug)) return 'Worktree slug must not contain whitespace';
  for (let i = 0; i < slug.length; i++) {
    const c = slug.charCodeAt(i);
    if (c < 0x20 || c > 0x7e) return 'Worktree slug must be ASCII only';
  }
  if (slug === '.' || slug === '..') return 'Invalid worktree slug';
  if (slug.toLowerCase() === 'main') return 'Slug "main" is reserved for the primary worktree';
  if (slug.includes('/') || slug.includes('\\')) return 'Worktree slug must not contain path separators';
  if (process.platform === 'win32') {
    if (WIN_BAD.test(slug)) return 'Worktree slug contains invalid characters for Windows file names';
    if (WIN_BAD_END.test(slug)) return 'Worktree slug cannot end with a period or space on Windows';
  }
  return null;
}

export function ensureMainWorktreeDir(projectAbs, projectName) {
  fs.mkdirSync(mainWorktreePath(projectAbs, projectName), { recursive: true });
}

export function resolveWtDirectory(projectAbs, projectName, token) {
  const prefix = `${projectName}-`;
  if (token.startsWith(prefix)) {
    const slug = token.slice(prefix.length);
    const err2 = validateWorktreeSlug(slug);
    if (!err2) return worktreePathForSlug(projectAbs, projectName, slug);
  }
  const errShort = validateWorktreeSlug(token);
  if (!errShort) {
    return worktreePathForSlug(projectAbs, projectName, token);
  }
  throw new Error(errShort);
}

export function filterWorktreesInLayout(projectAbs, projectName, entries) {
  const normMain = path.normalize(mainWorktreePath(projectAbs, projectName));
  const wtBase = path.join(projectAbs, 'worktrees') + path.sep;
  return entries.filter((w) => {
    const p = path.normalize(w.path);
    return p === normMain || p.startsWith(wtBase);
  });
}

/** .projrc key prefix for monorepo subproject paths (relative to a worktree). */
export const SUBPROJECT_PROJRC_PREFIX = 'p_';

/**
 * @param {string} subprojectName token after -p (trimmed, lowercased for lookup)
 * @returns {string} e.g. p_core
 */
export function projrcSubprojectKey(subprojectName) {
  const n = String(subprojectName).trim().toLowerCase();
  return `${SUBPROJECT_PROJRC_PREFIX}${n}`;
}

/**
 * Resolve a path inside worktreeAbs; reject absolute rel or paths that escape the worktree.
 * @param {string} worktreeAbs
 * @param {string} relativeRaw from .projrc
 * @returns {string} absolute normalized path
 */
export function resolveSubprojectUnderWorktree(worktreeAbs, relativeRaw) {
  const rel = String(relativeRaw).trim();
  if (!rel) throw new Error('Subproject path is empty');
  if (path.isAbsolute(rel)) {
    throw new Error('Subproject path in .projrc must be relative to the worktree');
  }
  const base = path.resolve(worktreeAbs);
  const resolved = path.resolve(base, rel);
  const relToBase = path.relative(base, resolved);
  if (relToBase.startsWith('..') || path.isAbsolute(relToBase)) {
    throw new Error('Subproject path escapes worktree');
  }
  return resolved;
}

/**
 * @param {Map<string, string>} projrcMap
 * @param {string} subprojectName
 * @returns {string} relative path from .projrc
 */
export function getSubprojectRelativeFromProjrc(projrcMap, subprojectName) {
  const trimmed = String(subprojectName).trim();
  if (!trimmed) {
    throw new Error('Subproject name is empty');
  }
  const key = projrcSubprojectKey(trimmed);
  const raw = projrcMap.get(key);
  if (raw === undefined || !String(raw).trim()) {
    throw new Error(`Unknown subproject "${trimmed}" (define ${key} in .projrc)`);
  }
  return String(raw).trim();
}

export function parseOpenFlags(rest, opts = {}) {
  const rootFlag = opts.rootFlag !== false;
  const wtRequiresValue = opts.wtRequiresValue !== false;
  const positional = [];
  let openRoot = false;
  let wtSlug = 'absent';
  /** @type {'absent' | string} */
  let subproject = 'absent';

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (rootFlag && (a === '-r' || a === '--root')) {
      openRoot = true;
      continue;
    }
    if (a === '-p' || a === '--project') {
      const next = rest[i + 1];
      if (next === undefined || next.startsWith('-')) {
        throw new Error('-p requires a subproject name');
      }
      if (subproject !== 'absent') {
        throw new Error('Duplicate -p');
      }
      subproject = next;
      i++;
      continue;
    }
    if (a === '--wt') {
      const next = rest[i + 1];
      if (!wtRequiresValue && (next === undefined || next.startsWith('-'))) {
        wtSlug = 'main';
        continue;
      }
      if (next === undefined || next.startsWith('-')) {
        throw new Error('--wt requires a worktree slug');
      }
      wtSlug = next;
      i++;
      continue;
    }
    if (a.startsWith('-')) {
      continue;
    }
    positional.push(a);
  }
  if (openRoot && wtSlug !== 'absent') {
    throw new Error('Use only one of -r (--root) or --wt');
  }
  return { positional, openRoot, wtSlug, subproject };
}

/**
 * @returns {{
 *   projectQuery: string,
 *   wtSlug: 'absent' | 'main' | string,
 *   subproject: 'absent' | string,
 *   openRoot: boolean
 * }}
 */
export function parsePwdArgv(rest) {
  const parts = [];
  let openRoot = false;
  /** @type {'absent' | 'main' | string} */
  let wtSlug = 'absent';
  /** @type {'absent' | string} */
  let subproject = 'absent';

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '-r' || a === '--root') {
      openRoot = true;
      continue;
    }
    if (a === '-p' || a === '--project') {
      const next = rest[i + 1];
      if (next === undefined || next.startsWith('-')) {
        throw new Error('-p requires a subproject name');
      }
      if (subproject !== 'absent') {
        throw new Error('Duplicate -p');
      }
      subproject = next;
      i++;
      continue;
    }
    if (a === '--wt') {
      const next = rest[i + 1];
      if (next === undefined || next.startsWith('-')) {
        wtSlug = 'main';
        continue;
      }
      wtSlug = next;
      i++;
      continue;
    }
    if (a.startsWith('-')) {
      continue;
    }
    parts.push(a);
  }

  if (openRoot && wtSlug !== 'absent') {
    throw new Error('Use only one of -r (--root) or --wt');
  }

  return {
    projectQuery: parts.join(' ').trim(),
    wtSlug,
    subproject,
    openRoot,
  };
}
