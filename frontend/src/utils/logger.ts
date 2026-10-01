import { LOG_TEMPLATES } from "../constants/logTemplates";

type TemplateGroup = keyof typeof LOG_TEMPLATES;

function fill(template: string, vars: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined || vars[key] === "" ? "∅" : String(vars[key])
  );
}

/**
 * 统一日志出口：写操作必须带模板名（组名下标）与变量，
 * 字段变更时先改 constants/logTemplates.ts，再改调用处。
 */
export function log(group: TemplateGroup, index: number, vars: Record<string, string | number | undefined> = {}): void {
  const templates = LOG_TEMPLATES[group];
  const template = templates[index] ?? `[${group}#${index}]`;
  console.info(`[versioning] ${fill(template, vars)}`);
}
