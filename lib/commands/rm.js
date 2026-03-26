import fs from 'fs';
import { requireRoot } from '../config.js';
import { resolveProject } from '../projects.js';
import { listFavorites } from '../fav.js';
import { stdinIsTTY, confirmRmProject } from '../cli-shared.js';

/**
 * @returns {{ force: boolean, query: string[] }}
 */
function parseRmArgs(rest) {
  let force = false;
  const parts = [];
  for (const a of rest) {
    if (a === '--force' || a === '-f') force = true;
    else parts.push(a);
  }
  return { force, query: parts };
}

export async function cmdRm(rest) {
  const root = requireRoot();
  const { force, query } = parseRmArgs(rest);
  const q = query.join(' ').trim();
  if (!q) throw new Error('Usage: proj rm <ProjectName|basename> [--force]');
  const e = resolveProject(root, q);
  const favs = listFavorites(root);
  const isFav = favs.some((f) => !f.broken && f.targetBasename === e.basename);
  if (isFav && !force) {
    throw new Error(
      'Project is a favorite. Remove the favorite first: proj fav -d <name>, or use proj rm --force'
    );
  }
  if (!stdinIsTTY() && !force) {
    throw new Error(
      'proj rm requires --force when stdin is not a terminal (or use a TTY for confirmation).'
    );
  }
  if (stdinIsTTY() && !force) {
    const ok = await confirmRmProject(e.abs);
    if (!ok) {
      console.log('Cancelled.');
      return;
    }
  }
  fs.rmSync(e.abs, { recursive: true, force: true });
  console.log(`Removed ${e.basename}`);
}
