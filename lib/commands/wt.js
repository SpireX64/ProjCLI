import fs from 'fs';
import { spawnSync } from 'child_process';
import { requireRoot } from '../config.js';
import { resolveProject } from '../projects.js';
import { hasGitRepo } from '../git-status.js';
import { mainWorktreePath, worktreePathForSlug, validateWorktreeSlug } from '../worktrees.js';

/**
 * @returns {{ pos: string[], branch: string | null }}
 */
function parseWtArgv(rest) {
  let branch = null;
  const pos = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '-b' && i + 1 < rest.length) {
      branch = rest[++i];
      continue;
    }
    pos.push(rest[i]);
  }
  return { pos, branch };
}

export function cmdWt(rest) {
  const { pos, branch } = parseWtArgv(rest);
  if (pos.length < 2) {
    throw new Error('Usage: proj wt <project> <slug> [-b <branch>]');
  }
  const slug = pos.pop();
  const q = pos.join(' ').trim();
  if (!q) throw new Error('Missing project name');

  const slugErr = validateWorktreeSlug(slug);
  if (slugErr) throw new Error(slugErr);
  if (branch !== null && !String(branch).trim()) {
    throw new Error('-b requires a non-empty branch name');
  }

  const root = requireRoot();
  const e = resolveProject(root, q);
  const pn = e.parsed.projectName;
  const mainPath = mainWorktreePath(e.abs, pn);

  if (!hasGitRepo(mainPath)) {
    throw new Error(
      'Adding a worktree requires git in the main worktree (' +
        mainPath +
        '). Clone or init git there first.'
    );
  }

  const dest = worktreePathForSlug(e.abs, pn, slug);
  if (fs.existsSync(dest)) {
    throw new Error(`Worktree path already exists: ${dest}`);
  }

  const b = branch != null && String(branch).trim() ? String(branch).trim() : slug;
  const r = spawnSync('git', ['worktree', 'add', '-b', b, dest], {
    cwd: mainPath,
    stdio: 'inherit',
  });
  if (r.error) throw r.error;
  if (r.status != null && r.status !== 0) process.exitCode = r.status;
}
