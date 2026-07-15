---
title: "通过迁移博客学习 Astro（AI 生成）"
slug: "通过迁移博客学习Astro"
date: "2026-07-15T07:55:22+08:00"
description: "以这次博客重写为主线，介绍 Astro 的项目结构、内容集合、文件路由、静态生成、Solid Islands、Markdown 渲染与部署。"
cover: /images/posts/astro-migration.webp
categories: ["tech"]
tags: ["Astro", "Solid.js", "Tailwind CSS", "Bun", "Vite", "博客", "静态站点", "学习"]
draft: false
---

> 本文由 AI 根据本站的实际源码生成，标题中已显式标注。代码和目录均以文章发布时的项目为准。

## Intro

重写这个博客时，我一开始只想做一件很普通的事：把旧站里的文章搬出来，换一个更简单的框架，再把已经不喜欢的界面全部丢掉。

可真正开始迁移后，事情很快变成了一次完整的 Astro 练习。文章要从 Markdown 中读取，要有固定链接、分类和分页；页面要尽量静态，但主题切换、搜索、筛选、评论和几个小工具又必须运行 JavaScript；数学公式要在构建时处理，旧文章里的 Canvas 动画也不能因为页面切换而失效。最后还要检查链接、生成 RSS、部署到 GitHub Pages。

这篇文章不准备把 Astro 的 API 按文档顺序抄一遍，而是沿着这次迁移真正做过的事情，解释现在这个博客为什么长成这样。

如果你会 HTML、CSS、JavaScript，知道 Bun、Vite 和组件化的大概含义，那么读完后应该能：

- 看懂当前项目里各个目录和主要文件的职责。
- 理解 Astro 组件、布局、文件路由、内容集合和静态生成。
- 知道什么时候只写 `.astro`，什么时候写浏览器脚本，什么时候才需要 Solid.js Island。
- 自己实现文章详情、分页、分类、搜索、评论、RSS 和 GitHub Pages 部署。
- 知道同一个需求还有哪些替代做法，以及当前实现为什么没有选它们。

## 先把 Astro 理解成一条构建流水线

传统的纯前端网站通常是浏览器取得 HTML，再由 JavaScript 请求数据、创建组件并修改页面。这个博客更像相反的方向：

```text
Markdown / TOML / TypeScript 数据
                │
                ▼
       Astro 在构建阶段读取、校验
                │
                ▼
   页面 + 布局 + 组件组合成完整 HTML
                │
                ├── 大部分内容：直接成为静态 HTML
                │
                └── 少量交互：附带独立的 JS Island
                ▼
             dist/
```

文章、分类和页面在部署前就已经变成 HTML。访问者不需要等浏览器请求文章接口，也不需要下载一个完整的 SPA 才能看到正文。只有主题按钮、搜索、工具和评论等确实需要交互的部分才会收到 JavaScript。

这也是 Astro 最重要的心智模型：

> 默认输出 HTML；需要交互时，再明确地添加 JavaScript。

当前项目没有配置 adapter，也没有把 `output` 改成 `server`，所以使用 Astro 默认的静态输出。若网站需要登录状态、按用户生成页面或实时读取数据库，可以安装 Node、Cloudflare、Netlify、Vercel 等 adapter，并对某个页面使用 `export const prerender = false`，也可以把整个项目改成 `output: "server"`。博客内容更新频率不高，GitHub Pages 也只负责静态托管，因此没有必要引入常驻服务器。

相关文档：

