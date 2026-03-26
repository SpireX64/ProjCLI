import path from 'path';
import { spawnSync } from 'child_process';
import { requireRoot } from '../config.js';
import { buildFolderName } from '../naming.js';
import { isProjectNameTaken } from '../projects.js';
import { createStandardLayout } from '../layout.js';
import { writeInitialProjrc } from '../projrc.js';
import { collectInteractive } from '../cli-shared.js';
import { mainWorktreePath } from '../worktrees.js';

export async function cmdClone(rest) {
  if (!rest[0]) throw new Error('Missing repository URL');
  const url = rest[0];
  const root = requireRoot();
  const data = await collectInteractive(root, {});
  const canonical = buildFolderName(data.own, data.type, data.projectName);
  const dest = path.join(root, canonical);
  if (fs.existsSync(dest)) throw new Error(`Already exists: ${dest}`);
  if (isProjectNameTaken(root, data.projectName)) {
    throw new Error(`ProjectName already in use: ${data.projectName}`);
  }
  createStandardLayout(dest);
  const mainDest = mainWorktreePath(dest, data.projectName);
  const r = spawnSync('git', ['clone', url, mainDest], { stdio: 'inherit' });
  if (r.status !== 0) {
    throw new Error(`git clone exited with code ${r.status ?? '?'}`);
  }
  writeInitialProjrc(dest, {
    projectName: data.projectName,
    owner: data.owner,
    tags: data.tags.length ? data.tags : undefined,
  });
  console.log(dest);
}
