import { describe, expect, test } from "bun:test";

import {
  getProjectAnchor,
  sortProjects,
  type ProjectEntry,
} from "../src/lib/projects";

function makeProject(title: string, order: number): ProjectEntry {
  return {
    id: `${title}.md`,
    collection: "projects",
    data: {
      title,
      description: `${title} 的简介`,
      order,
      tags: [],
      links: [],
      draft: false,
    },
  } as ProjectEntry;
}

describe("项目内容", () => {
  test("按 order 排序并在相同顺序时使用标题稳定排序", () => {
    const third = makeProject("最后", 2);
    const second = makeProject("乙项目", 1);
    const first = makeProject("甲项目", 1);
    const input = [third, second, first];

    expect(sortProjects(input).map((project) => project.data.title)).toEqual([
      "甲项目",
      "乙项目",
      "最后",
    ]);
    expect(input).toEqual([third, second, first]);
  });

  test("为项目生成可复用的页面锚点", () => {
    expect(getProjectAnchor(makeProject("猫咪 项目", 1))).toBe("project-猫咪-项目");
  });
});
