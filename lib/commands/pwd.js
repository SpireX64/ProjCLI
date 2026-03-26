import { getRoot, requireRoot, ROOT_HINT } from '../config.js';
import { resolveProject } from '../projects.js';

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
  const q = rest.join(' ').trim();
  const e = resolveProject(root, q);
  console.log(e.abs);
}
