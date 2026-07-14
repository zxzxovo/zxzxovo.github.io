import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  CATEGORY_KEYS,
  CATEGORY_META,
  type CategoryKey,
} from "../src/config/categories";
import {
  PAGE_SIZE,
  formatPostDate,
  getAdjacentPosts,
  getCategoryHref,
  getPostHref,
  sortPosts,
  type PostEntry,
} from "../src/lib/posts";
import {
  sanitizeSlug,
  shanghaiTimestamp,
  validateSlug,
} from "../scripts/post-lib";
import { isIsoDateTime } from "../src/config/content";

const projectRoot = join(import.meta.dir, "..");
const postsDirectory = join(projectRoot, "src", "content", "posts");

const expectedDates = {
  "26年腊月初八": "2026-01-26T00:00:00+08:00",
  AAA: "2025-11-25T00:00:00+08:00",
  Android四大组件基础: "2025-06-21T14:54:32+08:00",
  "Clap的一些用法": "2025-02-12T20:40:22+08:00",
  "hellooo-world": "2025-01-30T13:30:00+08:00",
  Rust标准库的path: "2025-08-07T00:00:00+08:00",
  Rust标准库的Prelude: "2025-07-24T00:00:00+08:00",
  "Rust的函数式编程—-闭包": "2025-04-01T13:38:17+08:00",
  "The end of 2025": "2025-12-31T00:00:00+08:00",
  上个月的小宴菜谱: "2026-05-05T00:00:00+08:00",
  使用Tauri开发跨平台应用: "2025-04-05T00:41:44+08:00",
  我赠予离别: "2025-07-01T03:52:34+08:00",
  许多日前的晚安: "2025-02-08T01:13:35+08:00",
  许多日前的自由: "2025-02-08T02:18:14+08:00",
  语言能力的消失: "2025-08-02T00:00:00+08:00",
  月夜: "2025-05-10T08:32:42+08:00",
  再学一遍Git: "2025-02-08T20:25:00+08:00",
  冬至: "2025-04-01T13:37:48+08:00",
  孤独是一缕烟雾: "2025-06-29T10:53:46+08:00",
  解构之一: "2025-04-01T13:06:18+08:00",
  解构之二: "2025-04-20T11:15:21+08:00",
  解构之三: "2025-07-15T00:00:00+08:00",
  进制转换: "2025-02-20T00:40:47+08:00",
  某些洁癖: "2025-04-23T10:17:00+08:00",
  菜谱小记: "2025-10-01T00:00:00+08:00",
  草儿长满山丘: "2025-03-29T15:07:31+08:00",
} as const;

interface ParsedPost {
  fileName: string;
  source: string;
  slug: string;
  date: string;
  description: string;
  categories: CategoryKey[];
  draft: boolean;
  cover?: string;
}

function readScalar(header: string, key: string): string | undefined {
  const value = header.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim();
  if (value === undefined) return undefined;
  return value.startsWith('"') ? JSON.parse(value) : value;
}

async function readPosts(): Promise<ParsedPost[]> {
  const fileNames = (await readdir(postsDirectory))
    .filter((fileName) => fileName.endsWith(".md"))
    .sort();

  return fileNames.map((fileName) => {
    const source = readFileSync(join(postsDirectory, fileName), "utf8");
    const header = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
    if (!header) throw new Error(`${fileName} 缺少 Frontmatter`);

    return {
      fileName,
      source,
      slug: readScalar(header, "slug") ?? "",
      date: readScalar(header, "date") ?? "",
      description: readScalar(header, "description") ?? "",
      categories: JSON.parse(readScalar(header, "categories") ?? "[]"),
      draft: readScalar(header, "draft") === "true",
      cover: readScalar(header, "cover"),
    };
  });
}

function makePost(slug: string, date: string): PostEntry {
  return {
    id: `${slug}.md`,
    collection: "posts",
    data: { slug, date: new Date(date) },
  } as unknown as PostEntry;
}

describe("分类配置", () => {
  test("分类顺序和公开元信息稳定", () => {
    expect(CATEGORY_KEYS).toEqual(["tech", "life", "notes", "writing"]);
    for (const key of CATEGORY_KEYS) {
      expect(CATEGORY_META[key]).toMatchObject({
        key,
        href: `/categories/${key}`,
      });
      expect(CATEGORY_META[key].name.length).toBeGreaterThan(0);
      expect(CATEGORY_META[key].description.length).toBeGreaterThan(0);
    }
  });
});

