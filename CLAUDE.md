# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A static personal blog/site built with Astro 7, Solid.js (for interactive islands), and Tailwind CSS 4. Content (posts, projects) is authored in Markdown with strict Zod-validated frontmatter. Deployed to GitHub Pages via GitHub Actions on push to `main`.

Requires Bun 1.3+ and Node.js 22.12+. Bun is the package manager and test runner; scripts are run with `bun run <script>`.

## Commands

```bash
bun install --frozen-lockfile   # install deps

bun run dev                     # start Astro dev server
bun run build                   # post:check -> astro build -> search:index (pagefind)
bun run preview                 # preview the built dist/

bun run check                   # post:check + astro check (type/content check)
bun run test                    # bun test (runs all *.test.ts under tests/)
bun run site:check              # validates internal links in dist/ (run after build)

bun run post:new "标题"          # scaffold a new draft post (see options below)
bun run post:check              # validate all post frontmatter (slugs, dates, categories, covers)
bun run post:drafts             # list current draft posts
```

Run a single test file with `bun test tests/posts.test.ts`.

CI (`.github/workflows/deploy.yml`) runs, in order: install -> `bun run check` -> `bun run test` -> `bun run build` -> `bun run site:check` -> deploy to Pages. Reproduce this sequence locally before pushing to catch what CI will catch.

## Architecture

### Content collections and validation

Two Astro content collections are defined in `src/content.config.ts`, backed by Markdown files:
- `posts` (`src/content/posts/*.md`) — filename is arbitrary; the permanent URL comes from the `slug` frontmatter field, which must never change once published. Zod schema requires `title`, `slug`, `date`/`updated` (strict ISO 8601 with timezone, see `src/config/content.ts`), `categories` (must be one of `CATEGORY_KEYS` from `src/config/categories.ts`), `tags`, and `draft`. Published posts (`draft: false`) additionally require a non-empty `description` and at least one category.
- `projects` (`src/content/projects/*.md`) — powers the `/tools` project listing. Fields: `title`, `description`, optional `status`/`icon`/`cover`/`order`, `links` (each validated as http(s), site-relative, or an anchor), `draft`.

Frontmatter dates must match `ISO_DATE_TIME_PATTERN` exactly (date + time + explicit offset/Z) — bare dates like `2026-07-14` are rejected. `scripts/post-lib.ts` (shared by `post-new`/`post-check`/tests) and `src/content.config.ts` both enforce slug/date rules but independently — keep them in sync if either changes.

`bun run post:check` (via `scripts/post-check.ts`) re-validates all posts outside of Astro's own content loader (duplicate slugs including case-folded collisions, cover file existence and no path escape, Windows-reserved slug names, etc.) and is run before every build.

### Friend links

`src/data/friends.toml` is hand-edited (including by external contributors via PR) and parsed/validated by `src/lib/friends.ts` using `smol-toml` + a strict Zod schema: unique titles (NFKC + case-folded) and unique URLs, HTTPS-only avatars, HTTP(S)-only site URLs, unknown fields rejected.

### Rendering pipeline

- Markdown is processed through `@astrojs/markdown-remark`'s `unified` processor with `remark-math` + `rehype-katex` for LaTeX, and Shiki for code highlighting (separate light/dark themes, see `astro.config.mjs`).
- `src/layouts/App.astro` is the single page shell: handles the light/dark theme toggle (persisted to `localStorage`, applied pre-hydration to avoid FOUC), Google Analytics page-view tracking across Astro's client-side transitions (`astro:page-load`), OG/Twitter meta tags, JSON-LD structured data, and lazy-loads a few page-specific scripts (`blog-archive`, `table-of-contents`, `article-widgets`) only when their target elements are present in the DOM.
- Astro's `<ClientRouter />` (view transitions) is enabled sitewide, so any script relying on DOM state must re-bind on `astro:page-load`/`astro:after-swap` rather than assuming a full page load — see the theme toggle and archive/TOC loaders in `App.astro` for the pattern.
- Interactive widgets that need client-side state (emoji explorer, social insurance calculator, lottery tool, Giscus comments, search) are Solid.js components under `src/components/**/*.tsx`, islands-hydrated into otherwise static `.astro` pages.

### Comments and search

- Comments use Giscus (`src/components/comments/GiscusComments.tsx`), lazy-loaded near the bottom of an article. Default public config is in `src/config/comments.ts`, overridable via `PUBLIC_GISCUS_*` env vars.
- Site search is Pagefind, indexed as a post-build step (`search:index` script) over the built `dist/`. Pages/regions can opt out of indexing via the `pagefindIgnore` prop on `App.astro` (mirrors `noindex`).

### Tools pages and redirects

`/tools` (formerly `/fun`) lists both static tool pages and content-driven project entries. Old `/fun/*` paths are permanently redirected in `astro.config.mjs`; the sitemap integration excludes `/fun`, `/f-link`, `/search`, and `/404` from the generated sitemap.

## Working with posts

Post covers live in `src/assets/images/posts/`, referenced from frontmatter by relative path; Astro generates WebP + responsive sizes at build time. New posts default to `draft: true` — the frontmatter `draft` field must be explicitly flipped to `false` (along with filling in `description` and `categories`) before a post is considered published and validation is enforced.

Category keys are fixed to `tech`, `life`, `notes`, `writing` (`src/config/categories.ts`) — adding a new one requires updating `CATEGORY_KEYS`/`CATEGORY_META` there, which the Zod schema and tests both key off of.
