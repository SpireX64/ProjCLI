import { getRoot, getWorkspaces, useWorkspace } from '../config.js';

export function cmdUse(rest) {
  if (rest.length === 0) {
    const w = getWorkspaces();
    const keys = Object.keys(w).sort((a, b) => a.localeCompare(b));
    if (keys.length === 0) {
      console.log('No workspaces. Use: proj dir <path> -w <name> or proj dir -w <name>');
      return;
    }
    for (const k of keys) console.log(`${k}\t${w[k]}`);
    return;
  }
  if (rest.length !== 1) throw new Error('Usage: proj use [workspace]');
  useWorkspace(rest[0]);
  console.log(getRoot());
}
