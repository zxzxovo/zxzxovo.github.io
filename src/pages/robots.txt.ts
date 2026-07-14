import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL("https://hizhixia.site");
  return new Response(
    [`User-agent: *`, `Allow: /`, `Sitemap: ${new URL("sitemap-index.xml", base)}`, ""].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};
