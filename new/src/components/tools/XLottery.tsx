import { For, Show, createMemo, createSignal } from "solid-js";

type InputFormat = "lines" | "csv";

interface DrawSnapshot {
    seed: string;
    poolSize: number;
    createdAt: string;
}

function parseCsv(text: string) {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];

        if (character === '"') {
            if (quoted && text[index + 1] === '"') {
                cell += '"';
                index += 1;
            } else {
                quoted = !quoted;
            }
        } else if (character === "," && !quoted) {
            row.push(cell);
            cell = "";
        } else if ((character === "\n" || character === "\r") && !quoted) {
            if (character === "\r" && text[index + 1] === "\n") index += 1;
            row.push(cell);
            if (row.some((value) => value.trim())) rows.push(row);
            row = [];
            cell = "";
        } else {
            cell += character;
        }
    }

    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
    return rows;
}

function identity(value: string) {
    return value.trim().replace(/^@/, "").toLocaleLowerCase("zh-CN");
}

function candidatesFromInput(text: string, format: InputFormat) {
    const cleanText = text.replace(/^\uFEFF/, "");
    if (format === "lines") {
        return cleanText.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    }

    const values = parseCsv(cleanText)
        .map((row) => row[0]?.trim() ?? "")
        .filter(Boolean);
    const headerNames = new Set([
        "name",
        "username",
        "user",
        "handle",
        "candidate",
        "姓名",
        "昵称",
        "用户名",
        "候选人",
    ]);
    if (values.length > 0 && headerNames.has(identity(values[0]))) values.shift();
    return values;
}

function hashSeed(value: string) {
    let hash = 1779033703 ^ value.length;
    for (let index = 0; index < value.length; index += 1) {
        hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
        hash = (hash << 13) | (hash >>> 19);
    }
    return () => {
        hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
        hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
        return (hash ^= hash >>> 16) >>> 0;
    };
}

