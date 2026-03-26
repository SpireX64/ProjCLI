import { setEditorTemplate } from '../config.js';

export function cmdEditor(rest) {
  const name = rest[0];
  const template = rest.slice(1).join(' ').trim();
  if (!name) throw new Error('Usage: proj editor <name> <commandTemplate>');
  if (!template) throw new Error('Missing command template (use $dir for project path)');
  if (!template.includes('$dir')) {
    console.warn(
      'proj: warning: template has no $dir. If you used double quotes, the shell may have expanded $dir when saving; use single quotes, e.g. proj editor name \'foo $dir\''
    );
  }
  setEditorTemplate(name, template);
}
