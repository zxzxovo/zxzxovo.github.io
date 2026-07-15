import type { Theme } from "@giscus/solid";
import { Show, createSignal, lazy, onCleanup, onMount } from "solid-js";

import type { GiscusConfig } from "../../config/comments";

const Giscus = lazy(() => import("@giscus/solid"));

interface Props {
  config?: GiscusConfig;
  term: string;
}

function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark")
    ? "dark_dimmed"
    : "light";
}

export default function GiscusComments(props: Props) {
  let commentsRoot: HTMLElement | undefined;
  const [shouldLoad, setShouldLoad] = createSignal(false);
  const [widgetReady, setWidgetReady] = createSignal(false);
  const [theme, setTheme] = createSignal<Theme>("light");
  const configured = () => Boolean(props.config && props.term.trim());

  onMount(() => {
    let disposed = false;
    let visibilityObserver: IntersectionObserver | undefined;
    const syncTheme = () => {
      const next = currentTheme();
      setTheme(next);
      commentsRoot
        ?.querySelector("giscus-widget")
        ?.setAttribute("theme", next);
    };
    const themeObserver = new MutationObserver(syncTheme);

    const reveal = () => {
      if (disposed || shouldLoad()) return;
      setShouldLoad(true);
      visibilityObserver?.disconnect();

      void customElements.whenDefined("giscus-widget").then(() => {
        if (!disposed) setWidgetReady(true);
      });
    };

    syncTheme();
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    if (configured() && commentsRoot) {
      if ("IntersectionObserver" in window) {
        visibilityObserver = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) reveal();
          },
          { rootMargin: "600px 0px" },
        );
        visibilityObserver.observe(commentsRoot);
      } else {
        reveal();
      }
    }

    onCleanup(() => {
      disposed = true;
      themeObserver.disconnect();
      visibilityObserver?.disconnect();
    });
  });

  return (
    <section
      ref={commentsRoot}
      id="comments"
      data-pagefind-ignore=""
      class="mx-auto mt-14 max-w-3xl border-t border-zinc-200 pt-10 dark:border-zinc-800"
      aria-labelledby="comments-title"
    >
      <div class="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="comments-title"
          class="text-xl font-bold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50"
        >
          评论
        </h2>
        <p class="text-xs text-zinc-400 dark:text-zinc-500">
          由 GitHub Discussions 提供
        </p>
      </div>

      <Show
        when={configured()}
        fallback={
          <div
            class="rounded-[0.625rem] border border-dashed border-zinc-300 bg-zinc-100/60 px-5 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50"
            role="status"
          >
            <p class="font-medium text-zinc-800 dark:text-zinc-200">
              评论区尚未启用
            </p>
            <p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              完成 Giscus 仓库与 Discussion 分类配置后，评论会显示在这里。
            </p>
          </div>
        }
      >
        <Show
          when={shouldLoad()}
          fallback={
            <div
              class="rounded-[0.625rem] border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              role="status"
            >
              滚动到文章底部附近时加载评论区。
            </div>
          }
        >
          <div
            class="relative min-h-36 [&>giscus-widget]:block [&>giscus-widget]:w-full"
            aria-busy={!widgetReady()}
          >
            <Giscus
              host="https://giscus.app"
              repo={props.config!.repo}
              repoId={props.config!.repoId}
              category={props.config!.category}
              categoryId={props.config!.categoryId}
              mapping="specific"
              term={props.term}
              strict="1"
              reactionsEnabled="1"
              emitMetadata="0"
              inputPosition="bottom"
              theme={theme()}
              lang="zh-CN"
              loading="lazy"
            />
            <Show when={!widgetReady()}>
              <p
                class="absolute inset-0 grid place-items-center text-sm text-zinc-500 dark:text-zinc-400"
                role="status"
                aria-live="polite"
              >
                正在连接评论区…
              </p>
            </Show>
          </div>
        </Show>
      </Show>
    </section>
  );
}
