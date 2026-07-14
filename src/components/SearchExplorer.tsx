import MagnifyIcon from "@iconify-solid/mdi/magnify";
import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";

import {
  searchSiteEntries,
  type SearchEntryType,
  type SiteSearchEntry,
} from "../lib/search";

interface Props {
  entries: SiteSearchEntry[];
}

const TYPE_LABELS: Record<SearchEntryType, string> = {
  article: "文章",
  page: "页面",
  tool: "工具",
  project: "项目",
};

export default function SearchExplorer(props: Props) {
  const [query, setQuery] = createSignal("");

  onMount(() => {
    const syncFromUrl = () => {
      setQuery(new URL(window.location.href).searchParams.get("q") ?? "");
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    onCleanup(() => window.removeEventListener("popstate", syncFromUrl));
  });

  const results = createMemo(() => searchSiteEntries(props.entries, query()));
  const hasQuery = createMemo(() => query().trim().length > 0);

  const updateQuery = (value: string) => {
    setQuery(value);

    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <div class="space-y-6">
      <form
        role="search"
        action="/search"
        method="get"
        onSubmit={(event) => event.preventDefault()}
        class="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <label for="site-search-input" class="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
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
            onInput={(event) => updateQuery(event.currentTarget.value)}
            placeholder="搜索文章、工具、项目……"
            autocomplete="off"
            class="w-full rounded-lg border border-zinc-300 bg-white py-3 pr-4 pl-11 text-base text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
        <p class="mt-3 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
          {hasQuery()
            ? `找到 ${results().length} 项结果`
            : `可搜索 ${props.entries.length} 项内容，包括文章正文。`}
        </p>
        <noscript>
          <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            全站搜索需要启用 JavaScript。
          </p>
        </noscript>
      </form>

      <Show
        when={hasQuery()}
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
              <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">换一个更短或更常见的关键词试试。</p>
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
                      href={entry.href}
                      class="group grid gap-2 py-5 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-4"
                    >
                      <span class="mt-0.5 w-fit rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {TYPE_LABELS[entry.type]}
                      </span>
                      <div class="min-w-0">
                        <h3 class="text-base font-bold text-zinc-900 transition-colors group-hover:text-orange-600 dark:text-zinc-100 dark:group-hover:text-orange-400">
                          {entry.title}
                        </h3>
                        <p class="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                          {entry.description}
                        </p>
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
