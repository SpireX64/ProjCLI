import { requireRoot } from '../config.js';
import { listProjectEntries } from '../projects.js';
import { listFavorites } from '../fav.js';
import { readProjrc, getDisplayName, readProjectTags } from '../projrc.js';
import { formatProjectLine, formatProjectLineColor } from '../display.js';
import { useColor } from '../colors.js';

/**
 * @param {import('../naming.js').ParsedFolder} parsed
 * @param {string[]} projTags from `.projrc`
 * @param {{ ownStr?: string, typeStr?: string, tagIds: string[] }} filters
 */
function matchesFilters(parsed, projTags, filters) {
  if (filters.ownStr && !filters.ownStr.includes(parsed.own)) return false;
  if (filters.typeStr && !filters.typeStr.includes(parsed.type)) return false;
  const tagSet = new Set(projTags);
  for (const t of filters.tagIds || []) {
    if (!tagSet.has(t)) return false;
  }
  return true;
}

/**
 * @returns {{ favOnly: boolean, json: boolean, ownStr: string, typeStr: string, grep: string, tagIds: string[] }}
 */
function parseLsArgs(rest) {
  let favOnly = false;
  let json = false;
  let ownStr = '';
  let typeStr = '';
  let grep = '';
  const pos = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '-f') favOnly = true;
    else if (a === '--json') json = true;
    else if (a === '--grep' || a === '-grep') {
      const v = rest[++i];
      if (!v) throw new Error('Missing value for --grep');
      grep = v;
    } else if (a.startsWith('--grep=')) {
      grep = a.slice('--grep='.length);
      if (!grep) throw new Error('Missing value for --grep=');
    } else if (a === '-o') {
      const v = rest[++i];
      if (!v) throw new Error('Missing value for -o');
      ownStr = v;
    } else if (a === '-t') {
      const v = rest[++i];
      if (!v) throw new Error('Missing value for -t');
      typeStr = v;
    } else if (a.startsWith('-')) {
      throw new Error(`Unknown option: ${a}`);
    } else pos.push(a);
  }
  return { favOnly, json, ownStr, typeStr, grep, tagIds: pos };
}

function entryMatchesGrep(e, needle) {
  if (!needle) return true;
  const n = needle.toLowerCase();
  if (e.basename.toLowerCase().includes(n)) return true;
  if (e.parsed.projectName.toLowerCase().includes(n)) return true;
  const map = readProjrc(e.abs);
  const dn = getDisplayName(map, e.parsed.projectName);
  if (dn.toLowerCase().includes(n)) return true;
  return false;
}

export function cmdLs(rest) {
  const root = requireRoot();
  const { favOnly, json, ownStr, typeStr, grep, tagIds } = parseLsArgs(rest);
  let entries = listProjectEntries(root);
  const favList = listFavorites(root);
  const favBasenames = new Set(
    favList.filter((f) => !f.broken && f.targetBasename).map((f) => f.targetBasename)
  );
  if (favOnly) {
    entries = entries.filter((e) => favBasenames.has(e.basename));
  }
  const filters = { ownStr: ownStr || undefined, typeStr: typeStr || undefined, tagIds };
  if (json) {
    const rows = [];
    for (const e of entries) {
      const tags = readProjectTags(e.abs);
      if (!matchesFilters(e.parsed, tags, filters)) continue;
      if (!entryMatchesGrep(e, grep)) continue;
      const map = readProjrc(e.abs);
      rows.push({
        basename: e.basename,
        path: e.abs,
        own: e.parsed.own,
        type: e.parsed.type,
        projectName: e.parsed.projectName,
        tags,
        displayName: getDisplayName(map, e.parsed.projectName),
        favorite: favBasenames.has(e.basename),
      });
    }
    console.log(JSON.stringify(rows));
    return;
  }
  const useFmt = useColor() ? formatProjectLineColor : formatProjectLine;
  for (const e of entries) {
    const tags = readProjectTags(e.abs);
    if (!matchesFilters(e.parsed, tags, filters)) continue;
    if (!entryMatchesGrep(e, grep)) continue;
    console.log(useFmt(e.parsed, tags));
  }
}
