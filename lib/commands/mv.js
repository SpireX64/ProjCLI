import fs from 'fs';
import path from 'path';
import { requireRoot } from '../config.js';
import {
  buildFolderName,
  parseFolderName,
  validateFolderName,
  normalizeToPascalCaseProjectName,
  OWN_CHOICES,
  TYPE_CHOICES,
  formatOwnPromptLegend,
  formatTypePromptLegend,
} from '../naming.js';
import { resolveProject, isProjectNameTaken, isCurrentProjectToken } from '../projects.js';
import { relinkFavoritesAfterRename } from '../fav.js';
import { createPrompt, warnTagRegistry } from '../cli-shared.js';

export async function cmdMv(rest) {
  const root = requireRoot();
  if (rest.length === 2) {
    let from = rest[0];
    const to = rest[1];
    if (isCurrentProjectToken(from)) {
      from = resolveProject(root, from).basename;
    }
    const fromPath = path.join(root, from);
    const toPath = path.join(root, to);
    if (!validateFolderName(from)) throw new Error(`Invalid source name: ${from}`);
    if (!fs.existsSync(fromPath)) throw new Error(`Not found under root: ${from}`);
    let stFrom;
    try {
      stFrom = fs.lstatSync(fromPath);
    } catch {
      throw new Error(`Not found under root: ${from}`);
    }
    if (stFrom.isSymbolicLink()) {
      throw new Error(`Source must not be a symlink: ${from}`);
    }
    if (!stFrom.isDirectory()) throw new Error(`Not a directory: ${fromPath}`);
    if (!validateFolderName(to)) throw new Error(`Invalid target name: ${to}`);
    if (fs.existsSync(toPath)) {
      let stTo;
      try {
        stTo = fs.lstatSync(toPath);
      } catch {
        throw new Error(`Target already exists: ${to}`);
      }
      if (stTo.isSymbolicLink()) {
        throw new Error(`Target is a symlink: ${to}`);
      }
      throw new Error(`Target already exists: ${to}`);
    }
    const parsedTo = parseFolderName(to);
    if (!parsedTo) throw new Error('Invalid target');
    if (isProjectNameTaken(root, parsedTo.projectName, from)) {
      throw new Error(`ProjectName already in use: ${parsedTo.projectName}`);
    }
    fs.renameSync(fromPath, toPath);
    relinkFavoritesAfterRename(root, from, path.basename(to));
    return;
  }
  if (rest.length !== 1) {
    throw new Error('Usage: proj mv <from> <to>   or   proj mv <ProjectName|basename>');
  }
  const entry = resolveProject(root, rest[0]);
  warnTagRegistry(root);
  const p = await createPrompt();
  try {
    const cur = entry.parsed;
    const own = await p.askKeep(`Ownership — one letter (${formatOwnPromptLegend()})`, cur.own);
    if (!OWN_CHOICES.includes(own)) {
      throw new Error(`Ownership must be one letter: ${formatOwnPromptLegend()}`);
    }
    const type = await p.askKeep(`Project kind — one letter (${formatTypePromptLegend()})`, cur.type);
    if (!TYPE_CHOICES.includes(type)) {
      throw new Error(`Project kind must be one letter: ${formatTypePromptLegend()}`);
    }
    let pn = await p.askKeep('ProjectName', cur.projectName);
    if (!/^[A-Z][a-zA-Z0-9]{0,41}$/.test(pn)) {
      pn = normalizeToPascalCaseProjectName(pn);
    }
    const newBase = buildFolderName(own, type, pn);
    if (newBase === entry.basename) {
      console.log('No change.');
      return;
    }
    const dest = path.join(root, newBase);
    if (fs.existsSync(dest)) throw new Error(`Target already exists: ${newBase}`);
    if (isProjectNameTaken(root, pn, entry.basename)) {
      throw new Error(`ProjectName already in use: ${pn}`);
    }
    fs.renameSync(entry.abs, dest);
    relinkFavoritesAfterRename(root, entry.basename, newBase);
  } finally {
    p.close();
  }
}
