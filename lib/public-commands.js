/**
 * Public `proj <cmd>` subcommands (excluding internal `__complete`).
 * Single source for completion output and help file mapping.
 *
 * When adding a command: append the name here (sorted), add a `case` in `cli.js`,
 * and add `help/<cmd>.txt`.
 */
export const PUBLIC_CLI_COMMANDS = Object.freeze([
  'clone',
  'completion',
  'dir',
  'fav',
  'get',
  'ls',
  'mv',
  'new',
  'open',
  'pwd',
  'rm',
  'set',
  'status',
  'tag',
  'tags',
  'use',
  'verify',
]);