- [Astro 项目结构](https://docs.astro.build/en/basics/project-structure/)
- [Astro 按需渲染与 adapter](https://docs.astro.build/en/guides/on-demand-rendering/)

## 项目地图

先忽略文章图片和具体文章文件，当前项目可以压缩成下面这棵树：

```text
.
├─ public/                   # 原样复制到网站根目录的静态文件
├─ scripts/                  # Bun 文章工具、构建产物检查、封面生成脚本
├─ src/
│  ├─ components/           # Astro 静态组件与 Solid 交互组件
│  ├─ config/               # 分类、日期、评论等稳定配置
│  ├─ content/
│  │  ├─ posts/             # 博客 Markdown
│  │  └─ projects/          # 工具页中的项目 Markdown
│  ├─ data/                 # Emoji、工具目录、友链 TOML
│  ├─ layouts/              # 完整 HTML 外壳
│  ├─ lib/                  # 查询、排序、URL、搜索等纯逻辑
│  ├─ pages/                # 文件路由
│  ├─ scripts/              # 真正发送到浏览器的文章动画
│  ├─ styles/               # 全站 CSS
│  └─ content.config.ts     # 内容集合入口与 Schema
├─ tests/                    # Bun 单元测试与迁移基线
├─ astro.config.mjs         # Astro、Markdown、集成与 Vite 配置
├─ package.json             # 依赖和 bun run 命令
└─ tsconfig.json            # Astro/Solid 的 TypeScript 配置
```

Astro 真正强制保留的目录主要是 `src/pages/`。像 `components/`、`layouts/`、`lib/` 都是社区惯例，可以按项目规模重新组织。我把内容、配置、纯逻辑和 UI 分开，是为了让页面文件只负责“拿数据并组合组件”，而不是在每个页面里重新实现排序、日期和地址。

## 从一个 Astro 组件开始

一个 `.astro` 文件通常分成两部分：

```astro
---
interface Props {
  title: string;
}

const { title } = Astro.props;
const message = title.toUpperCase();
---

<section>
  <h2>{message}</h2>
  <slot />
</section>
```

两个 `---` 之间叫 Component Script，也常被叫作 frontmatter。这里可以：

- 导入组件和数据。
- 使用 TypeScript。
- 读取 `Astro.props`、`Astro.params`、`Astro.url`。
- 在构建阶段执行 `await`、查询内容集合或调用接口。
- 准备模板需要的变量。

下面是 Component Template。它接近 HTML，但允许使用 `{expression}`、`.map()`、条件渲染、`class:list` 和导入的组件。这里没有 React 必须使用单一根节点的限制。

最关键的是：上半部分的代码默认不会作为浏览器 JavaScript 发出去。它在本项目的生产构建中执行，然后只留下模板生成的 HTML。这和 Vue 或 React 的单文件组件很像，但运行边界完全不同。

`<slot />` 是留给子内容的位置。当前 `src/layouts/App.astro` 就用它把每个页面的主体放到 Header 与 Footer 中间：

```astro
<body>
  <div class="flex min-h-dvh flex-col">
    <Header underlined={underlined} />
    <main class="flex-1">
      <slot />
    </main>
    <Footer />
  </div>
</body>
```

页面只需这样使用：

```astro
<App title="关于" underlined="/about">
  <h1>你好，我是芷夏。</h1>
</App>
```

如果只想复用完全静态的旧 HTML，Astro 也支持 HTML Component；如果需要多个插入位置，可以使用 named slot；如果内容本身需要浏览器状态，再换成 Solid、React、Vue 或 Svelte 组件。

相关文档：[Astro Components](https://docs.astro.build/en/basics/astro-components/)

## 内容集合：先把文章变成可靠的数据

### 为什么不直接把 Markdown 放进 pages

Astro 可以直接把 `src/pages/hello.md` 变成页面，这很适合零散的静态文档。但博客文章有统一的字段、列表、分类和详情模板，因此使用 Content Collections 更合适。

内容集合做了三件事：

1. 指定内容从哪里加载。
2. 使用 Schema 校验每篇内容的结构。
3. 为查询结果生成 TypeScript 类型。

本项目的入口是 `src/content.config.ts`。文章集合的核心可以简化成：

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/posts",
  }),
  schema: z.object({
    title: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    date: z.string().transform((value) => new Date(value)),
    description: z.string(),
    cover: z.string().optional(),
    categories: z.array(z.enum(["tech", "life", "notes", "writing"])),
    tags: z.array(z.string()),
    draft: z.boolean(),
  }),
});

