import { requireRoot } from '../config.js';
import { resolveProject } from '../projects.js';
import { mergeProjrcValue } from '../projrc.js';

export function cmdSet(rest) {
  if (rest.length < 3) throw new Error('Usage: proj set <ProjectName|basename> <key> <value>');
  const root = requireRoot();
  const projectQuery = rest[0];
  const key = rest[1];
  const value = rest.slice(2).join(' ');
  if (!key.trim()) throw new Error('Missing key');
  const e = resolveProject(root, projectQuery);
  mergeProjrcValue(e.abs, key, value);
}
