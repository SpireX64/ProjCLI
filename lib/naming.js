/** @typedef {{ own: string, type: string, projectName: string, tags: string[] }} ParsedFolder */

const OWN_SET = new Set(['p', 'g', 's', 'w']);
const TYPE_SET = new Set(['a', 'p', 'x']);

const PROJECT_NAME_RE = /^[A-Z][a-zA-Z0-9]{0,41}$/;
const TAG_SEGMENT_RE = /^[a-z][a-zA-Z0-9]*$/;

const BASENAME_NO_TAGS = /^([pgsw])([apx])_([A-Z][a-zA-Z0-9]{0,41})$/;
const BASENAME_WITH_SUFFIX = /^([pgsw])([apx])_([A-Z][a-zA-Z0-9]{0,41})_(.+)$/;

/**
 * @param {string} s
 */
export function validateTagSegment(s) {
  return TAG_SEGMENT_RE.test(s);
}

/**
 * @param {string} basename
 * @returns {ParsedFolder | null}
 */
export function parseFolderName(basename) {
  let m = basename.match(BASENAME_NO_TAGS);
  if (m) {
    return { own: m[1], type: m[2], projectName: m[3], tags: [] };
  }
  m = basename.match(BASENAME_WITH_SUFFIX);
  if (!m) return null;
  const tags = m[4].split('-');
  if (tags.length === 0 || tags.length > 5) return null;
  for (const t of tags) {
    if (!validateTagSegment(t)) return null;
  }
  return { own: m[1], type: m[2], projectName: m[3], tags };
}

/**
 * @param {string} basename
 */
export function validateFolderName(basename) {
  return parseFolderName(basename) !== null;
}

/**
 * @param {string} own
 * @param {string} type
 * @param {string} projectName
 * @param {string[]} tags
 */
export function buildFolderName(own, type, projectName, tags) {
  if (!OWN_SET.has(own) || !TYPE_SET.has(type)) {
    throw new Error('Invalid own/type');
  }
  if (!PROJECT_NAME_RE.test(projectName)) {
    throw new Error('Invalid ProjectName (strict PascalCase, 1–42 chars)');
  }
  if (tags.length > 5) throw new Error('At most 5 tag segments');
  for (const t of tags) {
    if (!validateTagSegment(t)) throw new Error(`Invalid tag segment: ${t}`);
  }
  const mid = `${own}${type}_${projectName}`;
  if (tags.length === 0) return mid;
  return `${mid}_${tags.join('-')}`;
}

/**
 * @param {string} name
 */
export function suggestProjectNameFromPath(name) {
  const base = name.replace(/\.[^/.]+$/, '');
  const parts = base.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (parts.length === 0) return 'Project';
  return parts
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase().replace(/[^a-zA-Z0-9]/g, ''))
    .join('');
}

/**
 * @param {string} suggested
 */
export function normalizeToPascalCaseProjectName(suggested) {
  const trimmed = suggested.trim();
  if (PROJECT_NAME_RE.test(trimmed)) {
    return trimmed;
  }
  const base = trimmed.replace(/\.[^/.]+$/, '');
  const parts = base.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (parts.length === 1 && /^[a-zA-Z]/.test(parts[0])) {
    const token = parts[0];
    const candidate = token[0].toUpperCase() + token.slice(1);
    if (PROJECT_NAME_RE.test(candidate)) {
      return candidate;
    }
  }
  let s = suggestProjectNameFromPath(suggested);
  if (!PROJECT_NAME_RE.test(s)) {
    s = 'Project';
  }
  return s;
}

export const OWN_CHOICES = ['p', 'g', 's', 'w'];
export const TYPE_CHOICES = ['a', 'p', 'x'];

/** @type {Record<string, string>} */
export const OWN_LABELS = { p: 'personal', g: 'group', s: 'company', w: 'work' };

/** @type {Record<string, string>} */
export const TYPE_LABELS = { a: 'application', p: 'package', x: 'experiment' };

/**
 * @param {string} own
 * @param {string} type
 */
export function describeOwnType(own, type) {
  const o = OWN_LABELS[own] ?? own;
  const t = TYPE_LABELS[type] ?? type;
  return `${o} ${t}`;
}

/** One-line legend for prompts, e.g. `p=personal, g=group, s=company, w=work` */
export function formatOwnPromptLegend() {
  return OWN_CHOICES.map((c) => `${c}=${OWN_LABELS[c]}`).join(', ');
}

/** One-line legend for prompts, e.g. `a=application, p=package, x=experiment` */
export function formatTypePromptLegend() {
  return TYPE_CHOICES.map((c) => `${c}=${TYPE_LABELS[c]}`).join(', ');
}