function randomFromSeed(seed: number) {
    return () => {
        let value = (seed += 0x6d2b79f5);
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffled<T>(items: T[], seed: string) {
    const result = [...items];
    const random = randomFromSeed(hashSeed(seed)());
    for (let index = result.length - 1; index > 0; index -= 1) {
        const target = Math.floor(random() * (index + 1));
        [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
}

function freshSeed() {
    if (globalThis.crypto?.getRandomValues) {
        const values = new Uint32Array(2);
        globalThis.crypto.getRandomValues(values);
        return `${values[0].toString(36)}-${values[1].toString(36)}`;
    }
    return Date.now().toString(36);
}

async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
}

export default function XLottery() {
    const [input, setInput] = createSignal("");
    const [format, setFormat] = createSignal<InputFormat>("lines");
    const [fileName, setFileName] = createSignal("");
    const [deduplicate, setDeduplicate] = createSignal(true);
    const [keyword, setKeyword] = createSignal("");
    const [excluded, setExcluded] = createSignal("");
    const [winnerCount, setWinnerCount] = createSignal(1);
    const [seed, setSeed] = createSignal("");
    const [winners, setWinners] = createSignal<string[]>([]);
    const [snapshot, setSnapshot] = createSignal<DrawSnapshot>();
    const [copyStatus, setCopyStatus] = createSignal("");

    const invalidateDraw = () => {
        setWinners([]);
        setSnapshot(undefined);
        setCopyStatus("");
    };

    const rawCandidates = createMemo(() => candidatesFromInput(input(), format()));

    const pool = createMemo(() => {
        const required = keyword().trim().toLocaleLowerCase("zh-CN");
        const blocked = new Set(
            excluded()
                .split(/\r?\n/)
                .map(identity)
                .filter(Boolean),
        );
        const seen = new Set<string>();

        return rawCandidates().filter((candidate) => {
            const key = identity(candidate);
            if (!key || blocked.has(key)) return false;
            if (required && !candidate.toLocaleLowerCase("zh-CN").includes(required)) return false;
            if (deduplicate() && seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    });

    const importFile = async (event: Event & { currentTarget: HTMLInputElement }) => {
        const inputElement = event.currentTarget;
        const file = inputElement.files?.[0];
        if (!file) return;

        const text = await file.text();
        setInput(text);
        setFileName(file.name);
        setFormat(file.name.toLocaleLowerCase().endsWith(".csv") ? "csv" : "lines");
        invalidateDraw();
        inputElement.value = "";
    };

    const draw = () => {
        if (pool().length === 0) return;
        const effectiveSeed = seed().trim() || freshSeed();
        const count = Math.min(Math.max(1, Math.floor(winnerCount())), pool().length);
        const result = shuffled(pool(), effectiveSeed).slice(0, count);

        setSeed(effectiveSeed);
        setWinners(result);
        setSnapshot({
            seed: effectiveSeed,
            poolSize: pool().length,
            createdAt: new Intl.DateTimeFormat("zh-CN", {
                dateStyle: "medium",
                timeStyle: "medium",
            }).format(new Date()),
        });
        setCopyStatus("");
    };

    const copyResults = async () => {
        try {
            await copyText(
                winners()
                    .map((winner, index) => `${index + 1}. ${winner}`)
                    .join("\n"),
            );
            setCopyStatus("已复制结果");
        } catch {
            setCopyStatus("复制失败，请手动复制");
        }
    };

    return (
        <div class="space-y-6">
            <aside class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-200">
                名单只在当前浏览器中处理，不会上传，也不需要 X 账号或任何访问凭据。同一候选池、顺序和随机种子会得到相同结果。
            </aside>

            <div class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
                <section class="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">1. 导入候选名单</h2>
                            <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                纯文本每行一位候选人；CSV 读取第一列，并自动识别常见表头。
                            </p>
                        </div>
                        <label class="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-orange-400 hover:text-orange-700 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-orange-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-orange-300">
                            选择 TXT / CSV
                            <input
                                type="file"
                                accept=".txt,.csv,text/plain,text/csv"
                                onChange={(event) => void importFile(event)}
                                class="sr-only"
                            />
                        </label>
                    </div>

                    <Show when={fileName()}>
                        <p class="mt-3 text-xs text-zinc-500 dark:text-zinc-400">已读取：{fileName()}</p>
                    </Show>

                    <div class="mt-5 flex gap-2" role="group" aria-label="名单格式">
                        <button
                            type="button"
                            aria-pressed={format() === "lines"}
                            onClick={() => {
                                setFormat("lines");
                                invalidateDraw();
                            }}
                            class="rounded-lg border px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                            classList={{
                                "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900": format() === "lines",
                                "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300": format() !== "lines",
                            }}
                        >
                            每行一位
                        </button>
                        <button
                            type="button"
                            aria-pressed={format() === "csv"}
                            onClick={() => {
                                setFormat("csv");
                                invalidateDraw();
                            }}
                            class="rounded-lg border px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                            classList={{
                                "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900": format() === "csv",
                                "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300": format() !== "csv",
                            }}
                        >
                            CSV 第一列
                        </button>
                    </div>

                    <label class="mt-3 block">
                        <span class="sr-only">候选名单</span>
                        <textarea
                            rows={13}
                            value={input()}
                            onInput={(event) => {
                                setInput(event.currentTarget.value);
                                setFileName("");
                                invalidateDraw();
                            }}
                            placeholder={format() === "lines" ? "@alice\n@bob\n@carol" : "username,comment\n@alice,参与\n@bob,转发"}
                            class="w-full resize-y rounded-xl border border-zinc-300 bg-white px-3.5 py-3 font-mono text-sm leading-6 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950"
                        />
                    </label>
                </section>

                <section class="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">2. 筛选候选池</h2>
                    <div class="mt-5 space-y-4">
                        <label class="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                            <input
                                type="checkbox"
                                checked={deduplicate()}
                                onChange={(event) => {
                                    setDeduplicate(event.currentTarget.checked);
                                    invalidateDraw();
                                }}
                                class="mt-0.5 h-4 w-4 accent-orange-600"
                            />
                            <span>
                                <strong class="block font-medium text-zinc-900 dark:text-zinc-100">忽略重复候选人</strong>
                                不区分大小写，并将开头的 @ 视为同一人。
                            </span>
                        </label>
                        <label class="block">
                            <span class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">必须包含（可选）</span>
                            <input
                                value={keyword()}
                                onInput={(event) => {
                                    setKeyword(event.currentTarget.value);
                                    invalidateDraw();
                                }}
                                placeholder="按候选文字筛选"
                                class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                        </label>
                        <label class="block">
                            <span class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">排除名单（每行一位）</span>
                            <textarea
                                rows={4}
                                value={excluded()}
                                onInput={(event) => {
                                    setExcluded(event.currentTarget.value);
                                    invalidateDraw();
                                }}
                                placeholder="@example"
                                class="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                        </label>
                    </div>

                    <div class="mt-5 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-zinc-500 dark:text-zinc-400">原始 / 有效</span>
                            <strong class="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                                {rawCandidates().length} / {pool().length}
                            </strong>
                        </div>
                        <Show when={pool().length > 0}>
                            <ul class="mt-3 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                                <For each={pool().slice(0, 20)}>
                                    {(candidate) => (
                                        <li class="max-w-full truncate rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                            {candidate}
                                        </li>
                                    )}
                                </For>
                            </ul>
                            <Show when={pool().length > 20}>
                                <p class="mt-2 text-xs text-zinc-400">另有 {pool().length - 20} 位候选人</p>
                            </Show>
                        </Show>
                    </div>
                </section>
            </div>

            <section class="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">3. 随机抽取</h2>
                <div class="mt-5 grid gap-4 sm:grid-cols-[10rem_minmax(12rem,1fr)_auto] sm:items-end">
                    <label>
                        <span class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">抽取人数</span>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={winnerCount()}
                            onInput={(event) => {
                                setWinnerCount(Math.max(1, Number(event.currentTarget.value) || 1));
                                invalidateDraw();
                            }}
                            class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950"
                        />
                    </label>
                    <label>
                        <span class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">随机种子（留空则自动生成）</span>
                        <input
                            value={seed()}
                            onInput={(event) => {
                                setSeed(event.currentTarget.value);
                                invalidateDraw();
                            }}
                            placeholder="例如：summer-2026"
                            class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950"
                        />
                    </label>
                    <button
                        type="button"
                        disabled={pool().length === 0}
                        onClick={draw}
                        class="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-orange-500 dark:hover:bg-orange-400"
                    >
                        开始抽取
                    </button>
                </div>

                <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
                    {winners().length > 0
                        ? `抽取完成，共产生 ${winners().length} 位结果：${winners().join("、")}`
                        : ""}
                </p>

                <Show
                    when={winners().length > 0}
                    fallback={
                        <div class="mt-6 rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                            {pool().length > 0
                                ? "参数已就绪，点击“开始抽取”生成结果。"
                                : "导入至少一位候选人后即可开始抽取。"}
                        </div>
                    }
                >
                    <div class="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900/70 dark:bg-orange-950/20">
                        <div class="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p class="text-xs font-semibold tracking-wider text-orange-700 uppercase dark:text-orange-400">抽取结果</p>
                                <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                    候选池 {snapshot()?.poolSize} 人 · {snapshot()?.createdAt} · 种子 <code>{snapshot()?.seed}</code>
                                </p>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">{copyStatus()}</span>
                                <button
                                    type="button"
                                    onClick={() => void copyResults()}
                                    class="rounded-lg border border-orange-300 px-3 py-1.5 text-sm font-medium text-orange-700 transition hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/50"
                                >
                                    复制结果
                                </button>
                            </div>
                        </div>
                        <ol class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <For each={winners()}>
                                {(winner, index) => (
                                    <li class="flex min-w-0 items-center gap-3 rounded-lg bg-white p-3 dark:bg-zinc-900">
                                        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                                            {index() + 1}
                                        </span>
                                        <span class="truncate font-medium text-zinc-900 dark:text-zinc-100">{winner}</span>
                                    </li>
                                )}
                            </For>
                        </ol>
                        <p class="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                            若候选名单、顺序或筛选条件发生变化，即使种子相同，结果也可能不同。请连同候选池和种子一起留档。
                        </p>
                    </div>
                </Show>
            </section>
        </div>
    );
}
