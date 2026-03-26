import { globalHelp, helpForCommand } from './help.js';
import { cmdDir } from './commands/dir.js';
import { cmdUse } from './commands/use.js';
import { cmdPwd } from './commands/pwd.js';
import { cmdLs } from './commands/ls.js';
import { cmdTags } from './commands/tags.js';
import { cmdNew } from './commands/new.js';
import { cmdFav } from './commands/fav.js';
import { cmdMv } from './commands/mv.js';
import { cmdTag } from './commands/tag.js';
import { cmdOpen } from './commands/open.js';
import { cmdEditor } from './commands/editor.js';
import { cmdStatus } from './commands/status.js';
import { cmdGet } from './commands/get.js';
import { cmdSet } from './commands/set.js';
import { cmdRm } from './commands/rm.js';
import { cmdClone } from './commands/clone.js';
import { cmdCompletion, cmdCompleteInternal } from './commands/completion.js';
import { cmdVerify } from './commands/verify.js';

function wantsHelp(argv) {
  return argv.includes('--help') || argv.includes('-h');
}

export async function run(argv) {
  if (argv.length === 0) {
    console.log(globalHelp);
    return;
  }
  const cmd = argv[0];
  let rest = argv.slice(1);

  if (cmd === '__complete') {
    cmdCompleteInternal(rest);
    return;
  }

  // proj --help / proj -h (no real subcommand yet)
  if (wantsHelp([cmd])) {
    console.log(globalHelp);
    return;
  }

  if (wantsHelp(rest)) {
    const h = helpForCommand(cmd);
    if (h) {
      console.log(h);
    } else {
      console.log(globalHelp);
    }
    return;
  }
  rest = rest.filter((a) => a !== '--help' && a !== '-h');

  try {
    switch (cmd) {
      case 'dir':        cmdDir(rest); break;
      case 'use':        cmdUse(rest); break;
      case 'pwd':        cmdPwd(rest); break;
      case 'ls':         cmdLs(rest); break;
      case 'tags':       cmdTags(); break;
      case 'new':        await cmdNew(rest); break;
      case 'open':       cmdOpen(rest); break;
      case 'editor':     cmdEditor(rest); break;
      case 'status':     cmdStatus(rest); break;
      case 'clone':      await cmdClone(rest); break;
      case 'get':        cmdGet(rest); break;
      case 'set':        cmdSet(rest); break;
      case 'rm':         await cmdRm(rest); break;
      case 'completion': cmdCompletion(rest); break;
      case 'fav':        cmdFav(rest); break;
      case 'mv':         await cmdMv(rest); break;
      case 'tag':        cmdTag(rest); break;
      case 'verify':     cmdVerify(); break;
      default:
        console.error(`Unknown command: ${cmd}`);
        console.log(globalHelp);
        process.exitCode = 1;
    }
  } catch (e) {
    const err = /** @type {Error} */ (e);
    if (/** @type {any} */ (err).hint) {
      console.log(/** @type {any} */ (err).hint);
    } else {
      console.error(err.message || String(e));
    }
    process.exitCode = 1;
  }
}
