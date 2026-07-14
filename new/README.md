# 芷夏的博客

一个使用 Astro、Solid.js 与 Tailwind CSS 构建的静态个人博客。

## 开发

需要 Bun 1.3+ 与 Node.js 22.12+。

```bash
bun install --frozen-lockfile
bun run dev
```

常用检查：

```bash
bun run post:check
bun run check
bun run test
bun run build
bun run site:check
bun run preview
```

## 创建文章

```bash
bun run post:new "文章标题"
bun run post:new "文章标题" --slug custom-slug
bun run post:new "文章标题" --categories tech,notes
bun run post:drafts
```

新文章默认是草稿。填写摘要、分类和正文后，将 `draft` 明确改为 `false` 才会发布。

文章位于 `src/content/posts/`，封面位于 `public/images/nav/`。永久地址由 Frontmatter 中的 `slug` 决定；已发布文章不得随意修改它。

分类 key：

- `tech`：技术
- `life`：生活
- `notes`：随笔
- `writing`：文字

## 构建与部署

`bun run build` 会先检查全部文章，再把静态站点输出到 `dist/`。推送到 `main` 后，GitHub Actions 会构建并发布到 GitHub Pages。
