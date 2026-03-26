import fs from 'fs';
import path from 'path';
import { requireRoot } from '../config.js';
import {
  buildFolderName,
  parseFolderName,
  validateFolderName,
  normalizeToPascalCaseProjectName,
} from '../naming.js';
import { isProjectNameTaken } from '../projects.js';
import { loadTags } from '../tags.js';
import { createStandardLayout, moveDirectoryContents } from '../layout.js';
import { writeInitialProjrc } from '../projrc.js';
import {
  warnTagRegistry,
  collectInteractive,
  stdinIsTTY,
  confirmImportSourceRemoval,
} from '../cli-shared.js';

/**
 * @returns {{ dry: boolean, force: boolean, args: string[] }}
 */
function parseNewFlags(rest) {
  let dry = false;
  let force = false;
  const args = [];
  for (const a of rest) {
    if (a === '--dry-run') dry = true;
    else if (a === '--force') force = true;
    else args.push(a);
  }
  return { dry, force, args };
}

export async function cmdNew(rest) {
  const root = requireRoot();
  const { dry, force, args } = parseNewFlags(rest);
  const hint = args[0];
  const warnAbs = (abs, base) => {
    const want = path.join(root, base);
    if (path.resolve(abs) !== want && path.dirname(path.resolve(abs)) !== root) {
      console.warn(`Note: creating ${want} under projects root (basename only).`);
    }
  };

  if (hint) {
    const resolved = path.resolve(hint);
    const base = path.basename(resolved);
    const exists = fs.existsSync(resolved);

    if (!exists && validateFolderName(base)) {
      warnAbs(resolved, base);
      const parsed = parseFolderName(base);
      if (!parsed) throw new Error('Invalid folder name');
      warnTagRegistry(root);
      const { duplicateWarnings } = loadTags(root);
      for (const w of duplicateWarnings) console.warn(w);
      if (isProjectNameTaken(root, parsed.projectName)) {
        throw new Error(`ProjectName already in use: ${parsed.projectName}`);
      }
      const dest = path.join(root, base);
      if (fs.existsSync(dest)) throw new Error(`Already exists: ${dest}`);
      if (dry) {
        console.log(`Would create layout at ${dest}`);
        return;
      }
      createStandardLayout(dest);
      writeInitialProjrc(dest, { projectName: parsed.projectName });
      console.log(dest);
      return;
    }

    if (!exists) {
      const defPn = normalizeToPascalCaseProjectName(base);
      const data = await collectInteractive(root, { projectName: defPn });
      const canonical = buildFolderName(data.own, data.type, data.projectName);
      const dest = path.join(root, canonical);
      if (fs.existsSync(dest)) throw new Error(`Already exists: ${dest}`);
      if (dry) {
        console.log(`Would create layout at ${dest}`);
        return;
      }
      createStandardLayout(dest);
      writeInitialProjrc(dest, {
        projectName: data.projectName,
        owner: data.owner,
        tags: data.tags.length ? data.tags : undefined,
      });
      console.log(dest);
      return;
    }

    const sourceAbs = resolved;
    if (!fs.statSync(sourceAbs).isDirectory()) {
      throw new Error(`Not a directory: ${sourceAbs}`);
    }
    const hasGit = fs.existsSync(path.join(sourceAbs, '.git'));
    const defPn = normalizeToPascalCaseProjectName(path.basename(sourceAbs));
    const data = await collectInteractive(root, { projectName: defPn });
    const canonical = buildFolderName(data.own, data.type, data.projectName);
    const dest = path.join(root, canonical);
    const destRepo = path.join(dest, 'repo');
    if (fs.existsSync(dest)) throw new Error(`Target already exists: ${dest}`);
    if (isProjectNameTaken(root, data.projectName)) {
      throw new Error(`ProjectName already in use: ${data.projectName}`);
    }
    if (dry) {
      console.log(
        `Would create ${dest}, move all contents from ${sourceAbs} into ${destRepo}, delete source (has .git: ${hasGit})`
      );
      return;
    }
    if (!stdinIsTTY() && !force) {
      throw new Error(
        'Importing an existing directory requires --force when stdin is not a terminal. ' +
          'Or run with a TTY to confirm interactively. Use proj new <path> --dry-run to preview.'
      );
    }
    if (stdinIsTTY() && !force) {
      const ok = await confirmImportSourceRemoval(sourceAbs, destRepo);
      if (!ok) {
        console.log('Cancelled.');
        return;
      }
    }
    createStandardLayout(dest);
    moveDirectoryContents(sourceAbs, destRepo);
    try {
      fs.rmSync(sourceAbs, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    writeInitialProjrc(dest, {
      projectName: data.projectName,
      owner: data.owner,
      tags: data.tags.length ? data.tags : undefined,
    });
    console.log(dest);
    return;
  }

  const data = await collectInteractive(root, {});
  const canonical = buildFolderName(data.own, data.type, data.projectName);
  const dest = path.join(root, canonical);
  if (fs.existsSync(dest)) throw new Error(`Already exists: ${dest}`);
  if (dry) {
    console.log(`Would create layout at ${dest}`);
    return;
  }
  createStandardLayout(dest);
  writeInitialProjrc(dest, {
    projectName: data.projectName,
    owner: data.owner,
    tags: data.tags.length ? data.tags : undefined,
  });
  console.log(dest);
}
