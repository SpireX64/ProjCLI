import { requireRoot } from '../config.js';
import { resolveProject } from '../projects.js';
import { mergeProjrcValue, removeProjrcKey } from '../projrc.js';

/**
 * @returns {{ del: boolean, pos: string[] }}
 */
function parseSetArgv(rest) {
  let del = false;
  const pos = [];
  for (const a of rest) {
    if (a === '-d') {
      del = true;
      continue;
    }
    pos.push(a);
  }
  return { del, pos };
}

export function cmdSet(rest) {
  const root = requireRoot();
  const { del, pos } = parseSetArgv(rest);
  if (del) {
    if (pos.length !== 2) {
      throw new Error('Usage: proj set -d <ProjectName|basename> <key>');
    }
    const projectQuery = pos[0];
    const key = pos[1];
    if (!key.trim()) throw new Error('Missing key');
    const e = resolveProject(root, projectQuery);
    removeProjrcKey(e.abs, key);
    return;
  }
  if (pos.length < 3) throw new Error('Usage: proj set <ProjectName|basename> <key> <value>');
  const projectQuery = pos[0];
  const key = pos[1];
  const value = pos.slice(2).join(' ');
  if (!key.trim()) throw new Error('Missing key');
  const e = resolveProject(root, projectQuery);
  mergeProjrcValue(e.abs, key, value);
}
