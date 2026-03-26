import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUBLIC_CLI_COMMANDS } from './public-commands.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HELP_DIR = path.join(__dirname, '..', 'help');

/** Help file basename equals command name (see PUBLIC_CLI_COMMANDS). */
const HELP_FILE_BY_COMMAND = Object.freeze(
  Object.fromEntries(PUBLIC_CLI_COMMANDS.map((cmd) => [cmd, cmd]))
);

/**
 * @param {string} name  file basename without .txt (e.g. global, ls, tags)
 */
export function readHelpFile(name) {
  const filePath = path.join(HELP_DIR, `${name}.txt`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing help file: ${filePath}`);
  }
  let text = fs.readFileSync(filePath, 'utf8');
  text = text.replace(/\r\n/g, '\n');
  if (!text.endsWith('\n')) text += '\n';
  return text;
}

export const globalHelp = readHelpFile('global');

/**
 * @param {string} cmd
 */
export function helpForCommand(cmd) {
  const file = HELP_FILE_BY_COMMAND[cmd];
  if (!file) return null;
  try {
    return readHelpFile(file);
  } catch {
    return null;
  }
}
