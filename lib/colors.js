/**
 * TTY colors respecting NO_COLOR and FORCE_COLOR.
 * @see https://no-color.org/
 */
const _colorEnabled = (() => {
  if (process.env.NO_COLOR && process.env.NO_COLOR !== '') return false;
  if (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== '') return true;
  return !!process.stdout.isTTY;
})();

export function useColor() {
  return _colorEnabled;
}

function wrap(code, s) {
  if (!_colorEnabled) return s;
  return `\u001b[${code}m${s}\u001b[0m`;
}

export const color = {
  dim: (s) => wrap('2', s),
  cyan: (s) => wrap('36', s),
  green: (s) => wrap('32', s),
  yellow: (s) => wrap('33', s),
  red: (s) => wrap('31', s),
};
