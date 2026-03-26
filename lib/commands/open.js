import fs from 'fs';
import { spawnSync } from 'child_process';
import { requireRoot, getEditors } from '../config.js';
import { resolveProject } from '../projects.js';
import { readProjrc } from '../projrc.js';
import { parseOpenFlags, mainWorktreePath, resolveWtDirectory } from '../worktrees.js';

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
 * @param {string} dirAbs
 */
function expandEditorTemplate(template, dirAbs) {
  const q = process.platform === 'win32' ? winQuotePath(dirAbs) : posixQuote(dirAbs);
  return template.split('$dir').join(q);
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
  const editorNames = new Set(Object.keys(editors));
  const { positional, openRoot, wtSlug } = parseOpenFlags(rest);

  let editorChoice = null;
  let queryTokens = [...positional];
  if (positional.length >= 2) {
    const last = positional[positional.length - 1];
    if (editorNames.has(last)) {
      editorChoice = last;
      queryTokens = positional.slice(0, -1);
    }
  }

  const q = queryTokens.join(' ').trim();
  if (!q) throw new Error('Missing project name');

  const e = resolveProject(root, q);
  const pn = e.parsed.projectName;

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

  let template = null;
  if (editorChoice && editors[editorChoice]) {
    template = editors[editorChoice];
  } else {
    const map = readProjrc(e.abs);
    const fromRc = (map.get('editor') || '').trim();
    if (fromRc && editors[fromRc]) template = editors[fromRc];
  }

  if (template) {
    const cmdLine = expandEditorTemplate(template, dirAbs);
    runShellCommand(cmdLine);
    return;
  }

  const editor = pickDefaultEditorExecutable();
  const onWindows = process.platform === 'win32';
  const r = spawnSync(editor, [dirAbs], { stdio: 'inherit', shell: onWindows });
  if (r.error) throw r.error;
  if (r.status != null && r.status !== 0) process.exitCode = r.status;
}
