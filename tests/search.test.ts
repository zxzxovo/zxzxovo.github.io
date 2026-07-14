import { describe, expect, test } from "bun:test";

import {
  markdownToSearchText,
  searchSiteEntries,
  type SiteSearchEntry,
} from "../src/lib/search";
import { tools } from "../src/data/tool-catalog";

const entries: SiteSearchEntry[] = [
  {
    title: "Rust 标准库的 path",
    description: "记录路径处理与跨平台细节。",
    href: "/blog/rust-path",
    type: "article",
    keywords: ["Rust", "学习"],
    content: "PathBuf 可以安全地组合路径。",
  },
  {
    title: "工具",
    description: "浏览本地运行的小工具。",
    href: "/tools",
    type: "page",
    keywords: ["Rust", "计算"],
  },
  {
    title: "菜谱小记",
    description: "关于做饭与生活的记录。",
    href: "/blog/recipe",
    type: "article",
    keywords: ["厨房", "美食"],
  },
];

describe("site search", () => {
  test("cleans common Markdown syntax for full-text indexing", () => {
    expect(
      markdownToSearchText("## 标题\n\n[路径文档](https://example.com) 与 `PathBuf`。"),
    ).toBe("标题 路径文档 与 PathBuf。");

    expect(markdownToSearchText("```ts\nconst foo_bar = 1;\n```"))
      .toContain("foo_bar");
  });

  test("requires every query token and ranks title matches first", () => {
    const results = searchSiteEntries(entries, "rust 路径");

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Rust 标准库的 path");
  });

  test("searches descriptions and returns an empty list for blank queries", () => {
    expect(searchSiteEntries(entries, "做饭")[0].title).toBe("菜谱小记");
    expect(searchSiteEntries(entries, "Rust，路径")[0].title).toBe(
      "Rust 标准库的 path",
    );
    expect(searchSiteEntries(entries, "   ")).toEqual([]);
  });

  test("indexes the detailed vocabulary of interactive tools", () => {
    const toolEntries: SiteSearchEntry[] = tools.map((tool) => ({
      title: tool.title,
      description: tool.description,
      href: tool.href,
      type: "tool",
      keywords: [tool.badge, ...tool.keywords],
    }));

    expect(searchSiteEntries(toolEntries, "住房公积金")[0].title).toBe(
      "社保缴费计算器",
    );
  });
});
