import path from 'path';
import { getRoot, setRoot, requireRoot, ROOT_HINT, getWorkspaces, setWorkspace } from '../config.js';

/**
 * @param {string[]} rest
 * @returns {{ path: string | undefined, wName: string }}
 */
function parseDirArgs(rest) {
  let wName = '';
  const pos = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '-w') {
      const v = rest[++i];
      if (!v) throw new Error('Missing value for -w');
      wName = v;
    } else {
      pos.push(rest[i]);
    }
  }
  if (pos.length > 1) throw new Error('Too many path arguments for proj dir');
  return { path: pos[0], wName };
}

export function cmdDir(rest) {
  const { path: p, wName } = parseDirArgs(rest);
  if (!p && !wName) {
    const r = getRoot();
    if (!r) {
      console.log(ROOT_HINT);
      process.exitCode = 1;
      return;
    }
    console.log(r);
    return;
  }
  if (wName && !p) {
    const r = requireRoot();
    setWorkspace(wName, r);
    console.log(`${wName} -> ${r}`);
    return;
  }
  if (p && wName) {
    const resolved = path.resolve(p);
    setWorkspace(wName, resolved);
    setRoot(resolved);
    console.log(getRoot());
    return;
  }
  setRoot(p);
  console.log(getRoot());
}
