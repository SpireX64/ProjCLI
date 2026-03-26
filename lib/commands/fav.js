import { requireRoot } from '../config.js';
import { resolveProject } from '../projects.js';
import { addFavorite, removeFavorite } from '../fav.js';

export function cmdFav(rest) {
  const root = requireRoot();
  if (rest[0] === '-d') {
    if (!rest[1]) throw new Error('Missing name for fav -d');
    removeFavorite(root, rest[1]);
    return;
  }
  if (!rest[0]) throw new Error('Missing target');
  const e = resolveProject(root, rest.join(' ').trim());
  addFavorite(root, e.basename);
}
