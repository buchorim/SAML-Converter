// Browser shim for node:path — only basename and extname needed
export function basename(path: string, ext?: string): string {
  const name = path.split(/[/\\]/u).pop() || path;
  return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name;
}

export function extname(path: string): string {
  const dot = path.lastIndexOf(".");
  return dot > 0 ? path.slice(dot) : "";
}
