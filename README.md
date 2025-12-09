# hizhixia.site

My personal website. Built with Vue 3 + Vite + TypeScript.

🔗 [https://hizhixia.site](https://hizhixia.site)

## 开发

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 构建生产版本
bun run build
```

## 脚本命令

### 文章管理

**创建新文章**
```bash
bun run newp "文章标题"
```

自动创建 `src/posts/文章标题/index.md` 文件，包含 Frontmatter 模板：

```toml
+++
date = '2025-12-09'
draft = false
title = '文章标题'
image = "./navigation.jpg"
description = "文章描述"
categories = ["技术"]
tags = ["标签"]
topped = false
+++
```

**生成文章列表**
```bash
bun run gps
```

扫描 `src/posts/` 目录，生成 `public/posts.json` 文件。

### 工具命令

**SEO 分析**
```bash
bun run seo-anal
```

检查 sitemap、robots.txt 和 meta 标签配置。

**Bundle 分析**
```bash
bun run analyze
```

分析构建产物，生成 `dist/stats.html` 可视化报告。

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。
