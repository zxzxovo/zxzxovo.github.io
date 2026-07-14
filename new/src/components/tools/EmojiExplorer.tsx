import { For, Show, createMemo, createSignal, onCleanup } from "solid-js";
import { emojiGroups, type EmojiItem } from "../../data/emojis";

const modes = [
    { id: "emoji", label: "Emoji" },
    { id: "codepoint", label: "Unicode 码点" },
    { id: "escape", label: "JS 转义" },
] as const;

type CopyMode = (typeof modes)[number]["id"];

function toCodePoints(value: string) {
    return Array.from(value)
        .map((character) =>
            `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`,
        )
        .join(" ");
}

function toJavaScriptEscape(value: string) {
    return Array.from(value)
        .map((character) => {
            const codePoint = character.codePointAt(0)!;
            return codePoint <= 0xffff
                ? `\\u${codePoint.toString(16).toUpperCase().padStart(4, "0")}`
                : `\\u{${codePoint.toString(16).toUpperCase()}}`;
        })
        .join("");
}

function copyValue(item: EmojiItem, mode: CopyMode) {
    if (mode === "codepoint") return toCodePoints(item.emoji);
    if (mode === "escape") return toJavaScriptEscape(item.emoji);
    return item.emoji;
}

async function writeClipboard(value: string) {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(value);
}

export default function EmojiExplorer() {
    const [query, setQuery] = createSignal("");
    const [category, setCategory] = createSignal("all");
    const [mode, setMode] = createSignal<CopyMode>("emoji");
    const [copied, setCopied] = createSignal("");
    const [copyError, setCopyError] = createSignal(false);
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    onCleanup(() => resetTimer && clearTimeout(resetTimer));

    const visibleGroups = createMemo(() => {
        const normalizedQuery = query().trim().toLocaleLowerCase("zh-CN");

        return emojiGroups
            .filter((group) => category() === "all" || group.id === category())
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => {
                    if (!normalizedQuery) return true;
                    const searchable = [
                        item.emoji,
                        item.name,
                        item.keywords,
                        toCodePoints(item.emoji),
                    ]
                        .join(" ")
                        .toLocaleLowerCase("zh-CN");
                    return searchable.includes(normalizedQuery);
                }),
            }))
            .filter((group) => group.items.length > 0);
    });

    const resultCount = createMemo(() =>
        visibleGroups().reduce((count, group) => count + group.items.length, 0),
    );

    const copy = async (item: EmojiItem) => {
        const value = copyValue(item, mode());
        try {
            await writeClipboard(value);
            setCopyError(false);
            setCopied(`${item.emoji}-${mode()}`);
        } catch {
            setCopyError(true);
            setCopied("");
        }

        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            setCopied("");
            setCopyError(false);
        }, 1800);
    };

    return (
        <div class="space-y-6">
            <section class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-200/50 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
                <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            搜索 Emoji
                        </span>
                        <input
                            type="search"
                            value={query()}
                            onInput={(event) => setQuery(event.currentTarget.value)}
                            placeholder="输入名称、关键词或 U+1F600"
                            class="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                    </label>

                    <fieldset>
                        <legend class="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            点击后复制
                        </legend>
                        <div class="flex flex-wrap gap-2">
                            <For each={modes}>
                                {(option) => (
                                    <button
                                        type="button"
                                        aria-pressed={mode() === option.id}
                                        onClick={() => setMode(option.id)}
                                        class="rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                                        classList={{
                                            "border-orange-600 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-400/10 dark:text-orange-300":
                                                mode() === option.id,
                                            "border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-zinc-100":
                                                mode() !== option.id,
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                )}
                            </For>
                        </div>
                    </fieldset>
                </div>

                <div class="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Emoji 分类">
                    <button
                        type="button"
                        aria-pressed={category() === "all"}
                        onClick={() => setCategory("all")}
                        class="shrink-0 rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                        classList={{
                            "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900":
                                category() === "all",
                            "border-zinc-300 text-zinc-600 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100":
                                category() !== "all",
                        }}
                    >
                        全部
                    </button>
                    <For each={emojiGroups}>
                        {(group) => (
                            <button
                                type="button"
                                aria-pressed={category() === group.id}
                                onClick={() => setCategory(group.id)}
                                class="shrink-0 rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                                classList={{
                                    "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900":
                                        category() === group.id,
                                    "border-zinc-300 text-zinc-600 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100":
                                        category() !== group.id,
                                }}
                            >
                                {group.label}
                            </button>
                        )}
                    </For>
                </div>
            </section>

            <div class="flex items-center justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                <span>找到 {resultCount()} 个结果</span>
                <span aria-live="polite" class={copyError() ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}>
                    {copyError() ? "复制失败，请手动复制" : copied() ? "已复制" : ""}
                </span>
            </div>

            <Show
                when={visibleGroups().length > 0}
                fallback={
                    <div class="rounded-xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                        没有找到匹配的 Emoji，换个关键词试试。
                    </div>
                }
            >
                <div class="space-y-8">
                    <For each={visibleGroups()}>
                        {(group) => (
                            <section aria-labelledby={`emoji-${group.id}`}>
                                <h2 id={`emoji-${group.id}`} class="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                    {group.label}
                                </h2>
                                <ul class="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
                                    <For each={group.items}>
                                        {(item) => {
                                            const key = () => `${item.emoji}-${mode()}`;
                                            return (
                                                <li>
                                                    <button
                                                        type="button"
                                                        title={`${item.name} · ${copyValue(item, mode())}`}
                                                        aria-label={`复制${item.name}的${modes.find((entry) => entry.id === mode())?.label}`}
                                                        onClick={() => void copy(item)}
                                                        class="group flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-white p-2 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-500"
                                                    >
                                                        <span class="text-3xl leading-none sm:text-4xl" aria-hidden="true">
                                                            {item.emoji}
                                                        </span>
                                                        <span class="w-full truncate text-center text-[11px] text-zinc-500 group-hover:text-orange-600 dark:text-zinc-400 dark:group-hover:text-orange-400">
                                                            {copied() === key() ? "已复制" : item.name}
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        }}
                                    </For>
                                </ul>
                            </section>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
}
