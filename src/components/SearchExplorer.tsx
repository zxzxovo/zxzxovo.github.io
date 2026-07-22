import MagnifyIcon from "@iconify-solid/mdi/magnify";
import { For, Show, createSignal, onCleanup, onMount } from "solid-js";

interface PagefindResult {
  url: string;
  excerpt?: string;
  plain_excerpt?: string;
  meta?: {
    title?: string;
  };
}

interface PagefindApi {
  init?: () => Promise<void>;
  search: (query: string) => Promise<{
    results: Array<{ data: () => Promise<PagefindResult> }>;
  }>;
}

function loadPagefind(): Promise<PagefindApi> {
  const modulePath = "/pagefind/pagefind.js";
  return import(/* @vite-ignore */ modulePath) as Promise<PagefindApi>;
}

function resultType(url: string) {
  if (/^\/blog\//u.test(url)) return "文章";
  if (/^\/tools(?:\/|$)/u.test(url)) return "工具";
  return "页面";
}

export default function SearchExplorer() {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<PagefindResult[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal(false);
  let timer: number | undefined;
  let requestId = 0;

  const updateUrl = (value: string) => {
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(window.history.state, "", url);
  };

  const runSearch = (value: string) => {
    const normalized = value.trim();
    updateUrl(normalized);
    window.clearTimeout(timer);

    if (!normalized) {
      requestId += 1;
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }

    const currentRequest = ++requestId;
    setLoading(true);
    setError(false);
    timer = window.setTimeout(async () => {
      try {
        const pagefind = await loadPagefind();
        const search = await pagefind.search(normalized);
        const loaded = await Promise.all(
          search.results.slice(0, 40).map((result) => result.data()),
        );
        if (currentRequest !== requestId) return;
        setResults(loaded);
      } catch {
        if (currentRequest !== requestId) return;
        setResults([]);
        setError(true);
      } finally {
        if (currentRequest === requestId) setLoading(false);
      }
    }, 120);
  };

  onMount(() => {
    const initialQuery = new URL(window.location.href).searchParams.get("q") ?? "";
    setQuery(initialQuery);
    if (initialQuery) runSearch(initialQuery);

    const syncFromUrl = () => {
      const nextQuery = new URL(window.location.href).searchParams.get("q") ?? "";
      setQuery(nextQuery);
      runSearch(nextQuery);
    };

    window.addEventListener("popstate", syncFromUrl);
    onCleanup(() => {
      window.removeEventListener("popstate", syncFromUrl);
      window.clearTimeout(timer);
    });
  });

  return (
    <div class="space-y-6">
      <form
        role="search"
        action="/search"
        method="get"
        onSubmit={(event) => event.preventDefault()}
        class="card p-4 sm:p-5"
      >
        <label
          for="site-search-input"
          class="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          搜索整个站点
        </label>
        <div class="relative">
          <MagnifyIcon
            aria-hidden="true"
            class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400"
            height="1.2rem"
          />
          <input
            id="site-search-input"
            name="q"
            type="search"
            value={query()}
            onInput={(event) => {
              setQuery(event.currentTarget.value);
              runSearch(event.currentTarget.value);
            }}
            onFocus={() =>
              void loadPagefind()
                .then((pagefind) => pagefind.init?.())
                .catch(() => undefined)
            }
            placeholder="搜索文章、工具、项目……"
            autocomplete="off"
            class="w-full rounded-lg border border-zinc-300 bg-white py-3 pr-4 pl-11 text-base text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
        <p class="mt-3 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
          {loading()
            ? "正在加载搜索索引……"
            : error()
              ? "搜索索引暂时不可用，请稍后再试。"
              : query().trim()
                ? `找到 ${results().length} 项结果`
                : "搜索索引会在输入时按需加载。"}
        </p>
        <noscript>
          <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">全站搜索需要启用 JavaScript。</p>
        </noscript>
      </form>

      <Show
        when={query().trim()}
        fallback={
          <div class="rounded-xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
            <p class="font-medium text-zinc-800 dark:text-zinc-200">从一个词开始</p>
            <p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              例如 Rust、菜谱、生活，或文章中记得的一句话。
            </p>
          </div>
        }
      >
        <Show
          when={results().length > 0}
          fallback={
            <div class="rounded-xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
              <p class="font-medium text-zinc-800 dark:text-zinc-200">没有找到匹配内容</p>
              <p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                换一个更短或更常见的关键词试试。
              </p>
            </div>
          }
        >
          <section aria-labelledby="search-results-title">
            <h2 id="search-results-title" class="sr-only">搜索结果</h2>
            <ol class="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              <For each={results()}>
                {(entry) => (
                  <li>
                    <a
                      href={entry.url}
                      class="group grid gap-2 py-5 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-4"
                    >
                      <span class="tag-pill mt-0.5 w-fit font-medium">
                        {resultType(entry.url)}
                      </span>
                      <div class="min-w-0">
                        <h3 class="text-base font-bold text-zinc-900 transition-colors group-hover:text-orange-600 dark:text-zinc-100 dark:group-hover:text-orange-400">
                          {entry.meta?.title ?? entry.url}
                        </h3>
                        <p
                          class="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400"
                          innerHTML={entry.excerpt ?? entry.plain_excerpt ?? ""}
                        />
                      </div>
                      <span class="hidden pt-0.5 text-zinc-400 transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true">
                        →
                      </span>
                    </a>
                  </li>
                )}
              </For>
            </ol>
          </section>
        </Show>
      </Show>
    </div>
  );
}
