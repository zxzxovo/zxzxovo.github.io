export const CATEGORY_KEYS = ["tech", "life", "notes", "writing"] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export interface CategoryMeta {
  key: CategoryKey;
  name: string;
  description: string;
  href: string;
}

export const CATEGORY_META = {
  tech: {
    key: "tech",
    name: "技术",
    description: "编程、工具与学习笔记",
    href: "/categories/tech",
  },
  life: {
    key: "life",
    name: "生活",
    description: "日常、食物与生活片段",
    href: "/categories/life",
  },
  notes: {
    key: "notes",
    name: "随笔",
    description: "关于自我、经验与思考",
    href: "/categories/notes",
  },
  writing: {
    key: "writing",
    name: "文字",
    description: "诗、散文与虚构",
    href: "/categories/writing",
  },
} as const satisfies Record<CategoryKey, CategoryMeta>;
