import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { requireRoot, getEditors } from '../config.js';
import { resolveProject } from '../projects.js';
import { readProjrc } from '../projrc.js';
import {
  parseOpenFlags,
  mainWorktreePath,
  resolveWtDirectory,
  getSubprojectRelativeFromProjrc,
  resolveSubprojectUnderWorktree,
} from '../worktrees.js';

/** .projrc keys whose values are filesystem paths (relative to project root if not absolute). */
const PROJRC_PATH_VALUE_KEYS = new Set(['workspace', 'code_workspace']);

function pickDefaultEditorExecutable() {
  return process.env.EDITOR || process.env.VISUAL || 'code';
}

function posixQuote(p) {
  return `'${String(p).replace(/'/g, `'\\''`)}'`;
}

function winQuotePath(p) {
  return `"${String(p).replace(/"/g, '\\"')}"`;
}

/**
 * @param {string} template
 * @param {string} dirAbs directory passed to `proj open` (worktree, -r root, or --wt)
 * @param {string} rootAbs pa_* project root
 * @param {Map<string, string>} projrc from readProjrc(rootAbs)
 */
export function expandEditorTemplate(template, dirAbs, rootAbs, projrc) {
  const onWindows = process.platform === 'win32';
  const q = (p) => (onWindows ? winQuotePath(p) : posixQuote(p));

  let out = template;
  out = out.split('$dir').join(q(dirAbs));
  out = out.split('$root').join(q(rootAbs));

  out = out.replace(/\$rc_([a-z][a-z0-9_]*)/gi, (_, keyRaw) => {
    const key = keyRaw.toLowerCase();
    const raw = projrc.get(key);
    if (raw === undefined || String(raw).trim() === '') {
      console.warn(`proj: warning: .projrc has no value for "${key}" (editor template)`);
      return '';
    }
    const v = String(raw).trim();
    if (PROJRC_PATH_VALUE_KEYS.has(key)) {
      const resolved = path.isAbsolute(v) ? path.normalize(v) : path.join(rootAbs, v);
      return q(resolved);
    }
    return q(v);
  });

  return out;
}

/**
 * @param {string} cmdLine
 */
function runShellCommand(cmdLine) {
  const onWindows = process.platform === 'win32';
  const shell = onWindows ? process.env.ComSpec || 'cmd.exe' : process.env.SHELL || 'sh';
  const flag = onWindows ? '/c' : '-c';
  const r = spawnSync(shell, [flag, cmdLine], { stdio: 'inherit', env: process.env });
  if (r.error) throw r.error;
  if (r.status != null && r.status !== 0) process.exitCode = r.status;
}

export function cmdOpen(rest) {
  const root = requireRoot();
  if (!rest.length) throw new Error('Missing project name');

  const editors = getEditors();
  const { positional, openRoot, wtSlug, subproject } = parseOpenFlags(rest);

  const q = (positional[0] || '').trim();
  if (!q) throw new Error('Missing project name');
  const editorChoice = positional[1] || null;

  const e = resolveProject(root, q);
  const pn = e.parsed.projectName;

  const projrcMap = readProjrc(e.abs);

  let dirAbs;
  if (openRoot) {
    dirAbs = e.abs;
  } else if (wtSlug !== 'absent') {
    dirAbs = resolveWtDirectory(e.abs, pn, wtSlug);
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

  let template = null;
  if (editorChoice && editors[editorChoice]) {
    template = editors[editorChoice];
  } else {
    const fromRc = (projrcMap.get('editor') || '').trim();
    if (fromRc && editors[fromRc]) template = editors[fromRc];
  }

  if (template) {
    const cmdLine = expandEditorTemplate(template, dirAbs, e.abs, projrcMap);
    runShellCommand(cmdLine);
    return;
  }

  const onWindows = process.platform === 'win32';
  if (editorChoice) {
    const r = spawnSync(editorChoice, [dirAbs], { stdio: 'inherit', shell: onWindows });
    if (r.error) throw r.error;
    if (r.status != null && r.status !== 0) process.exitCode = r.status;
    return;
  }

  const editor = pickDefaultEditorExecutable();
  const r = spawnSync(editor, [dirAbs], { stdio: 'inherit', shell: onWindows });
  if (r.error) throw r.error;
  if (r.status != null && r.status !== 0) process.exitCode = r.status;
}
