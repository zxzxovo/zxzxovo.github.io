import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORY_KEYS, type CategoryKey } from "../src/config/categories";
import { isIsoDateTime } from "../src/config/content";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
export const POSTS_DIR = join(PROJECT_ROOT, "src", "content", "posts");
export const PUBLIC_DIR = join(PROJECT_ROOT, "public");

export type RawPostData = {
  title?: unknown;
  slug?: unknown;
  date?: unknown;
  updated?: unknown;
  description?: unknown;
  cover?: unknown;
  categories?: unknown;
  tags?: unknown;
  draft?: unknown;
};

export type ParsedPost = {
  file: string;
  data: RawPostData;
};

export type ValidationIssue = {
  file: string;
  message: string;
};

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const forbiddenSlugCharacters = /[<>:"/\\|?*#%\u0000-\u001f]/;
const windowsReservedName = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

export function parseFrontmatter(source: string, file: string): ParsedPost {
  const match = source.match(frontmatterPattern);
  if (!match) throw new Error(`${file}: 缺少 YAML Frontmatter`);

  const data = Bun.YAML.parse(match[1]);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${file}: Frontmatter 必须是对象`);
  }

  return { file, data: data as RawPostData };
}

export async function loadPosts(): Promise<ParsedPost[]> {
  const entries = await readdir(POSTS_DIR, { withFileTypes: true });
  const markdownFiles = entries
    .filter((entry) => entry.isFile() && /\.mdx?$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "zh-CN"));

  return Promise.all(
    markdownFiles.map(async (name) => {
      const path = join(POSTS_DIR, name);
      return parseFrontmatter(await readFile(path, "utf8"), name);
    }),
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function validateSlug(slug: string): string | undefined {
  if (!slug.trim()) return "slug 不能为空";
  if (slug !== slug.trim()) return "slug 不能包含首尾空白";
  if (slug === "." || slug === "..") return "slug 不能是相对路径";
  if (forbiddenSlugCharacters.test(slug)) return "slug 含有 URL 或文件名非法字符";
  if (/[. ]$/.test(slug)) return "slug 不能以点或空格结尾";
  if (windowsReservedName.test(slug)) return "slug 不能使用 Windows 保留名称";
  return undefined;
}

export function sanitizeSlug(title: string): string {
  let slug = title
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[<>:"/\\|?*#%\u0000-\u001f]/g, "")
    .replace(/[A-Z]/g, (letter) => letter.toLowerCase())
    .replace(/^[. -]+|[. ]+$/g, "");

  if (!slug || windowsReservedName.test(slug)) slug = `post-${slug || "draft"}`;
  return slug;
}

export function shanghaiTimestamp(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}:${value("second")}+08:00`;
}

export async function validatePosts(posts: ParsedPost[]): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const exactSlugs = new Map<string, string>();
  const foldedSlugs = new Map<string, string>();

  for (const post of posts) {
    const { data, file } = post;
    if (!isNonEmptyString(data.title)) issues.push({ file, message: "title 必须是非空字符串" });

    if (!isNonEmptyString(data.slug)) {
      issues.push({ file, message: "slug 必须是非空字符串" });
    } else {
      const slugIssue = validateSlug(data.slug);
      if (slugIssue) issues.push({ file, message: slugIssue });

      const previousExact = exactSlugs.get(data.slug);
      if (previousExact) issues.push({ file, message: `slug 与 ${previousExact} 重复` });
      exactSlugs.set(data.slug, file);

      const folded = data.slug.toLocaleLowerCase("en-US");
      const previousFolded = foldedSlugs.get(folded);
      if (previousFolded && previousFolded !== file) {
        issues.push({ file, message: `slug 与 ${previousFolded} 仅大小写不同` });
      }
      foldedSlugs.set(folded, file);
    }

    if (!isIsoDateTime(data.date)) {
      issues.push({ file, message: "date 必须是有效的 ISO 8601 时间" });
    }
    if (data.updated !== undefined && !isIsoDateTime(data.updated)) {
      issues.push({ file, message: "updated 必须是有效的 ISO 8601 时间" });
    }

    if (typeof data.draft !== "boolean") issues.push({ file, message: "draft 必须显式填写 true 或 false" });
    if (!isStringArray(data.tags)) issues.push({ file, message: "tags 必须是字符串数组" });
    if (!isStringArray(data.categories)) {
      issues.push({ file, message: "categories 必须是字符串数组" });
    } else {
      const unknown = data.categories.filter(
        (category) => !CATEGORY_KEYS.includes(category as CategoryKey),
      );
      if (unknown.length) issues.push({ file, message: `未知分类：${unknown.join(", ")}` });
      if (new Set(data.categories).size !== data.categories.length) {
        issues.push({ file, message: "categories 不能包含重复值" });
      }
    }

    if (data.draft === false) {
      if (!isNonEmptyString(data.description)) issues.push({ file, message: "已发布文章必须填写 description" });
      if (!Array.isArray(data.categories) || data.categories.length === 0) {
        issues.push({ file, message: "已发布文章至少需要一个分类" });
      }
    }

    if (data.cover !== undefined) {
      if (!isNonEmptyString(data.cover) || !data.cover.startsWith("/")) {
        issues.push({ file, message: "cover 必须是以 / 开头的 public 路径" });
      } else {
        const coverPath = resolve(PUBLIC_DIR, `.${data.cover}`);
        const pathFromPublic = relative(PUBLIC_DIR, coverPath);
        if (isAbsolute(pathFromPublic) || pathFromPublic.startsWith("..")) {
          issues.push({ file, message: "cover 不能逃逸 public 目录" });
        } else if (!(await Bun.file(coverPath).exists())) {
          issues.push({ file, message: `cover 文件不存在：${data.cover}` });
        }
      }
    }
  }

  return issues;
}

export function postFilename(slug: string) {
  return `${slug}.md`;
}

export function displayPath(path: string) {
  return relative(PROJECT_ROOT, path).replaceAll("\\", "/");
}

export function postTitle(post: ParsedPost) {
  return isNonEmptyString(post.data.title) ? post.data.title : basename(post.file, ".md");
}
