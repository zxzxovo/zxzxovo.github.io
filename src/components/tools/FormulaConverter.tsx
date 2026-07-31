import CheckIcon from "@iconify-solid/mdi/check";
import ContentCopyIcon from "@iconify-solid/mdi/content-copy";
import EyeOffOutlineIcon from "@iconify-solid/mdi/eye-off-outline";
import EyeOutlineIcon from "@iconify-solid/mdi/eye-outline";
import OpenInNewIcon from "@iconify-solid/mdi/open-in-new";
import katex from "katex";
import { Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import {
    convertFormula,
    type FormulaMode,
} from "../../lib/formula-converter";

const samples: Record<FormulaMode, string> = {
    latex: String.raw`\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`,
    typst: "frac(-b plus.minus sqrt(b^2 - 4 a c), 2 a)",
};

const modeMeta = {
    latex: { input: "LaTeX", output: "Typst" },
    typst: { input: "Typst", output: "LaTeX" },
} satisfies Record<FormulaMode, { input: string; output: string }>;

interface ConversionState {
    output: string;
    previewLatex: string;
    error?: string;
}

function errorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) return error.message;
    return "无法解析这段公式，请检查语法后重试。";
}

export default function FormulaConverter() {
    const [mode, setMode] = createSignal<FormulaMode>("latex");
    const [source, setSource] = createSignal(samples.latex);
    const [showOutput, setShowOutput] = createSignal(true);
    const [copyState, setCopyState] = createSignal<"idle" | "done" | "error">("idle");
    let inputElement: HTMLTextAreaElement | undefined;
    let outputElement: HTMLTextAreaElement | undefined;
    let copyTimer: ReturnType<typeof setTimeout> | undefined;

    onCleanup(() => copyTimer && clearTimeout(copyTimer));

    const conversion = createMemo<ConversionState>(() => {
        try {
            return convertFormula(source(), mode());
        } catch (error) {
            return { output: "", previewLatex: "", error: errorMessage(error) };
        }
    });

    const preview = createMemo(() => {
        if (conversion().error) return { html: "", error: conversion().error };
        if (!conversion().previewLatex) return { html: "", error: "" };

        try {
            return {
                html: katex.renderToString(conversion().previewLatex, {
                    displayMode: true,
                    throwOnError: true,
                    strict: false,
                    trust: false,
                }),
                error: "",
            };
        } catch (error) {
            return { html: "", error: errorMessage(error) };
        }
    });

    createEffect(() => {
        const value = source();
        if (inputElement && inputElement.value !== value) inputElement.value = value;
    });

    createEffect(() => {
        const value = conversion().error || conversion().output;
        if (outputElement && outputElement.value !== value) outputElement.value = value;
    });

    const switchMode = (nextMode: FormulaMode) => {
        if (nextMode === mode()) return;
        const nextSource = conversion().error || !conversion().output
            ? samples[nextMode]
            : conversion().output;
        setMode(nextMode);
        setSource(nextSource);
        setCopyState("idle");
    };

    const copyOutput = async () => {
        if (!conversion().output) return;

        try {
            await navigator.clipboard.writeText(conversion().output);
            setCopyState("done");
        } catch {
            setCopyState("error");
        }

        if (copyTimer) clearTimeout(copyTimer);
        copyTimer = setTimeout(() => setCopyState("idle"), 1800);
    };

    return (
        <section aria-label="LaTeX 与 Typst 公式转换器" class="space-y-4">
            <div class="flex flex-col gap-4 border-y border-zinc-200 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                <div class="flex flex-wrap items-center gap-3">
                    <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">输入格式</span>
                    <div class="inline-flex rounded-lg border border-zinc-300 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-900" role="group" aria-label="选择输入格式">
                        {(["latex", "typst"] as const).map((item) => (
                            <button
                                type="button"
                                aria-pressed={mode() === item}
                                onClick={() => switchMode(item)}
                                class="min-h-9 rounded-md px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                                classList={{
                                    "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white": mode() === item,
                                    "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100": mode() !== item,
                                }}
                            >
                                {modeMeta[item].input}
                            </button>
                        ))}
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <a
                        href="https://www.latex-project.org/help/documentation/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-orange-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-orange-400"
                    >
                        LaTeX 文档
                        <OpenInNewIcon width="1rem" height="1rem" aria-hidden="true" />
                    </a>
                    <a
                        href="https://typst.app/docs/reference/math/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-orange-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-orange-400"
                    >
                        Typst 文档
                        <OpenInNewIcon width="1rem" height="1rem" aria-hidden="true" />
                    </a>
                    <button
                        type="button"
                        aria-pressed={!showOutput()}
                        onClick={() => setShowOutput((visible) => !visible)}
                        class="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-orange-700 dark:hover:text-orange-400"
                    >
                        <Show when={showOutput()} fallback={<EyeOutlineIcon width="1.1rem" height="1.1rem" aria-hidden="true" />}>
                            <EyeOffOutlineIcon width="1.1rem" height="1.1rem" aria-hidden="true" />
                        </Show>
                        {showOutput() ? "关闭输出" : "显示输出"}
                    </button>
                </div>
            </div>

            <div
                class="grid gap-3"
                classList={{
                    "lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)_minmax(0,1fr)]": showOutput(),
                    "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]": !showOutput(),
                }}
            >
                <section class="flex min-h-80 min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white lg:min-h-[32rem] dark:border-zinc-800 dark:bg-zinc-900" aria-labelledby="formula-input-heading">
                    <div class="flex h-12 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
                        <h2 id="formula-input-heading" class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {modeMeta[mode()].input} 输入
                        </h2>
                        <span class="text-xs text-zinc-400">公式源码</span>
                    </div>
                    <textarea
                        ref={inputElement}
                        value={source()}
                        onInput={(event) => setSource(event.currentTarget.value)}
                        spellcheck={false}
                        aria-label={`${modeMeta[mode()].input} 公式输入`}
                        class="min-h-64 flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-7 text-zinc-900 outline-none placeholder:text-zinc-400 lg:min-h-0 dark:text-zinc-100"
                        placeholder={mode() === "latex" ? String.raw`例如：\frac{x}{y}` : "例如：frac(x, y)"}
                    />
                </section>

                <section class="flex min-h-72 min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 lg:min-h-[32rem] dark:border-zinc-800 dark:bg-zinc-950" aria-labelledby="formula-preview-heading">
                    <div class="flex h-12 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
                        <h2 id="formula-preview-heading" class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">公式预览</h2>
                        <span class="text-xs text-zinc-400">KaTeX</span>
                    </div>
                    <div class="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
                        <Show
                            when={!preview().error && preview().html}
                            fallback={
                                <p class="max-w-sm text-center text-sm leading-6 text-zinc-500 dark:text-zinc-400" role={preview().error ? "alert" : undefined}>
                                    {preview().error || "输入公式后将在这里显示预览。"}
                                </p>
                            }
                        >
                            <div
                                class="max-w-full text-zinc-950 dark:text-zinc-50 [&_.katex-display]:m-0"
                                innerHTML={preview().html}
                            />
                        </Show>
                    </div>
                </section>

                <Show when={showOutput()}>
                    <section class="flex min-h-80 min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white lg:min-h-[32rem] dark:border-zinc-800 dark:bg-zinc-900" aria-labelledby="formula-output-heading">
                        <div class="flex h-12 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
                            <h2 id="formula-output-heading" class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {modeMeta[mode()].output} 输出
                            </h2>
                            <button
                                type="button"
                                onClick={copyOutput}
                                disabled={!conversion().output}
                                title={`复制 ${modeMeta[mode()].output} 公式`}
                                class="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-orange-400"
                            >
                                <Show when={copyState() === "done"} fallback={<ContentCopyIcon width="1rem" height="1rem" aria-hidden="true" />}>
                                    <CheckIcon width="1rem" height="1rem" aria-hidden="true" />
                                </Show>
                                {copyState() === "done" ? "已复制" : "复制"}
                            </button>
                        </div>
                        <textarea
                            ref={outputElement}
                            readOnly
                            value={conversion().error || conversion().output}
                            spellcheck={false}
                            aria-label={`${modeMeta[mode()].output} 转换结果`}
                            class="min-h-64 flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-7 outline-none lg:min-h-0"
                            classList={{
                                "text-red-600 dark:text-red-400": Boolean(conversion().error),
                                "text-zinc-900 dark:text-zinc-100": !conversion().error,
                            }}
                        />
                    </section>
                </Show>
            </div>

            <p class="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                仅转换数学公式语法；自定义宏、整篇文档结构和排版样式可能无法等价转换。所有处理均在当前浏览器中完成。
            </p>
            <p class="sr-only" aria-live="polite">
                {copyState() === "done" ? "转换结果已复制" : copyState() === "error" ? "复制失败，请手动选择输出内容" : ""}
            </p>
        </section>
    );
}
