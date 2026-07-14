import { loadPosts, postTitle, validatePosts } from "./post-lib";

const posts = await loadPosts();
const issues = await validatePosts(posts);
if (issues.length) {
  console.error("文章数据存在问题，请先运行 bun run post:check。");
  process.exit(1);
}

const drafts = posts
  .filter((post) => post.data.draft === true)
  .sort((left, right) => new Date(String(right.data.date)).valueOf() - new Date(String(left.data.date)).valueOf());

if (!drafts.length) {
  console.log("当前没有草稿。");
} else {
  console.log(`草稿 ${drafts.length} 篇：`);
  for (const draft of drafts) {
    const date = new Date(String(draft.data.date)).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" });
    console.log(`- ${date}  ${postTitle(draft)}  /blog/${encodeURIComponent(String(draft.data.slug))}  (${draft.file})`);
  }
}
