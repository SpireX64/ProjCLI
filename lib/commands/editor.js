import { setEditorTemplate } from '../config.js';

export function cmdEditor(rest) {
  const name = rest[0];
  const template = rest.slice(1).join(' ').trim();
  if (!name) throw new Error('Usage: proj editor <name> <commandTemplate>');
  if (!template) throw new Error('Missing command template (use $dir for project path)');
  setEditorTemplate(name, template);
}
