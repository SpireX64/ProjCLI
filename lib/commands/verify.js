import { requireRoot } from '../config.js';
import { verifyAll } from '../verify.js';

export function cmdVerify() {
  const root = requireRoot();
  const { ok, issues, migrations } = verifyAll(root);
  for (const m of migrations) console.log(m);
  for (const i of issues) console.error(i);
  if (!ok) process.exitCode = 1;
}
