import { getRoot, requireRoot, ROOT_HINT } from '../config.js';
import { resolveProject } from '../projects.js';
import {
  parsePwdArgv,
  mainWorktreePath,
  resolveWtDirectory,
  validateWorktreeSlug,
} from '../worktrees.js';

export function cmdPwd(rest) {
  if (rest.length === 0) {
    const r = getRoot();
    if (!r) {
      console.log(ROOT_HINT);
      process.exitCode = 1;
      return;
    }
    console.log(r);
    return;
  }
  const root = requireRoot();
  const { projectQuery, wtMode } = parsePwdArgv(rest);
  if (!projectQuery) throw new Error('Missing project name');
  const e = resolveProject(root, projectQuery);
  const pn = e.parsed.projectName;

  if (wtMode === 'absent') {
    console.log(e.abs);
    return;
  }
  if (wtMode === 'main') {
    console.log(mainWorktreePath(e.abs, pn));
    return;
  }
  const err = validateWorktreeSlug(wtMode);
  if (err) throw new Error(err);
  console.log(resolveWtDirectory(e.abs, pn, wtMode));
}