export const collections = { posts };
```

实际 Schema 还检查了：

- 时间必须是带时区的 ISO 8601 完整时间。
- `slug` 不能包含路径、查询或片段字符。
- 分类不能重复。
- 发布文章必须填写摘要并至少属于一个分类。
- 项目链接只能是 HTTP(S)、站内绝对路径或锚点。

于是 Markdown 顶部不再是一团“大家约定好就算了”的 YAML，而是构建能够验证的数据：

```yaml
---
title: "通过迁移博客学习 Astro（AI 生成）"
slug: "通过迁移博客学习Astro"
date: "2026-07-15T07:55:22+08:00"
description: "以博客重写为主线学习 Astro。"
cover: /images/posts/astro-migration.webp
categories: ["tech"]
tags: ["Astro", "Bun"]
draft: false
---
```

`date` 在 Schema 中被转换成 `Date`，所以页面拿到的 `post.data.date` 已经可以直接排序、格式化或输出 `toISOString()`。

`glob()` 还会根据文件名生成 entry `id`，并允许用内容里的 `slug` 改写它。本站仍然把显式的 `post.data.slug` 当作永久地址来源，因为文件名可以整理，公开 URL 不应该跟着变化。如果你的文件名本身就是稳定地址，直接使用 `post.id` 也可以少维护一个字段。

### 两个集合，两种内容

现在有两个集合：

- `posts`：博客文章，正文由详情页渲染。
- `projects`：工具页底部的小项目，同样使用 Markdown，但拥有 `status`、`order`、`icon`、`links` 等字段。

这说明 Content Collections 并不只适合博客。只要一组数据“结构相同并且需要被查询”，它就可以成为集合。数据也不必来自 Markdown；`glob()` 可以加载本地文件，还可以换成自定义 loader、CMS 或远程数据源。若内容必须在请求时保持最新，Astro 也提供 Live Collections，不过静态博客没有这个必要。

相关文档：[Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)

## 查询层：不要让组件自己拼地址

内容集合解决了读取和校验，但如果每个页面都自己排序文章、过滤草稿和拼接 URL，代码还是会逐渐失控。

`src/lib/posts.ts` 把这些规则集中起来：

```ts
export async function getPublishedPosts() {
  const { getCollection } = await import("astro:content");
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return sortPosts(posts);
}

