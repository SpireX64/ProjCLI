import { useColor, color } from './colors.js';
import { describeOwnType } from './naming.js';

/**
 * @param {import('./naming.js').ParsedFolder} parsed
 * @returns {string} e.g. `MyApp (personal application) — web, rn`
 */
export function formatProjectLine(parsed) {
  const kind = describeOwnType(parsed.own, parsed.type);
  const pn = parsed.projectName;
  const tags = parsed.tags;
  if (!tags.length) return `${pn} (${kind})`;
  return `${pn} (${kind}) — ${tags.join(', ')}`;
}

/**
 * Colored line for TTY when useColor() is true.
 * @param {import('./naming.js').ParsedFolder} parsed
 */
export function formatProjectLineColor(parsed) {
  if (!useColor()) return formatProjectLine(parsed);
  const kind = describeOwnType(parsed.own, parsed.type);
  const pn = color.cyan(parsed.projectName);
  const kindDim = color.dim(`(${kind})`);
  const tags = parsed.tags;
  if (!tags.length) return `${pn} ${kindDim}`;
  return `${pn} ${kindDim} ${color.dim('—')} ${tags.join(', ')}`;
}
