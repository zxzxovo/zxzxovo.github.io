import { loadPosts, validatePosts } from "./post-lib";

try {
  const posts = await loadPosts();
  const issues = await validatePosts(posts);
  if (issues.length) {
    console.error(`文章检查失败，共 ${issues.length} 个问题：`);
    for (const issue of issues) console.error(`- ${issue.file}: ${issue.message}`);
    process.exit(1);
  }

  const published = posts.filter((post) => post.data.draft === false).length;
  console.log(`文章检查通过：${posts.length} 篇（${published} 篇发布，${posts.length - published} 篇草稿）`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
