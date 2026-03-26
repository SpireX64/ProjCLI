import { getRoot } from '../config.js';
import {
  generateCompletionScript,
  completeCommandsOutput,
  completeProjectsOutput,
  completeFavNamesOutput,
  completeEditorsOutput,
  completeWorkspacesOutput,
  completeTagIdsOutput,
  completeProjrcKeysOutput,
} from '../completion.js';

/** @param {string | undefined} raw */
function normalizeCompletionShell(raw) {
  if (raw === 'pwsh' || raw === 'powershell') return 'powershell';
  return raw ?? '';
}

export function cmdCompletion(rest) {
  const shell = normalizeCompletionShell(rest[0]);
  if (!shell || !['bash', 'zsh', 'fish', 'powershell'].includes(shell)) {
    console.error('Usage: proj completion bash|zsh|fish|powershell (alias: pwsh)');
    process.exitCode = 1;
    return;
  }
  console.log(generateCompletionScript(/** @type {'bash'|'zsh'|'fish'|'powershell'} */ (shell)));
}

export function cmdCompleteInternal(rest) {
  const kind = rest[0];
  if (kind === 'commands') {
    process.stdout.write(completeCommandsOutput() + '\n');
    return;
  }
  if (kind === 'projects') {
    const s = completeProjectsOutput(getRoot());
    process.stdout.write(s ? `${s}\n` : '');
    return;
  }
  if (kind === 'fav-names') {
    const s = completeFavNamesOutput(getRoot());
    process.stdout.write(s ? `${s}\n` : '');
    return;
  }
  if (kind === 'editors') {
    const s = completeEditorsOutput();
    process.stdout.write(s ? `${s}\n` : '');
    return;
  }
  if (kind === 'workspaces') {
    process.stdout.write(completeWorkspacesOutput() + '\n');
    return;
  }
  if (kind === 'tag-ids') {
    const s = completeTagIdsOutput(getRoot());
    process.stdout.write(s ? `${s}\n` : '');
    return;
  }
  if (kind === 'projrc-keys') {
    process.stdout.write(completeProjrcKeysOutput() + '\n');
    return;
  }
  process.exitCode = 1;
}
