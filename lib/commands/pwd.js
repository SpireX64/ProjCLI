import fs from 'fs';

import { getRoot, requireRoot, ROOT_HINT } from '../config.js';
import { resolveProject } from '../projects.js';
import { readProjrc } from '../projrc.js';
import {
  parsePwdArgv,
  mainWorktreePath,
  resolveWtDirectory,
  validateWorktreeSlug,
  getSubprojectRelativeFromProjrc,
  resolveSubprojectUnderWorktree,
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
  const { projectQuery, wtSlug, subproject, openRoot } = parsePwdArgv(rest);
  if (!projectQuery) throw new Error('Missing project name');
  const e = resolveProject(root, projectQuery);
  const pn = e.parsed.projectName;

  const projrcMap = readProjrc(e.abs);

  let dirAbs;
  if (openRoot) {
    dirAbs = e.abs;
  } else if (wtSlug !== 'absent') {
    if (wtSlug === 'main') {
      dirAbs = mainWorktreePath(e.abs, pn);
    } else {
      const err = validateWorktreeSlug(wtSlug);
      if (err) throw new Error(err);
      dirAbs = resolveWtDirectory(e.abs, pn, wtSlug);
    }
    if (!fs.existsSync(dirAbs)) {
      throw new Error(`Worktree directory does not exist: ${dirAbs}`);
    }
  } else {
    dirAbs = mainWorktreePath(e.abs, pn);
    if (!fs.existsSync(dirAbs)) {
      throw new Error(
        `Main worktree directory missing: ${dirAbs}. Create the project layout or run proj new.`
      );
    }
  }

  if (subproject !== 'absent' && !openRoot) {
    const rel = getSubprojectRelativeFromProjrc(projrcMap, subproject);
    dirAbs = resolveSubprojectUnderWorktree(dirAbs, rel);
    if (!fs.existsSync(dirAbs)) {
      throw new Error(`Subproject directory does not exist: ${dirAbs}`);
    }
  }

  console.log(dirAbs);
}
