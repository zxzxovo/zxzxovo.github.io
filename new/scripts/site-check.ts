import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distRoot = join(projectRoot, "dist");
const linkPattern = /\b(?:href|src)=(?:"([^"]+)"|'([^']+)')/g;

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }),
  );
  return files.flat();
}

async function exists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function resolvesInDist(url: string) {
  const withoutFragment = url.split("#", 1)[0].split("?", 1)[0];
  if (!withoutFragment) return true;

  let pathname: string;
  try {
    pathname = decodeURIComponent(withoutFragment);
  } catch {
    return false;
  }

  const target = resolve(distRoot, `.${pathname.startsWith("/") ? pathname : `/${pathname}`}`);
  const relativeTarget = relative(distRoot, target);
  if (relativeTarget.startsWith("..") || resolve(target) !== target) return false;

  if (extname(pathname)) return exists(target);
  return (
    (await exists(target)) ||
    (await exists(`${target}.html`)) ||
    (await exists(join(target, "index.html")))
  );
}

if (!(await exists(distRoot))) {
  console.error("缺少 dist/，请先运行 bun run build。");
  process.exit(1);
}

const htmlFiles = (await walk(distRoot)).filter((file) => file.endsWith(".html"));
const failures: Array<{ file: string; url: string }> = [];

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(linkPattern)) {
    const url = match[1] ?? match[2];
    if (
      !url ||
      url.startsWith("#") ||
      /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(url)
    ) {
      continue;
    }
    if (!(await resolvesInDist(url))) failures.push({ file, url });
  }
}

if (failures.length) {
  console.error(`站点链接检查失败，共 ${failures.length} 处：`);
  for (const failure of failures) {
    console.error(`- ${relative(projectRoot, failure.file).replaceAll("\\", "/")}: ${failure.url}`);
  }
  process.exit(1);
}

console.log(`站点链接检查通过：${htmlFiles.length} 个 HTML 页面`);
