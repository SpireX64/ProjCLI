import { requireRoot } from '../config.js';
import { loadTags } from '../tags.js';

export function cmdTags() {
  const root = requireRoot();
  const { ids, descriptions } = loadTags(root);
  if (ids.length === 0) {
    console.log('No tags defined in .tags (file missing or empty).');
    return;
  }
  for (const id of [...ids].sort((a, b) => a.localeCompare(b))) {
    const d = descriptions.get(id) ?? '';
    if (d) console.log(`${id} — ${d}`);
    else console.log(id);
  }
}
