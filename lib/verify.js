import fs from 'fs';
import path from 'path';
import { validateFolderName, parseFolderName } from './naming.js';
import { loadTags } from './tags.js';
import { listFavorites } from './fav.js';
import { projrcPath, writeInitialProjrc, readProjectTags } from './projrc.js';

/**
 * @param {string} root
 * @returns {{ ok: boolean, issues: string[], migrations: string[] }}
 */
export function verifyAll(root) {
  const issues = [];
  const migrations = [];
  if (!fs.existsSync(root)) {
    issues.push(`Projects root does not exist: ${root}`);
    return { ok: false, issues, migrations };
  }

  /** @type {{ basename: string, parsed: import('./naming.js').ParsedFolder }[]} */
  const validProjects = [];

  for (const name of fs.readdirSync(root)) {
    if (name === '.fav' || name === '.tags') continue;
    const abs = path.join(root, name);
    let st;
    try {
      st = fs.lstatSync(abs);
    } catch {
      continue;
    }
    if (st.isSymbolicLink()) continue;
    if (!st.isDirectory()) continue;
    if (!validateFolderName(name)) {
      issues.push(`Non-conforming project directory name: ${name}`);
      continue;
    }
    const parsed = parseFolderName(name);
    if (parsed) validProjects.push({ basename: name, parsed });
  }

  for (const e of validProjects) {
    const abs = path.join(root, e.basename);
    if (!fs.existsSync(projrcPath(abs))) {
      writeInitialProjrc(abs, { projectName: e.parsed.projectName });
      migrations.push(`Migrated: wrote .projrc for ${e.basename}`);
    }
  }

  const byName = new Map();
  for (const e of validProjects) {
    const n = e.parsed.projectName;
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(e.basename);
  }
  for (const [pn, basenames] of byName.entries()) {
    if (basenames.length > 1) {
      issues.push(`Duplicate ProjectName "${pn}": ${basenames.join(', ')}`);
    }
  }

  const { ids, duplicateWarnings } = loadTags(root);
  for (const w of duplicateWarnings) issues.push(w);

  if (ids.length > 0) {
    const reg = new Set(ids);
    for (const e of validProjects) {
      const abs = path.join(root, e.basename);
      for (const t of readProjectTags(abs)) {
        if (!reg.has(t)) {
          issues.push(`Unknown tag "${t}" in project ${e.basename} (not in .tags)`);
        }
      }
    }
  }

  const favs = listFavorites(root);
  for (const f of favs) {
    if (f.broken) {
      issues.push(`Broken favorite symlink: ${f.name}`);
    } else {
      const lp = path.join(root, '.fav', f.name);
      if (fs.existsSync(lp) && !fs.lstatSync(lp).isSymbolicLink()) {
        issues.push(`Non-symlink in .fav: ${f.name}`);
      }
    }
  }

  return { ok: issues.length === 0, issues, migrations };
}
