import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  POSTS_DIR,
  displayPath,
  loadPosts,
  postFilename,
  sanitizeSlug,
  shanghaiTimestamp,
  validateSlug,
} from "./post-lib";
import { CATEGORY_KEYS, type CategoryKey } from "../src/config/categories";
import { isIsoDateTime } from "../src/config/content";

type Options = {
  title?: string;
  slug?: string;
  date?: string;
  categories: CategoryKey[];
};

function usage(message?: string): never {
  if (message) console.error(`错误：${message}\n`);
  console.error('用法：bun run post:new "文章标题" [--slug custom-slug] [--date ISO时间] [--categories tech,life]');
  process.exit(1);
}

function parseArguments(args: string[]): Options {
  const options: Options = { categories: [] };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--slug" || argument === "--date" || argument === "--categories") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) usage(`${argument} 缺少值`);
      index += 1;
      if (argument === "--slug") options.slug = value;
      if (argument === "--date") options.date = value;
      if (argument === "--categories") {
        const categories = value.split(",").map((item) => item.trim()).filter(Boolean);
        const unknown = categories.filter((item) => !CATEGORY_KEYS.includes(item as CategoryKey));
        if (unknown.length) usage(`未知分类：${unknown.join(", ")}`);
        options.categories = [...new Set(categories)] as CategoryKey[];
      }
    } else if (argument.startsWith("--")) {
      usage(`未知选项：${argument}`);
    } else if (!options.title) {
      options.title = argument;
    } else {
      usage("标题必须作为一个带引号的参数传入");
    }
  }
  return options;
}

const options = parseArguments(Bun.argv.slice(2));
if (!options.title?.trim()) usage("文章标题不能为空");

const slug = options.slug?.trim() || sanitizeSlug(options.title);
const slugIssue = validateSlug(slug);
if (slugIssue) usage(slugIssue);

const date = options.date || shanghaiTimestamp();
if (!isIsoDateTime(date)) usage("date 必须是带时区的 ISO 8601 时间");

const posts = await loadPosts();
if (posts.some((post) => String(post.data.slug).toLocaleLowerCase("en-US") === slug.toLocaleLowerCase("en-US"))) {
  usage(`slug 已存在：${slug}`);
}

const destination = join(POSTS_DIR, postFilename(slug));
if (await Bun.file(destination).exists()) usage(`文件已存在：${displayPath(destination)}`);

const yamlArray = (items: readonly string[]) => `[${items.map((item) => JSON.stringify(item)).join(", ")}]`;
const source = `---
title: ${JSON.stringify(options.title.trim())}
slug: ${JSON.stringify(slug)}
date: ${date}
description: ""
categories: ${yamlArray(options.categories)}
tags: []
draft: true
---

<!-- 从这里开始正文；页面已经渲染文章标题，不需要重复一级标题。 -->
`;

await mkdir(POSTS_DIR, { recursive: true });
await writeFile(destination, source, { encoding: "utf8", flag: "wx" });

console.log(`已创建：${displayPath(destination)}`);
console.log(`预览地址：/blog/${encodeURIComponent(slug)}`);
console.log("下一步：填写 description、categories 和正文，确认后再把 draft 改为 false。");
