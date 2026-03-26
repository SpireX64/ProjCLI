import fs from 'fs';
import path from 'path';
import { requireRoot } from '../config.js';
import { listProjectEntries, resolveProject } from '../projects.js';
import {
  readProjrc,
  getDisplayName,
  projrcPath,
} from '../projrc.js';
import {
  repoPathForProject,
  hasGitRepo,
  gitBranchAndDirty,
  listWorktreesDetail,
  worktreeCount,
  computeCreatedTimestamp,
} from '../git-status.js';
import { useColor, color } from '../colors.js';

/**
 * @returns {{ json: boolean, query: string }}
 */
function parseStatusArgs(rest) {
  const parts = [];
  let json = false;
  for (const a of rest) {
    if (a === '--json') json = true;
    else parts.push(a);
  }
  return { json, query: parts.join(' ').trim() };
}

function listTopLevelTaskFiles(projectAbs) {
  const td = path.join(projectAbs, 'tasks');
  if (!fs.existsSync(td)) return [];
  const out = [];
  for (const name of fs.readdirSync(td)) {
    const fp = path.join(td, name);
    let st;
    try {
      st = fs.statSync(fp);
    } catch {
      continue;
    }
    if (st.isFile()) out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function statusSummaryRow(e, colored) {
  const rp = repoPathForProject(e.abs);
  const git = hasGitRepo(rp);
  const { branch, dirty } = gitBranchAndDirty(rp);
  const wt = git ? worktreeCount(rp) : 0;
  const b = branch || '—';
  let d = dirty ? 'dirty' : 'clean';
  if (colored) {
    d = dirty ? color.red('dirty') : color.green('clean');
  }
  return `${e.basename}\t${git ? 'git' : 'no git'}\t${b}\t${d}\twt:${wt}`;
}

function buildStatusSummaryJson(root) {
  return listProjectEntries(root).map((e) => {
    const rp = repoPathForProject(e.abs);
    const git = hasGitRepo(rp);
    const { branch, dirty } = gitBranchAndDirty(rp);
    return {
      basename: e.basename,
      path: e.abs,
      hasGit: git,
      branch,
      dirty,
      worktreeCount: git ? worktreeCount(rp) : 0,
    };
  });
}

function buildStatusDetailJson(e) {
  const map = readProjrc(e.abs);
  const rp = repoPathForProject(e.abs);
  const main = hasGitRepo(rp)
    ? (() => {
        const { branch, dirty } = gitBranchAndDirty(rp);
        return { branch, dirty };
      })()
    : null;
  const worktrees = hasGitRepo(rp) ? listWorktreesDetail(rp) : [];
  const skip = new Set(['name', 'owner', 'created']);
  const projrcExtra = Object.fromEntries(
    [...map.entries()].filter(([k]) => !skip.has(k)).sort((a, b) => a[0].localeCompare(b[0]))
  );
  return {
    name: getDisplayName(map, e.parsed.projectName),
    owner: map.get('owner') || null,
    created: map.get('created') || computeCreatedTimestamp(e.abs),
    path: e.abs,
    basename: e.basename,
    parsed: { ...e.parsed },
    mainRepo: main,
    worktrees,
    tasks: listTopLevelTaskFiles(e.abs),
    projrcExtra,
    hasProjrc: fs.existsSync(projrcPath(e.abs)),
  };
}

export function cmdStatus(rest) {
  const root = requireRoot();
  const { json, query } = parseStatusArgs(rest);
  const colored = useColor() && !json;

  if (!query) {
    if (json) {
      console.log(JSON.stringify(buildStatusSummaryJson(root)));
      return;
    }
    for (const e of listProjectEntries(root)) {
      console.log(statusSummaryRow(e, colored));
    }
    return;
  }

  const e = resolveProject(root, query);
  if (json) {
    console.log(JSON.stringify(buildStatusDetailJson(e)));
    return;
  }

  const map = readProjrc(e.abs);
  const disp = getDisplayName(map, e.parsed.projectName);
  const owner = map.get('owner') || '—';
  const created = map.get('created') || computeCreatedTimestamp(e.abs);

  console.log(`Name: ${disp}`);
  console.log(`Owner: ${owner}`);
  console.log(`Created: ${created}`);
  console.log(`Path: ${e.abs}`);

  const rp = repoPathForProject(e.abs);
  if (hasGitRepo(rp)) {
    const { branch, dirty } = gitBranchAndDirty(rp);
    const st = dirty ? (colored ? color.red('dirty') : 'dirty') : colored ? color.green('clean') : 'clean';
    console.log(`Main repo: ${branch || '?'} (${st})`);
    const wts = listWorktreesDetail(rp);
    if (wts.length) {
      console.log('Worktrees:');
      for (const w of wts) {
        const wt = w.dirty
          ? colored
            ? color.red('dirty')
            : 'dirty'
          : colored
            ? color.green('clean')
            : 'clean';
        console.log(`  ${w.path}\t${w.branch || '?'}\t${wt}`);
      }
    } else {
      console.log('Worktrees: (none listed)');
    }
  } else {
    console.log('Main repo: (no .git)');
  }

  const tasks = listTopLevelTaskFiles(e.abs);
  if (tasks.length) {
    console.log('Tasks:');
    for (const t of tasks) console.log(`  ${t}`);
  }

  const skip = new Set(['name', 'owner', 'created']);
  const extra = [...map.entries()].filter(([k]) => !skip.has(k)).sort((a, b) => a[0].localeCompare(b[0]));
  if (extra.length) {
    console.log('.projrc:');
    for (const [k, v] of extra) console.log(`  ${k} = ${v}`);
  }

  if (!fs.existsSync(projrcPath(e.abs))) {
    console.warn('(no .projrc — run proj verify to create)');
  }
}
