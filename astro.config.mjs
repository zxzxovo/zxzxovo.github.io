// @ts-check
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";

import solidJs from "@astrojs/solid-js";

import tailwindcss from "@tailwindcss/vite";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

// https://astro.build/config
export default defineConfig({
  site: "https://hizhixia.site",
  redirects: {
    "/fun": "/tools",
    "/fun/unicode-emoji": "/tools/unicode-emoji",
    "/fun/social-insurance": "/tools/social-insurance",
    "/fun/x-lottery": "/tools/x-lottery",
  },
  integrations: [
    solidJs(),
    icon(),
    sitemap({
      filter: (page) =>
        !new URL(page, "https://hizhixia.site").pathname.match(
          /^\/(?:404(?:\.html)?|f-link|fun(?:\/|$))/,
        ),
    }),
  ],

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
  },

  prefetch: {
    prefetchAll: false,
    defaultStrategy: "viewport",
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
