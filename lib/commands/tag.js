import { requireRoot } from '../config.js';
import { validateTagSegment } from '../naming.js';
import { listProjectEntries, resolveProject } from '../projects.js';
import { loadTags, saveTags } from '../tags.js';
import { readProjectTags, setProjectTags } from '../projrc.js';

/**
 * @returns {{ project: string | null, del: boolean, pos: string[] }}
 */
function parseTagArgv(rest) {
  /** @type {string | null} */
  let project = null;
  let del = false;
  const pos = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '-p' || a === '--project') {
      const v = rest[++i];
      if (!v) throw new Error('Missing value for -p/--project');
      project = v;
      continue;
    }
    if (a === '-d') {
      del = true;
      continue;
    }
    pos.push(a);
  }
  return { project, del, pos };
}

export function cmdTag(rest) {
  const root = requireRoot();
  const { project, del, pos } = parseTagArgv(rest);

  if (project != null) {
    if (pos.length !== 1) {
      throw new Error(
        'Usage: proj tag <id> -p <ProjectName|basename>   or   proj tag <id> -d -p <ProjectName|basename>'
      );
    }
    const id = pos[0];
    if (!validateTagSegment(id)) throw new Error(`Invalid tag id: ${id}`);
    const { descriptions } = loadTags(root);
    if (!descriptions.has(id)) throw new Error(`Tag not in .tags: ${id}`);
    const entry = resolveProject(root, project);
    const current = readProjectTags(entry.abs);
    if (del) {
      if (!current.includes(id)) {
        throw new Error(`Project does not have tag "${id}"`);
      }
      setProjectTags(
        entry.abs,
        current.filter((t) => t !== id)
      );
      return;
    }
    if (current.includes(id)) return;
    if (current.length >= 5) throw new Error('At most 5 tags per project');
    setProjectTags(entry.abs, [...current, id]);
    return;
  }

  if (del) {
    const id = pos[0];
    if (!id) throw new Error('Missing tag id');
    if (!validateTagSegment(id)) throw new Error(`Invalid tag id: ${id}`);
    const entries = listProjectEntries(root);
    for (const e of entries) {
      if (readProjectTags(e.abs).includes(id)) {
        throw new Error(`Tag "${id}" is still used by project ${e.basename}`);
      }
    }
    const { descriptions } = loadTags(root);
    if (!descriptions.has(id)) throw new Error(`Tag not in .tags: ${id}`);
    descriptions.delete(id);
    saveTags(root, descriptions);
    return;
  }

  const id = pos[0];
  if (!id) throw new Error('Missing tag id');
  if (!validateTagSegment(id)) throw new Error(`Invalid tag id: ${id}`);
  const desc = pos.slice(1).join(' ');
  if (/[\r\n]/.test(desc)) throw new Error('Description must not contain newlines');
  const { descriptions, duplicateWarnings } = loadTags(root);
  for (const w of duplicateWarnings) console.warn(w);
  descriptions.set(id, desc);
  saveTags(root, descriptions);
}