export function getPostHref(post: PostEntry | string) {
  const slug = typeof post === "string" ? post : post.data.slug;
  return `/blog/${encodeURIComponent(slug)}`;
}
```

这里统一处理：

- 过滤草稿。
- 按完整发布时间倒序，并在时间相同时稳定排序。
- 生成文章和分类地址。
- 按上海时区格式化日期。
- 查找上一篇和下一篇。
- 定义每页十篇的 `PAGE_SIZE`。

`src/lib/projects.ts` 做项目排序和锚点生成；`src/lib/search.ts` 做搜索文本归一化、Markdown 清理和权重排序；`src/lib/friends.ts` 解析并校验 TOML。

这些函数多数是纯函数，因此不依赖 DOM，也很容易用 Bun 测试。页面负责“展示什么”，`lib/` 负责“规则是什么”。

当然也可以直接在页面 frontmatter 中调用 `getCollection()`。小项目这么写没有问题；当同一规则出现第二次时，再提取到 `lib/` 往往更清楚。

## 文件路由：目录就是 URL

Astro 不需要单独维护一张路由表。放在 `src/pages/` 中的文件会根据路径生成 URL：

| 文件 | 生成的地址 |
|---|---|
| `src/pages/index.astro` | `/` |
| `src/pages/about.astro` | `/about` |
| `src/pages/tools/index.astro` | `/tools` |
| `src/pages/rss.xml.ts` | `/rss.xml` |
| `src/pages/blog/[slug].astro` | `/blog/:slug` |

### 用 getStaticPaths 生成每篇文章

`[slug].astro` 是动态路由文件，但“动态”不代表一定要有服务器。在静态模式下，它通过 `getStaticPaths()` 提前告诉 Astro 要生成哪些页面：

```astro
---
export async function getStaticPaths() {
  const posts = await getPublishedPosts();

  return posts.map((post) => ({
    params: { slug: post.data.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
---
```

`params` 决定 URL，`props` 把完整文章对象交给页面模板。构建时，有多少篇公开文章，就生成多少个详情页；草稿没有进入查询，自然也不会得到公开地址。

Astro 6 之后，`params` 的值必须是字符串或 rest parameter 使用的 `undefined`，不能再直接传数字；分页器会替我们处理页码转换。

另一种写法是在页面中读取 `Astro.params.slug` 后再调用 `getEntry()`。对于静态生成，直接在 `getStaticPaths()` 中把 entry 作为 props 传入可以少做一次查找。若页面是 SSR，则通常从 `Astro.params` 读取参数并按请求查询数据。

### 用 paginate 生成博客与分类分页

`src/pages/blog/[...page].astro` 中的 rest parameter 让第一页不带页码：

```astro
---
export const getStaticPaths: GetStaticPaths = async ({ paginate }) => {
  const posts = await getPublishedPosts();
  return paginate(posts, { pageSize: 10 });
};

const { page } = Astro.props;
---
```

`[...page].astro` 会得到 `/blog`、`/blog/2`、`/blog/3`；如果文件叫 `[page].astro`，第一页通常会是 `/blog/1`。

`page` 不只有当前十篇数据，还包含：

- `page.currentPage` 与 `page.lastPage`
- `page.total`
- `page.url.prev` 与 `page.url.next`
- `page.data`

分类详情页 `src/pages/categories/[category]/[...page].astro` 是同一种机制，只是先按分类过滤，再为四个分类分别调用 `paginate()`。

相关文档：[Astro Routing Reference](https://docs.astro.build/en/reference/routing-reference/)

### 页面也可以返回 Response

`robots.txt.ts` 和 `rss.xml.ts` 是 endpoint。它们不渲染 HTML，而是导出 `GET`：

```ts
export const GET: APIRoute = ({ site }) => {
  return new Response("User-agent: *\nAllow: /\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
```

`rss.xml.ts` 则使用 `@astrojs/rss` 把公开文章转换成 RSS。静态模式下，这些 endpoint 也会在构建阶段生成普通文件。

## 渲染 Markdown：正文、标题与目录

详情页拿到 entry 后，还要把 Markdown 变成组件：

```astro
---
import { render } from "astro:content";

const { Content, headings } = await render(post);
const tocHeadings = headings.filter(
  (heading) => heading.depth === 2 || heading.depth === 3,
);
---

<article class="article-prose">
  <Content />
</article>
```

`render(post)` 返回的 `Content` 可以像 Astro 组件一样渲染，`headings` 则包含标题文本、层级和 slug。本站只收集 H2/H3，并且至少有三个标题才显示目录。

`TableOfContents.astro` 同时输出：

- 移动端的 `<details>` 折叠目录。
- 桌面端的 sticky 侧栏目录。
- 一段浏览器脚本，根据滚动位置设置当前标题。

Markdown 的处理管线在 `astro.config.mjs`：

```js
markdown: {
  processor: unified({
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  }),
  shikiConfig: {
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    wrap: true,
  },
}
```

`remark-math` 识别 Markdown 中的数学语法，`rehype-katex` 在构建时生成公式 HTML，Shiki 在构建时完成代码高亮。浏览器不需要再下载 MathJax 才能显示公式。

这里还有一个 Astro 7 的版本细节：Astro 7 默认使用原生的 Sätteri Markdown 处理器；本项目因为继续使用 remark/rehype 插件，显式安装了 `@astrojs/markdown-remark` 并切换到 `unified()`。如果不依赖这套插件生态，可以删除这项额外依赖并留在默认处理器；也可以把插件迁移成 Sätteri 的 MDAST/HAST 插件。

替代方式包括：

- 使用 MDX，在正文里直接导入组件。
- 使用 remark/rehype 插件自动生成目录、外链属性或阅读时间。
- 在客户端加载 MathJax，适合公式内容运行时才出现的页面。
- 完全不用 Content Collections，把 Markdown 直接放进 `pages/` 并指定 layout。

## 布局、组件和样式如何分工

### App.astro 是全站外壳

`src/layouts/App.astro` 负责每个页面共同拥有的内容：

- 完整的 `html`、`head`、`body`。
- Header、Footer 与主体 `slot`。
- 标题、摘要、canonical、Open Graph、Twitter Card。
- 文章发布时间、标签和 JSON-LD。
- favicon、manifest、RSS。
- 主题初始化和 `ClientRouter`。

所以页面不用重复写 SEO 标签，也不会忘记全站样式。

### 静态 Astro 组件

下面这些组件全部优先输出静态 HTML：

- `Header.astro`：品牌、导航、搜索入口和移动端横向导航。
- `Footer.astro`：引语、版权与 GitHub。
- `BlogCard.astro`：统一文章卡片和无封面 fallback。
- `BlogInfoBar.astro`：日期和分类。
- `TagSmall.astro`：标签列表。
- `Pagination.astro`：语义化上一页、下一页和禁用状态。
- `ToolPageHeader.astro`：三个工具详情页共用的标题。
- `ProjectCard.astro`：把项目集合 entry 与 Markdown slot 组合成项目卡片。

这些组件需要的数据通过 props 传入，不需要浏览器状态，因此没有理由把它们做成前端框架组件。

### Tailwind 与 global.css

Tailwind 4 通过 `@tailwindcss/vite` 接入 Vite，在 `global.css` 中使用：

```css
@import "tailwindcss";
@import "katex/dist/katex.min.css";
@plugin "@tailwindcss/typography";
```

页面和组件主要使用 Utility Class，`global.css` 则保存真正全局的规则：

- zinc 与 orange 设计变量。
- 深浅主题。
- 系统字体与选中文本。
- 键盘 focus。
- 文章 `prose` 的代码、表格、引用、链接和公式样式。
- `prefers-reduced-motion`。

`404.astro` 还展示了另一种方式：直接在组件底部写 `<style>`。Astro 默认会限定组件样式的作用范围，适合只属于一个组件的 CSS。全局设计变量放 `global.css`，局部特例放组件样式，两种方式并不冲突。

## Islands：只给需要交互的地方发送 JavaScript

Astro 组件默认不在浏览器中运行。若导入一个 Solid 组件但不写 client directive，它只会被渲染成 HTML，不会被 hydrate。

当前项目在 `astro.config.mjs` 中启用了 `@astrojs/solid-js`，然后像这样创建 Island：

```astro
---
import ThemeToggle from "../components/ThemeToggle";
---

<ThemeToggle client:load />
```

`client:load` 表示页面加载时立即发送并 hydrate 这个组件，适合立刻可见、必须马上响应的主题按钮和搜索框。

三个工具使用 `client:visible`：

```astro
<EmojiExplorer client:visible />
```

只有组件接近视口时才 hydrate，避免访问工具页时立刻执行不在屏幕中的交互代码。

常见选择还有：

- `client:idle`：浏览器空闲时加载，适合低优先级交互。
- `client:media="(max-width: 50em)"`：媒体查询匹配时加载。
- `client:only="solid-js"`：跳过服务端 HTML，只在客户端渲染。首屏会失去预渲染内容，应谨慎使用。

框架也不是固定的。把 Solid integration 换成 React、Vue、Svelte 或 Preact 后，Astro 的页面、路由和内容集合仍然可以保留。

相关文档：

- [Astro Islands](https://docs.astro.build/en/concepts/islands/)
- [Client Directives](https://docs.astro.build/en/reference/directives-reference/)
- [Solid integration](https://docs.astro.build/en/guides/integrations-guide/solid-js/)

### 为什么有些交互不用 Solid

`BlogArchive.astro` 的筛选和 `TableOfContents.astro` 的滚动状态都使用普通 `<script>`。它们只是给已有 DOM 添加少量行为，不需要复杂状态树：

- BlogArchive 使用 Custom Element 封装生命周期。
- 分类和标签写入 URLSearchParams。
- `popstate` 恢复浏览器前进后退状态。
- `AbortController` 在组件离开页面时清理监听器。
- 目录脚本用 `requestAnimationFrame` 合并滚动更新。

会 JavaScript 并不意味着所有交互都要换成框架。简单的 DOM 增强直接写浏览器脚本，代码通常更少。

## ClientRouter 带来的第二套生命周期

`App.astro` 在 `head` 中加入了 `<ClientRouter />`。它会拦截站内链接，取得下一个页面并替换 DOM，让传统多页面站点拥有平滑的客户端导航。

但它也带来一个很容易忽略的问题：页面切换不再等于浏览器刷新。

例如目录、旧文章动画和主题同步都必须考虑以下事件：

- `astro:before-swap`：新旧 DOM 交换前。
- `astro:after-swap`：DOM 已交换，但页面生命周期还没完全结束。
- `astro:page-load`：首次进入和每次客户端导航完成后都会触发。

本站在交换前给新文档加上正确主题，避免闪一下白色；目录与文章动画在 `astro:page-load` 中重新初始化，在离开时取消监听和 animation frame。

如果不需要 SPA 式导航，可以直接删除 `ClientRouter`。网站会恢复普通链接跳转，很多脚本只需监听 `DOMContentLoaded`，整体也完全可用。这是更简单的替代方案。

相关文档：[Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/)

## 评论为什么是一个懒加载 Island

文章底部的 `GiscusComments.tsx` 是 Solid Island。详情页使用 `client:load` 让这个很小的外壳先建立生命周期，但真正的 Giscus 组件又通过两层延迟加载：

1. `IntersectionObserver` 观察评论区域，读者接近文章底部时才继续。
2. `lazy(() => import("@giscus/solid"))` 到那时才下载 Giscus 组件。

组件还监听根元素的 `class`，把本站深浅主题同步成 Giscus 的 `light` 或 `dark_dimmed`。卸载时断开 Observer，避免返回文章后出现重复监听。

评论对应关系使用固定 term：

```ts
export function getGiscusTerm(slug: string) {
  return `blog/${encodeURIComponent(slug)}`;
}
```

这样标题以后改变，评论仍由永久 slug 定位。

更简单的 Astro 写法是 `<GiscusComments client:visible={{ rootMargin: "600px" }} />`，让 client directive 自己使用 IntersectionObserver。当前实现希望先稳定输出评论区占位、再精确观察实际 section，因此把延迟逻辑放进了组件内部。也可以直接在 Markdown 后插入 Giscus 官方脚本，代码会更短；但主题同步、ClientRouter 重入和按实际区域懒加载会更难管理。若需要匿名评论、站内账号或审核后台，就要换成自己的服务端评论系统。

[Giscus 官方站点](https://giscus.app/zh-CN)

## 全站搜索：在构建时准备数据，在浏览器里查询

`src/pages/search.astro` 在构建时读取：

- 全部公开文章的标题、摘要、标签和正文。
- 首页、分类、友链、关于等静态页面摘要。
- 三个工具的元信息。
- 项目集合。

这些内容被整理成 `SiteSearchEntry[]`，再作为 props 传给：

```astro
<SearchExplorer entries={entries} client:load />
```

Solid 组件在浏览器里维护输入框状态，`searchSiteEntries()` 对查询分词后要求所有词都出现，并让标题、关键词、摘要、正文拥有不同权重。URL 中的 `?q=` 会同步输入，刷新和浏览器前进后退都能恢复查询。

优点是实现透明、无需服务器、开发环境马上可用；缺点是完整索引会进入搜索页面 HTML。文章继续增长后，可以改用 Pagefind：它在 Astro 构建完成后扫描 `dist/`，生成分块静态索引，浏览器按查询加载需要的部分。也可以使用远程搜索服务，或者在 SSR 页面中查询数据库。

[Pagefind 文档](https://pagefind.app/docs/)

## TOML 友链和 Markdown 项目说明了什么

并不是所有内容都应该写死在页面组件里。

友链保存在 `src/data/friends.toml`。Vite 的 `?raw` 导入把它作为字符串读取：

```ts
import source from "./friends.toml?raw";
import { parseFriendsDocument } from "../lib/friends";

export const friends = parseFriendsDocument(source);
```

`smol-toml` 负责解析，Zod 检查必填字段、未知字段、URL 协议和重复项。朋友只需在 GitHub 编辑一小段 TOML 并提交 PR，不必碰 Astro 组件。

如果使用 JSON，可以直接 import，少一个解析依赖；如果希望编辑器内容更丰富，可以把友链也定义成 Content Collection；如果有管理后台，则可以从 CMS 或数据库加载。当前 TOML 的目标不是炫技，而是让提交友链这件事足够简单。

项目则放在 `src/content/projects/`。工具页调用 `render(project)`，再把 `<Content />` 传进 `ProjectCard` 的 slot。它展示了同一套 Content Collections API 如何同时服务于文章和小型项目目录。

## 静态资源、图片与封面

`public/` 中的文件不会经过 Astro 构建处理，而是原样复制到 `dist/`：

- `CNAME` 绑定自定义域名。
- `ads.txt` 保存广告平台声明。
- favicon、Apple Touch Icon、PWA icon 与 manifest。
- `images/identity/` 保存站点头像。
- `images/nav/` 保存历史文章封面。
- `images/posts/` 保存新文章封面。

因此 Markdown 中可以直接写：

```yaml
cover: /images/posts/astro-migration.webp
```

这种做法对迁移最直接，旧文章路径也不会变化；但 Astro 不会自动为 `public` 图片生成响应式尺寸。

另一种用法是把图片放进 `src/assets/`，在 `.astro` 组件中通过 `astro:assets` 的 `<Image />` 或 `<Picture />` 导入。Astro 可以生成尺寸、优化格式和响应式 `srcset`。普通 Markdown 里不能直接使用这两个组件，但可以用相对路径引用 `src/` 下的本地图片并交给 Astro 处理；需要更细控制时可以换成 MDX。如果以后要系统优化封面，这会比继续向 `public` 放原图更合适。

[Astro Image API](https://docs.astro.build/en/reference/modules/astro-assets/)

## SEO 与构建产物

虽然是静态站点，构建阶段仍可以生成完整元数据：

- `App.astro` 根据 props 输出 title、description、canonical、Open Graph 和 Twitter Card。
- 文章详情页生成 `BlogPosting` JSON-LD。
- 首页生成 `WebSite` 与 `Person` JSON-LD。
- `@astrojs/sitemap` 根据静态路由生成 sitemap，并过滤 404、搜索和旧重定向路径。
- `rss.xml.ts` 生成 RSS。
- `robots.txt.ts` 指向 sitemap。
- `404.astro` 生成静态 404。
- `f-link.astro` 和 `astro.config.mjs` 中的 redirects 保留旧地址兼容。

`site: "https://hizhixia.site"` 很重要。Astro 需要它来生成绝对 canonical、RSS 与 sitemap 地址。

## 文章脚本、测试和部署

### 根目录的 Bun 脚本

`package.json` 提供这些命令：

```text
bun run dev
bun run check
bun test
bun run build
bun run site:check

bun run post:new "文章标题"
bun run post:check
bun run post:drafts
```

`scripts/post-lib.ts` 是文章工具的公共层，处理 YAML、slug、上海时区、分类和封面路径。

`post-new.ts` 创建默认草稿，禁止覆盖同名文章；`post-check.ts` 在构建前检查所有文章；`post-drafts.ts` 列出尚未发布的内容。模板不生成正文 H1，因为详情页已经负责页面唯一的 H1。

`site-check.ts` 遍历 `dist/` 的 HTML，收集本地 `href` 与 `src`，确认它们能够解析到构建产物。它不能替代浏览器端 E2E 测试，但可以很便宜地阻止明显死链。

`generate-astro-migration-cover.ts` 则是本文封面的可复现生成脚本：固定随机种子，生成 SVG 场景，再通过 Sharp 输出 WebP。

### 测试覆盖规则，而不是像素

`tests/posts.test.ts` 检查排序、URL、时间、迁移基线、草稿、分类和封面；其余测试分别覆盖搜索、项目与友链解析。

组件样式主要通过构建和浏览器验收确认。若项目继续扩大，可以加入 Playwright，自动检查主题切换、搜索、分页、评论懒加载和三档响应式布局。

### GitHub Pages

`.github/workflows/deploy.yml` 的流程是：

```text
checkout
  → 安装 Bun
  → bun install --frozen-lockfile
  → bun run check
  → bun test
  → bun run build
  → bun run site:check
  → 上传 dist
  → deploy-pages
```

只有 `main` 分支触发部署。由于产物完全静态，GitHub Pages 不需要 Node 进程，也不需要数据库。

## 文件索引：遇到问题时该去哪里找

下面按目录列出当前源码。文章正文和图片数量会继续增长，所以同类文件合并说明。

### 根目录与 public

| 文件 | 职责 |
|---|---|
| `package.json` | 依赖、Bun 命令和 Node 版本要求。 |
| `bun.lock` | 锁定准确依赖版本，CI 使用 frozen lockfile。 |
| `astro.config.mjs` | integrations、Markdown、Shiki、redirect、sitemap、prefetch 与 Vite。 |
| `tsconfig.json` | Astro strict TypeScript，以及 Solid JSX 配置。 |
| `README.md` | 本地开发、文章、项目、友链和评论的维护说明。 |
| `public/CNAME` | GitHub Pages 自定义域名。 |
| `public/ads.txt` | 广告声明。 |
| `public/site.webmanifest` | PWA 名称、颜色和 icon。 |
| `public/favicon.*`、`apple-touch-icon.png`、`icons/` | 浏览器与设备图标。 |
| `public/images/identity/` | Header Logo 与 About 头像。 |
| `public/images/nav/`、`images/posts/` | 历史与新文章封面。 |

### 内容、配置、数据与逻辑

| 文件 | 职责 |
|---|---|
| `src/content.config.ts` | 定义 posts/projects 集合和 Zod Schema。 |
| `src/content/posts/*.md` | 文章 Frontmatter 与正文。 |
| `src/content/projects/*.md` | 工具页项目数据与介绍。 |
| `src/config/categories.ts` | 分类 key、中文名称、说明与地址。 |
| `src/config/content.ts` | ISO 时间格式的共享规则。 |
| `src/config/comments.ts` | Giscus 公共配置、环境变量覆盖和固定 term。 |
| `src/data/tool-catalog.ts` | 工具标题、说明、icon、地址和搜索关键词。 |
| `src/data/emojis.ts` | Emoji Explorer 的静态数据。 |
| `src/data/friends.toml` | 访客可通过 PR 修改的友链内容。 |
| `src/data/friends.ts` | 使用 Vite raw import 读取 TOML。 |
| `src/lib/posts.ts` | 文章查询、排序、日期、URL 和相邻文章。 |
| `src/lib/projects.ts` | 项目查询、排序和锚点。 |
| `src/lib/friends.ts` | TOML 解析与安全校验。 |
| `src/lib/search.ts` | 搜索归一化、Markdown 清理、匹配和排序。 |

### 布局与组件

| 文件 | 职责 |
|---|---|
| `src/layouts/App.astro` | 全站 HTML、SEO、主题、ClientRouter、Header、Footer。 |
| `Header.astro` / `Footer.astro` | 全站导航与页脚。 |
| `BlogCard.astro` / `BlogInfoBar.astro` / `TagSmall.astro` | 文章列表的静态展示。 |
| `Pagination.astro` | 博客与分类分页。 |
| `BlogArchive.astro` | 全文章卡片、分类/标签筛选和 URL 状态。 |
| `TableOfContents.astro` | H2/H3 目录和滚动高亮。 |
| `ThemeToggle.tsx` | Solid 主题 Island。 |
| `SearchExplorer.tsx` | Solid 搜索 Island。 |
| `comments/GiscusComments.tsx` | 评论懒加载、主题同步和清理。 |
| `projects/ProjectCard.astro` | 项目元数据与 Markdown slot。 |
| `tools/ToolPageHeader.astro` | 工具详情共用标题。 |
| `tools/EmojiExplorer.tsx` | Emoji 搜索与复制。 |
| `tools/SocialInsuranceCalculator.tsx` | 本地参数社保估算。 |
| `tools/XLottery.tsx` | 本地候选名单与可复现随机抽取。 |

### 路由

| 文件 | 职责 |
|---|---|
| `pages/index.astro` | 首页、最新文章与分类计数。 |
| `pages/blog/[...page].astro` | 博客静态分页。 |
| `pages/blog/[slug].astro` | 详情、目录、SEO、相邻文章与评论。 |
| `pages/categories/index.astro` | 分类总览。 |
| `pages/categories/[category]/[...page].astro` | 分类静态分页。 |
| `pages/search.astro` | 构建搜索数据并挂载搜索 Island。 |
| `pages/tools/index.astro` | 工具目录和 Markdown 项目。 |
| `pages/tools/*.astro` | 三个工具详情与 Island 挂载点。 |
| `pages/about.astro` / `friends.astro` | 关于与 TOML 友链。 |
| `pages/404.astro` | 静态 404。 |
| `pages/f-link.astro` | 旧友链地址的兼容跳转。 |
| `pages/rss.xml.ts` / `robots.txt.ts` | 静态 endpoint。 |

### 浏览器脚本、工具、测试和 CI

| 文件 | 职责 |
|---|---|
| `src/scripts/article-widgets.ts` | 生日蛋糕和烟花 Web Components，负责连接与销毁。 |
| `src/styles/global.css` | 设计变量、Tailwind、Typography、KaTeX、正文与无障碍。 |
| `scripts/post-*.ts` | 新建、检查和列出文章。 |
| `scripts/site-check.ts` | 检查构建产物中的站内链接。 |
| `scripts/generate-astro-migration-cover.ts` | 本文封面的确定性生成脚本。 |
| `tests/*.test.ts` | 文章、搜索、项目和友链规则。 |
| `.github/workflows/deploy.yml` | 检查、构建并发布到 GitHub Pages。 |

## 如果从零实现同样的博客

可以按下面的顺序练习，不必一次把所有功能写完：

1. 创建 Astro 项目，只写 `index.astro` 和一个 `App.astro`。
2. 定义 posts 内容集合，先显示一篇 Markdown。
3. 用 `[slug].astro` 与 `getStaticPaths()` 生成详情。
4. 提取 `getPublishedPosts()`、`getPostHref()` 与 `BlogCard`。
5. 用 `[...page].astro` 和 `paginate()` 加入分页。
6. 增加分类配置和分类动态路由。
7. 在 `render(entry)` 的 `headings` 上生成目录。
8. 先用普通脚本实现主题或筛选，再尝试一个 Solid Island。
9. 配置 remark/rehype、RSS、sitemap 和 SEO。
10. 最后补测试、文章脚本与部署工作流。

这样每一步都能得到一个可以打开的静态网站。Astro 并没有要求你先接受一整套复杂的全栈方案；它允许你从 HTML 开始，只在真正遇到问题时再增加内容集合、动态路由或 Island。

## End

迁移完成后回头看，这个博客最重要的结构其实很简单：

- 内容放在 Markdown 或 TOML。
- Schema 在构建时阻止错误数据。
- `lib/` 保存稳定规则。
- `pages/` 决定 URL 并组合页面。
- `layouts/` 和 `components/` 负责 HTML。
- Solid 和普通脚本只增强需要交互的区域。
- GitHub Actions 把检查过的 `dist/` 发布出去。

Astro 的用法很多，但它的核心并不是“又学会了一个前端框架”，而是重新划清了构建阶段与浏览器阶段的边界。

能在构建时完成的，就不要留给访问者的浏览器；能用 HTML 完成的，就不要先发送 JavaScript。对于一个以文章为主、偶尔带点小工具的博客，这个思路刚刚好。
