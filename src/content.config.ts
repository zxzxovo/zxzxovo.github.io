import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { CATEGORY_KEYS } from "./config/categories";
import { ISO_DATE_TIME_PATTERN } from "./config/content";

const isoDateTime = z
  .string()
  .regex(ISO_DATE_TIME_PATTERN, "必须使用带时区的 ISO 8601 日期时间")
  .transform((value) => new Date(value));

const slug = z
  .string()
  .trim()
  .min(1, "slug 不能为空")
  .refine((value) => !/[\\/?#]/.test(value), "slug 不能包含路径或查询字符");

const projectLink = z.object({
  label: z.string().trim().min(1, "项目链接名称不能为空"),
  href: z
    .string()
    .trim()
    .min(1, "项目链接地址不能为空")
    .refine(
      (value) => /^(?:https?:\/\/|\/(?!\/)|#)/i.test(value),
      "项目链接必须使用 http(s)、站内绝对路径或页面锚点",
    ),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: ({ image }) => z
    .object({
      title: z.string().trim().min(1),
      slug,
      date: isoDateTime,
      updated: isoDateTime.optional(),
      description: z.string(),
      cover: image().optional(),
      categories: z.array(z.enum(CATEGORY_KEYS)).refine(
        (values) => new Set(values).size === values.length,
        "categories 不能重复",
      ),
      tags: z.array(z.string().trim().min(1)),
      draft: z.boolean(),
    })
    .superRefine((data, context) => {
      if (data.draft) return;

      if (!data.description.trim()) {
        context.addIssue({
          code: "custom",
          path: ["description"],
          message: "已发布文章必须提供摘要",
        });
      }

      if (data.categories.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["categories"],
          message: "已发布文章必须至少属于一个分类",
        });
      }
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    status: z.string().trim().min(1).optional(),
    order: z.number().int().nonnegative().default(0),
    tags: z
      .array(z.string().trim().min(1))
      .default([])
      .refine((values) => new Set(values).size === values.length, "tags 不能重复"),
    icon: z.string().trim().min(1).optional(),
    cover: z
      .object({
        src: z.string().trim().min(1),
        alt: z.string().trim().min(1),
      })
      .optional(),
    links: z.array(projectLink).default([]),
    draft: z.boolean(),
  }),
});

export const collections = { posts, projects };
