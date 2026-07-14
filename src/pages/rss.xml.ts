import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPostHref, getPublishedPosts } from "../lib/posts";

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();

  return rss({
    title: "芷夏的博客",
    description: "记录编程、生活，以及偶尔闪过的念头。",
    site: context.site ?? "https://hizhixia.site",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: getPostHref(post),
      categories: [...post.data.categories, ...post.data.tags],
    })),
    customData: "<language>zh-CN</language>",
  });
}
