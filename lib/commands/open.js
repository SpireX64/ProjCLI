import { spawnSync } from 'child_process';
import { requireRoot } from '../config.js';
import { resolveProject } from '../projects.js';

function pickEditor() {
  return process.env.EDITOR || process.env.VISUAL || 'code';
}

export function cmdOpen(rest) {
  const root = requireRoot();
  const q = rest.join(' ').trim();
  if (!q) throw new Error('Missing project name');
  const e = resolveProject(root, q);
  const editor = pickEditor();
  const onWindows = process.platform === 'win32';
  const r = spawnSync(editor, [e.abs], { stdio: 'inherit', shell: onWindows });
  if (r.error) throw r.error;
  if (r.status != null && r.status !== 0) process.exitCode = r.status;
}
