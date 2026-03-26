import { requireRoot } from '../config.js';
import { resolveProject } from '../projects.js';
import { readProjrc, getDisplayName } from '../projrc.js';
import { computeCreatedTimestamp } from '../git-status.js';

export function cmdGet(rest) {
  if (rest.length < 2) throw new Error('Usage: proj get <ProjectName> <Key>');
  const root = requireRoot();
  const projectQuery = rest[0];
  const key = rest.slice(1).join(' ').trim();
  if (!key) throw new Error('Missing key');
  const e = resolveProject(root, projectQuery);
  const k = key.toLowerCase();
  const map = readProjrc(e.abs);

  if (k === 'name') {
    console.log(getDisplayName(map, e.parsed.projectName));
    return;
  }
  if (k === 'created') {
    const v = map.get('created');
    if (v) {
      console.log(v);
      return;
    }
    const fb = computeCreatedTimestamp(e.abs);
    console.log(fb);
    return;
  }

  const v = map.get(k);
  if (v === undefined || v === '') {
    console.error(`Key not set: ${key}`);
    process.exitCode = 1;
    return;
  }
  console.log(v);
}
