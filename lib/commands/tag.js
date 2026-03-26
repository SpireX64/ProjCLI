import { requireRoot } from '../config.js';
import { validateTagSegment } from '../naming.js';
import { listProjectEntries } from '../projects.js';
import { loadTags, saveTags } from '../tags.js';

export function cmdTag(rest) {
  const root = requireRoot();
  if (rest[0] === '-d') {
    const id = rest[1];
    if (!id) throw new Error('Missing tag id');
    if (!validateTagSegment(id)) throw new Error(`Invalid tag id: ${id}`);
    const entries = listProjectEntries(root);
    for (const e of entries) {
      if (e.parsed.tags.includes(id)) {
        throw new Error(`Tag "${id}" is still used by project ${e.basename}`);
      }
    }
    const { descriptions } = loadTags(root);
    if (!descriptions.has(id)) throw new Error(`Tag not in .tags: ${id}`);
    descriptions.delete(id);
    saveTags(root, descriptions);
    return;
  }
  const id = rest[0];
  if (!id) throw new Error('Missing tag id');
  if (!validateTagSegment(id)) throw new Error(`Invalid tag id: ${id}`);
  const desc = rest.slice(1).join(' ');
  if (/[\r\n]/.test(desc)) throw new Error('Description must not contain newlines');
  const { descriptions, duplicateWarnings } = loadTags(root);
  for (const w of duplicateWarnings) console.warn(w);
  descriptions.set(id, desc);
  saveTags(root, descriptions);
}
