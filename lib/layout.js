import fs from 'fs';
import path from 'path';

const SUBDIRS = ['worktrees', 'notes', 'tasks', path.join('tasks', 'archive'), path.join('tasks', 'backlog'), 'etc'];

/**
 * @param {string} destRoot
 */
export function createStandardLayout(destRoot) {
  fs.mkdirSync(destRoot, { recursive: true });
  for (const s of SUBDIRS) {
    fs.mkdirSync(path.join(destRoot, s), { recursive: true });
  }
}

/**
 * @param {string} oldP
 * @param {string} newP
 */
function tryRenameSync(oldP, newP) {
  try {
    fs.renameSync(oldP, newP);
    return true;
  } catch (e) {
    const err = /** @type {NodeJS.ErrnoException} */ (e);
    if (err.code === 'EXDEV') return false;
    throw e;
  }
}

/**
 * Move file or directory into destDir (cross-device safe)
 * @param {string} src
 * @param {string} destDir
 */
export function moveIntoDirectory(src, destDir) {
  const base = path.basename(src);
  const dest = path.join(destDir, base);
  if (tryRenameSync(src, dest)) return;
  fs.cpSync(src, dest, { recursive: true, force: true });
  fs.rmSync(src, { recursive: true, force: true });
}

/**
 * Move every child of srcDir into destDir
 * @param {string} srcDir
 * @param {string} destDir
 */
export function moveDirectoryContents(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    moveIntoDirectory(path.join(srcDir, name), destDir);
  }
}
