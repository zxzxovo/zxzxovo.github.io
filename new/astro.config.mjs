// @ts-check
import { defineConfig } from "astro/config";
import icon from "astro-icon";

import solidJs from "@astrojs/solid-js";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://hizhixia.site",
  integrations: [solidJs(), icon()],

  vite: {
    plugins: [tailwindcss()],
  },
});
