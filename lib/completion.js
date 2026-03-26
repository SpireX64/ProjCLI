import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listCompleteProjectNames } from './projects.js';
import { listFavorites } from './fav.js';
import { PUBLIC_CLI_COMMANDS } from './public-commands.js';
import { listEditorNames, getWorkspaces } from './config.js';
import { loadTags } from './tags.js';

/** Suggested .projrc keys for get/set completion (sorted when output). */
export const PROJRC_KEY_SUGGESTIONS = Object.freeze([
  'code_workspace',
  'created',
  'editor',
  'name',
  'owner',
  'tags',
  'tracker',
  'workspace',
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, '..', 'templates', 'completion');

/**
 * @param {string} filename bash.sh | zsh.sh | fish.sh | powershell.ps1
 */
function readCompletionTemplate(filename) {
  const p = path.join(TEMPLATE_DIR, filename);
  let text = fs.readFileSync(p, 'utf8');
  text = text.replace(/\r\n/g, '\n');
  if (!text.endsWith('\n')) text += '\n';
  return text;
}

/**
 * @returns {string}
 */
export function completeCommandsOutput() {
  return [...PUBLIC_CLI_COMMANDS].sort((a, b) => a.localeCompare(b)).join('\n');
}

/**
 * @param {string | null} root
 * @returns {string}
 */
export function completeProjectsOutput(root) {
  if (!root) return '';
  try {
    return listCompleteProjectNames(root).join('\n');
  } catch {
    return '';
  }
}

/**
 * @param {string | null} root
 * @returns {string}
 */
export function completeFavNamesOutput(root) {
  if (!root) return '';
  try {
    return listFavorites(root)
      .filter((f) => !f.broken)
      .map((f) => f.name)
      .sort((a, b) => a.localeCompare(b))
      .join('\n');
  } catch {
    return '';
  }
}

/**
 * @returns {string}
 */
export function completeEditorsOutput() {
  try {
    return listEditorNames().join('\n');
  } catch {
    return '';
  }
}

/**
 * @returns {string}
 */
export function completeWorkspacesOutput() {
  try {
    return Object.keys(getWorkspaces())
      .sort((a, b) => a.localeCompare(b))
      .join('\n');
  } catch {
    return '';
  }
}

/**
 * @param {string | null} root
 * @returns {string}
 */
export function completeTagIdsOutput(root) {
  if (!root) return '';
  try {
    const { ids } = loadTags(root);
    return [...ids].sort((a, b) => a.localeCompare(b)).join('\n');
  } catch {
    return '';
  }
}

/**
 * @returns {string}
 */
export function completeProjrcKeysOutput() {
  return [...PROJRC_KEY_SUGGESTIONS].sort((a, b) => a.localeCompare(b)).join('\n');
}

/**
 * @param {'bash' | 'zsh' | 'fish' | 'powershell'} shell
 */
export function generateCompletionScript(shell) {
  if (shell === 'bash') return readCompletionTemplate('bash.sh');
  if (shell === 'zsh') return readCompletionTemplate('zsh.sh');
  if (shell === 'fish') return readCompletionTemplate('fish.sh');
  if (shell === 'powershell') return readCompletionTemplate('powershell.ps1');
  throw new Error(`Unknown shell: ${shell}`);
}
