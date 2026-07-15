import type { CollectionEntry } from "astro:content";

import type { CategoryKey } from "../config/categories";

export type PostEntry = CollectionEntry<"posts">;

export const PAGE_SIZE = 10;

export interface PostStats {
  count: number;
  characters: number;
}

const postDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function sortPosts(posts: readonly PostEntry[]): PostEntry[] {
  return [...posts].sort((left, right) => {
    const byDate = right.data.date.valueOf() - left.data.date.valueOf();
    return byDate || left.data.slug.localeCompare(right.data.slug, "zh-CN");
  });
}

export async function getPublishedPosts(): Promise<PostEntry[]> {
  const { getCollection } = await import("astro:content");
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return sortPosts(posts);
}

export function countPostCharacters(markdown: string): number {
  const text = markdown
    .replace(/```[^\n]*\n([\s\S]*?)```/gu, "$1")
    .replace(/`([^`]+)`/gu, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/<[^>]+>/gu, " ")
    .replace(/^[#>*+-]+\s*/gmu, " ")
    .replace(/[*_~$]/gu, "")
    .replace(/\s+/gu, "");
  return [...text].length;
}

export function getPostStats(posts: readonly PostEntry[]): PostStats {
  return {
    count: posts.length,
    characters: posts.reduce(
      (total, post) => total + countPostCharacters(post.body ?? ""),
      0,
    ),
  };
}

export function getPostHref(post: PostEntry | string): string {
  const slug = typeof post === "string" ? post : post.data.slug;
  return `/blog/${encodeURIComponent(slug)}`;
}

export function getCategoryHref(key: CategoryKey, page = 1): string {
  const base = `/categories/${key}`;
  return page > 1 ? `${base}/${page}` : base;
}

export function formatPostDate(date: Date): string {
  return postDateFormatter.format(date);
}

export function getAdjacentPosts(
  posts: readonly PostEntry[],
  currentSlug: string,
): { newer?: PostEntry; older?: PostEntry } {
  const orderedPosts = sortPosts(posts);
  const currentIndex = orderedPosts.findIndex(
    (post) => post.data.slug === currentSlug,
  );

  if (currentIndex === -1) return {};

  return {
    newer: orderedPosts[currentIndex - 1],
    older: orderedPosts[currentIndex + 1],
  };
}
