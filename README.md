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

文章位于 `src/content/posts/`，封面位于 `src/assets/images/posts/`。Frontmatter 使用相对路径引用封面，Astro 会在构建时生成 WebP 与响应式尺寸。永久地址由 Frontmatter 中的 `slug` 决定；已发布文章不得随意修改它。

分类 key：

- `tech`：技术
- `life`：生活
- `notes`：随笔
- `writing`：文字

## 添加项目

工具页的项目来自 `src/content/projects/` 中的 Markdown。每个文件使用以下格式：

```yaml
---
title: 项目名称
description: 一句话简介
status: 进行中
order: 1
tags:
  - 示例
icon: mdi:folder-outline
links:
  - label: 查看项目
    href: https://example.com
draft: false
---

这里可以继续使用 Markdown 编写项目介绍。
```

`status`、`icon`、`cover` 和 `links` 可以省略；没有链接时页面会显示“暂无公开入口”。草稿项目不会出现在工具页和全站搜索中。

## 添加友链

友链统一维护在 `src/data/friends.toml`。复制文件内的示例并添加一个 `[[friends]]` 区块：

```toml
[[friends]]
title = "站点名称"
content = "一句简短、准确的站点介绍"
url = "https://example.com/"
avatar = "https://example.com/avatar.png" # 可选
```

`title`、`content`、`url` 必填，`avatar` 可选；站点链接接受完整的 HTTP(S) 地址，头像只接受 HTTPS 地址。构建会拒绝未知字段、重复标题和重复站点地址。访客也可以从友链页面直接编辑这份文件并发起 Pull Request。

## 评论

文章评论使用 Giscus，并在读者滚动到文章底部附近时加载。默认公开配置位于 `src/config/comments.ts`；也可以同时提供 `PUBLIC_GISCUS_REPO`、`PUBLIC_GISCUS_REPO_ID`、`PUBLIC_GISCUS_CATEGORY` 与 `PUBLIC_GISCUS_CATEGORY_ID` 进行完整覆盖。

## 构建与部署

`bun run build` 会先检查全部文章、生成静态站点，再由 Pagefind 为 `dist/` 建立分块搜索索引。推送到 `main` 后，GitHub Actions 会构建并发布到 GitHub Pages。
