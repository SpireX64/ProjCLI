import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

/**
 * @param {string} repoDir
 * @param {string[]} gitArgs
 */
function gitSync(repoDir, gitArgs) {
  return execFileSync('git', gitArgs, {
    encoding: 'utf8',
    cwd: repoDir,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

/**
 * @param {string} repoDir
 */
export function hasGitRepo(repoDir) {
  return fs.existsSync(path.join(repoDir, '.git'));
}

/**
 * @param {string} repoDir
 * @returns {{ branch: string | null, dirty: boolean }}
 */
export function gitBranchAndDirty(repoDir) {
  if (!hasGitRepo(repoDir)) return { branch: null, dirty: false };
  try {
    const branch = gitSync(repoDir, ['rev-parse', '--abbrev-ref', 'HEAD']);
    const por = gitSync(repoDir, ['status', '--porcelain']);
    const dirty = por.length > 0;
    return { branch, dirty };
  } catch {
    return { branch: null, dirty: false };
  }
}

/**
 * @param {string} repoDir main repo (has .git)
 * @returns {{ path: string, branch: string | null, dirty: boolean }[]}
 * Each `path` is an absolute worktree root from `git worktree list` (main or linked);
 * git commands run with that directory as cwd — valid for linked worktrees outside the project's `worktrees/` folder.
 */
export function listWorktreesDetail(repoDir) {
  if (!hasGitRepo(repoDir)) return [];
  let raw;
  try {
    raw = execFileSync('git', ['worktree', 'list', '--porcelain'], {
      encoding: 'utf8',
      cwd: repoDir,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return [];
  }

  /** @type {{ path?: string, branch?: string | null, detached?: boolean }[]} */
  const blocks = [];
  /** @type {{ path?: string, branch?: string | null, detached?: boolean }} */
  let cur = {};

  function flush() {
    if (cur.path) {
      blocks.push({
        path: cur.path,
        branch: cur.detached ? null : cur.branch ?? null,
        detached: !!cur.detached,
      });
    }
    cur = {};
  }

  for (const line of raw.split(/\r?\n/)) {
    if (line === '') {
      flush();
      continue;
    }
    if (line.startsWith('worktree ')) cur.path = line.slice('worktree '.length);
    else if (line.startsWith('branch ')) {
      const ref = line.slice('branch '.length);
      cur.branch = ref.startsWith('refs/heads/') ? ref.slice('refs/heads/'.length) : ref;
    } else if (line === 'detached') cur.detached = true;
  }
  flush();

  return blocks.map((b) => {
    const wt = gitBranchAndDirty(b.path);
    return {
      path: b.path,
      branch: b.detached ? '(detached)' : b.branch || wt.branch,
      dirty: wt.dirty,
    };
  });
}

/**
 * @param {string} repoDir
 */
export function worktreeCount(repoDir) {
  return listWorktreesDetail(repoDir).length;
}

/**
 * @param {string} projectAbs
 */
export function repoPathForProject(projectAbs) {
  return path.join(projectAbs, 'repo');
}

/**
 * First commit date ISO, or null if no git / no commits.
 * @param {string} repoDir
 */
export function gitFirstCommitIso(repoDir) {
  if (!hasGitRepo(repoDir)) return null;
  try {
    const out = gitSync(repoDir, ['log', '--reverse', '-1', '--format=%cI']);
    return out || null;
  } catch {
    return null;
  }
}

/**
 * Best-effort created timestamp for a project: first git commit, or now.
 * @param {string} projectAbs
 */
export function computeCreatedTimestamp(projectAbs) {
  const repoDir = repoPathForProject(projectAbs);
  const fromGit = gitFirstCommitIso(repoDir);
  if (fromGit) return fromGit;
  return new Date().toISOString();
}
