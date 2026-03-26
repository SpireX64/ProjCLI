import { getRoot } from '../config.js';
import {
  generateCompletionScript,
  completeCommandsOutput,
  completeProjectsOutput,
  completeFavNamesOutput,
  completeEditorsOutput,
} from '../completion.js';

export function cmdCompletion(rest) {
  const shell = rest[0];
  if (!shell || !['bash', 'zsh', 'fish'].includes(shell)) {
    console.error('Usage: proj completion bash|zsh|fish');
    process.exitCode = 1;
    return;
  }
  console.log(generateCompletionScript(/** @type {'bash'|'zsh'|'fish'} */ (shell)));
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
  process.exitCode = 1;
}
