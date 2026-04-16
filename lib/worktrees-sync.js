import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { mainWorktreePath } from './worktrees.js';
import { hasGitRepo } from './git-status.js';
import { renamePathAllowExdev } from './layout.js';

const GIT_MIN_MAJOR = 2;
const GIT_MIN_MINOR = 30;

/**
 * @returns {void}
 */
function assertGitVersionForWorktreeRepair() {
  const r = spawnSync('git', ['--version'], {
    encoding: 'utf8',
  });
  if (r.error) throw r.error;
  const s = r.stdout || '';
  const m = s.match(/git version (\d+)\.(\d+)/i);
  if (!m) {
    throw new Error(
      'Could not parse git version. Git 2.30+ is required when the project uses git worktrees (git worktree repair).'
    );
  }
  const ma = parseInt(m[1], 10);
  const mi = parseInt(m[2], 10);
  if (ma < GIT_MIN_MAJOR || (ma === GIT_MIN_MAJOR && mi < GIT_MIN_MINOR)) {
    throw new Error(
      `Git ${GIT_MIN_MAJOR}.${GIT_MIN_MINOR}+ is required when the project uses git worktrees (git worktree repair). Found ${m[1]}.${m[2]}.`
    );
  }
}

/**
 * @param {import('child_process').SpawnSyncReturns<string>} r
 */
function gitCombinedErr(r) {
  return `${r.stderr || ''}\n${r.stdout || ''}`.trim();
}

/**
 * @param {import('child_process').SpawnSyncReturns<string>} r
 */
function gitFailed(r) {
  return r.error != null || (r.status != null && r.status !== 0);
}

const HINT_REPAIR =
  'Check `git worktree list` and try `git worktree repair` manually from the main worktree.';

/**
 * @param {string} wtRoot
 * @param {string} oldPn
 * @param {string} newPn
 */
function renameWorktreeDirsByPrefix(wtRoot, oldPn, newPn) {
  const prefix = `${oldPn}-`;
  const names = fs.readdirSync(wtRoot).filter((n) => {
    if (!n.startsWith(prefix)) return false;
    let st;
    try {
      st = fs.lstatSync(path.join(wtRoot, n));
    } catch {
      return false;
    }
    return st.isDirectory();
  });
  const slugs = names.map((n) => n.slice(prefix.length)).filter(Boolean);
  const nonMain = slugs.filter((s) => s !== 'main').sort();
  const hasMain = slugs.includes('main');
  const order = [...nonMain];
  if (hasMain) order.push('main');

  for (const slug of order) {
    const from = path.join(wtRoot, `${oldPn}-${slug}`);
    const to = path.join(wtRoot, `${newPn}-${slug}`);
    if (from === to) continue;
    if (fs.existsSync(to)) {
      throw new Error(`Cannot rename worktree folder: target already exists: ${to}`);
    }
    renamePathAllowExdev(from, to);
  }
}

/**
 * After renaming the project root directory, sync `worktrees/<Project>-<slug>` names and Git metadata.
 * @param {string} projectAbs absolute path to project root (already renamed)
 * @param {string} oldPn previous Project (PascalCase) from parsed folder name
 * @param {string} newPn new Project from parsed folder name
 */
export function syncWorktreesAfterProjectRename(projectAbs, oldPn, newPn) {
  const wtRoot = path.join(projectAbs, 'worktrees');
  if (!fs.existsSync(wtRoot)) return;

  const mainOld = mainWorktreePath(projectAbs, oldPn);
  let stMain;
  try {
    stMain = fs.lstatSync(mainOld);
  } catch {
    stMain = null;
  }
  const hasMain = stMain !== null && stMain.isDirectory();

  if (!hasMain) {
    if (oldPn !== newPn) {
      renameWorktreeDirsByPrefix(wtRoot, oldPn, newPn);
    }
    return;
  }

  if (!hasGitRepo(mainOld)) {
    if (oldPn !== newPn) {
      renameWorktreeDirsByPrefix(wtRoot, oldPn, newPn);
    }
    return;
  }

  assertGitVersionForWorktreeRepair();

  let r = spawnSync('git', ['worktree', 'repair'], {
    cwd: mainOld,
    encoding: 'utf8',
  });
  if (r.error) throw r.error;
  if (gitFailed(r)) {
    throw new Error(`git worktree repair failed: ${gitCombinedErr(r) || '(no output)'}. ${HINT_REPAIR}`);
  }

  if (oldPn === newPn) {
    return;
  }

  const prefix = `${oldPn}-`;
  const linkedSlugs = fs
    .readdirSync(wtRoot)
    .filter((n) => {
      if (!n.startsWith(prefix)) return false;
      let st;
      try {
        st = fs.lstatSync(path.join(wtRoot, n));
      } catch {
        return false;
      }
      return st.isDirectory();
    })
    .map((n) => n.slice(prefix.length))
    .filter((slug) => slug && slug !== 'main')
    .sort();

  for (const slug of linkedSlugs) {
    const oldAbs = path.join(wtRoot, `${oldPn}-${slug}`);
    const newAbs = path.join(wtRoot, `${newPn}-${slug}`);
    if (fs.existsSync(newAbs)) {
      throw new Error(`git worktree move: target path already exists: ${newAbs}`);
    }
    r = spawnSync('git', ['worktree', 'move', oldAbs, newAbs], {
      cwd: mainOld,
      encoding: 'utf8',
    });
    if (r.error) throw r.error;
    if (gitFailed(r)) {
      const combined = gitCombinedErr(r).toLowerCase();
      if (combined.includes('submodule')) {
        throw new Error(
          `git worktree move failed (submodules): Git cannot move this worktree. ${gitCombinedErr(r)}`
        );
      }
      if (combined.includes('lock')) {
        throw new Error(
          `git worktree move failed (locked worktree). Try: git worktree unlock ${oldAbs}. ${gitCombinedErr(r)}`
        );
      }
      throw new Error(`git worktree move failed: ${gitCombinedErr(r) || '(no output)'}. ${HINT_REPAIR}`);
    }
  }

  const mainNew = mainWorktreePath(projectAbs, newPn);
  if (fs.existsSync(mainNew)) {
    throw new Error(`Cannot rename main worktree folder: target already exists: ${mainNew}`);
  }
  renamePathAllowExdev(mainOld, mainNew);

  r = spawnSync('git', ['worktree', 'repair'], {
    cwd: mainNew,
    encoding: 'utf8',
  });
  if (r.error) throw r.error;
  if (gitFailed(r)) {
    throw new Error(
      `git worktree repair failed after renaming main worktree: ${gitCombinedErr(r) || '(no output)'}. ${HINT_REPAIR}`
    );
  }
}