describe("文章工具", () => {
  test("按完整发布时间从新到旧排序且不改变输入", () => {
    const oldest = makePost("oldest", "2025-01-01T00:00:00+08:00");
    const newest = makePost("newest", "2025-01-01T00:00:01+08:00");
    const input = [oldest, newest];

    expect(sortPosts(input).map((post) => post.data.slug)).toEqual([
      "newest",
      "oldest",
    ]);
    expect(input).toEqual([oldest, newest]);
  });

  test("生成文章、分类与分页地址", () => {
    expect(getPostHref("The end of 2025")).toBe("/blog/The%20end%20of%202025");
    expect(getPostHref("许多日前的自由")).toBe(
      "/blog/%E8%AE%B8%E5%A4%9A%E6%97%A5%E5%89%8D%E7%9A%84%E8%87%AA%E7%94%B1",
    );
    expect(getCategoryHref("life")).toBe("/categories/life");
    expect(getCategoryHref("life", 1)).toBe("/categories/life");
    expect(getCategoryHref("life", 2)).toBe("/categories/life/2");
    expect(PAGE_SIZE).toBe(10);
  });

  test("按上海时区格式化日期", () => {
    expect(formatPostDate(new Date("2025-02-08T16:30:00Z"))).toBe("2025/02/09");
  });

  test("找到较新与较旧的相邻文章", () => {
    const newest = makePost("newest", "2025-01-03T00:00:00+08:00");
    const current = makePost("current", "2025-01-02T00:00:00+08:00");
    const oldest = makePost("oldest", "2025-01-01T00:00:00+08:00");

    const adjacent = getAdjacentPosts([oldest, newest, current], "current");
    expect(adjacent.newer?.data.slug).toBe("newest");
    expect(adjacent.older?.data.slug).toBe("oldest");
    expect(getAdjacentPosts([oldest], "missing")).toEqual({});
  });

  test("为新文章生成安全且稳定的默认 slug", () => {
    expect(sanitizeSlug(" Hello World 世界 ")).toBe("hello-world-世界");
    expect(sanitizeSlug("CON")).toBe("post-con");
    expect(validateSlug("正常-slug 2026")).toBeUndefined();
    expect(validateSlug("bad/path")).toContain("非法字符");
  });

  test("默认文章时间使用上海时区和完整秒数", () => {
    expect(shanghaiTimestamp(new Date("2026-07-14T04:05:06Z"))).toBe(
      "2026-07-14T12:05:06+08:00",
    );
    expect(isIsoDateTime("2026-07-14T12:05:06+08:00")).toBeTrue();
    expect(isIsoDateTime("2026-07-14")).toBeFalse();
    expect(isIsoDateTime("2026-07-14T12:05:06")).toBeFalse();
  });
});

describe("迁移后的文章内容", () => {
  test("26 篇永久地址和完整发布时间与迁移基线一致", async () => {
    const posts = await readPosts();
    expect(posts).toHaveLength(26);
    expect(new Set(posts.map((post) => post.slug)).size).toBe(26);
    expect(Object.fromEntries(posts.map((post) => [post.slug, post.date]))).toEqual(
      expectedDates,
    );
  });

  test("草稿、必填字段和分类映射有效", async () => {
    const posts = await readPosts();
    const published = posts.filter((post) => !post.draft);
    expect(published).toHaveLength(25);
    expect(posts.filter((post) => post.draft).map((post) => post.slug)).toEqual([
      "使用Tauri开发跨平台应用",
    ]);

    for (const post of published) {
      expect(post.description.trim().length, post.fileName).toBeGreaterThan(0);
      expect(post.categories.length, post.fileName).toBeGreaterThan(0);
    }

    const categoryCounts = Object.fromEntries(
      CATEGORY_KEYS.map((key) => [
        key,
        posts.filter((post) => post.categories.includes(key)).length,
      ]),
    );
    expect(categoryCounts).toEqual({ tech: 8, life: 18, notes: 6, writing: 7 });
  });

  test("除进制转换外的文章封面均存在", async () => {
    const posts = await readPosts();
    expect(posts.filter((post) => !post.cover).map((post) => post.slug)).toEqual([
      "进制转换",
    ]);

    for (const post of posts.filter((item) => item.cover)) {
      const coverPath = join(
        projectRoot,
        "public",
        post.cover!.replace(/^\/+/, ""),
      );
      expect(existsSync(coverPath), `${post.fileName}: ${post.cover}`).toBeTrue();
    }
  });

  test("正文不再包含页面级 H1、无空格标题或旧字体包装", async () => {
    const posts = await readPosts();
    for (const post of posts) {
      expect(post.source).not.toContain("font-family: NSimSun");

      let inFence = false;
      for (const line of post.source.split(/\r?\n/)) {
        if (/^\s*(?:```|~~~)/.test(line)) {
          inFence = !inFence;
          continue;
        }
        if (inFence) continue;
        expect(line, post.fileName).not.toMatch(/^#(?:\s|[^#\s])/);
        expect(line, post.fileName).not.toMatch(/^#{2,6}[^#\s]/);
      }
    }
  });
});
