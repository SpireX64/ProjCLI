import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listCompleteProjectNames } from './projects.js';
import { listFavorites } from './fav.js';
import { PUBLIC_CLI_COMMANDS } from './public-commands.js';
import { listEditorNames } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, '..', 'templates', 'completion');

/**
 * @param {string} filename bash.sh | zsh.sh | fish.sh
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
 * @param {'bash' | 'zsh' | 'fish'} shell
 */
export function generateCompletionScript(shell) {
  if (shell === 'bash') return readCompletionTemplate('bash.sh');
  if (shell === 'zsh') return readCompletionTemplate('zsh.sh');
  if (shell === 'fish') return readCompletionTemplate('fish.sh');
  throw new Error(`Unknown shell: ${shell}`);
}
