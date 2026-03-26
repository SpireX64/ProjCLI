import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import {
  normalizeToPascalCaseProjectName,
  validateTagSegment,
  OWN_CHOICES,
  TYPE_CHOICES,
  formatOwnPromptLegend,
  formatTypePromptLegend,
} from './naming.js';
import { isProjectNameTaken } from './projects.js';
import { loadTags, validateTagsAgainstRegistry } from './tags.js';

export async function createPrompt() {
  const rl = readline.createInterface({ input, output });
  return {
    async askKeep(q, def) {
      const a = (await rl.question(`${q} [${def}]: `)).trim();
      return a === '' ? def : a;
    },
    async askRaw(q) {
      return (await rl.question(q)).trim();
    },
    close: () => rl.close(),
  };
}

export function warnTagRegistry(root) {
  const { ids, duplicateWarnings } = loadTags(root);
  for (const w of duplicateWarnings) console.warn(w);
  if (ids.length === 0) {
    console.warn(
      'Warning: .tags is empty or missing; tags are not validated against a registry. ' +
        'Register tag ids with: proj tag <camelCaseId> [description...]'
    );
  }
}

export function assertTagsAllowed(root, tags) {
  const v = validateTagsAgainstRegistry(root, tags);
  if (!v.ok) {
    throw new Error(`Unknown tags (not in .tags): ${v.unknown.join(', ')}`);
  }
}

/**
 * @param {string} root
 * @param {{ own?: string, type?: string, projectName?: string, tagsStr?: string, owner?: string }} defaults
 */
export async function collectInteractive(root, defaults = {}) {
  warnTagRegistry(root);
  const p = await createPrompt();
  try {
    const own = await p.askKeep(
      `Ownership — enter one letter (${formatOwnPromptLegend()})`,
      defaults.own || 'p'
    );
    if (!OWN_CHOICES.includes(own)) {
      throw new Error(`Ownership must be one letter: ${formatOwnPromptLegend()}`);
    }
    const type = await p.askKeep(
      `Project kind — enter one letter (${formatTypePromptLegend()})`,
      defaults.type || 'a'
    );
    if (!TYPE_CHOICES.includes(type)) {
      throw new Error(`Project kind must be one letter: ${formatTypePromptLegend()}`);
    }
    let pn = await p.askKeep('ProjectName (PascalCase)', defaults.projectName || 'MyProject');
    if (!/^[A-Z][a-zA-Z0-9]{0,41}$/.test(pn)) {
      pn = normalizeToPascalCaseProjectName(pn);
    }
    const tagsRaw = await p.askKeep('Tags (comma-separated, optional)', defaults.tagsStr || '');
    const tags = tagsRaw.split(/[\s,]+/).filter(Boolean);
    for (const t of tags) {
      if (!validateTagSegment(t)) throw new Error(`Invalid tag segment: ${t}`);
    }
    assertTagsAllowed(root, tags);
    if (isProjectNameTaken(root, pn)) {
      throw new Error(`ProjectName already in use: ${pn}`);
    }
    const ownerRaw = (await p.askKeep('Owner (optional)', defaults.owner || '')).trim();
    return { own, type, projectName: pn, tags, owner: ownerRaw || undefined };
  } finally {
    p.close();
  }
}

export function stdinIsTTY() {
  return !!input.isTTY;
}

/**
 * Interactive confirm for destructive import (proj new).
 * @returns {Promise<boolean>}
 */
export async function confirmImportSourceRemoval(sourceAbs, destRepo) {
  const p = await createPrompt();
  try {
    console.error(
      `This will move all contents of:\n  ${sourceAbs}\ninto:\n  ${destRepo}\n` +
        'and then DELETE the source directory. Type YES to continue:'
    );
    const a = await p.askRaw('');
    return a === 'YES';
  } finally {
    p.close();
  }
}

/**
 * @returns {Promise<boolean>}
 */
export async function confirmRmProject(absPath) {
  const p = await createPrompt();
  try {
    console.error(`Permanently delete project directory?\n  ${absPath}\nType YES to continue:`);
    const a = await p.askRaw('');
    return a === 'YES';
  } finally {
    p.close();
  }
}
