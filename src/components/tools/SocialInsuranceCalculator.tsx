import { For, Show, createMemo, createSignal } from "solid-js";

interface ContributionItem {
    id: string;
    name: string;
    base: number;
    employeeRate: number;
    employerRate: number;
    removable?: boolean;
}

const defaultItems = (): ContributionItem[] => [
    { id: "pension", name: "养老保险", base: 0, employeeRate: 0, employerRate: 0 },
    { id: "medical", name: "医疗保险", base: 0, employeeRate: 0, employerRate: 0 },
    { id: "unemployment", name: "失业保险", base: 0, employeeRate: 0, employerRate: 0 },
    { id: "injury", name: "工伤保险", base: 0, employeeRate: 0, employerRate: 0 },
    { id: "maternity", name: "生育保险", base: 0, employeeRate: 0, employerRate: 0 },
    { id: "housing", name: "住房公积金", base: 0, employeeRate: 0, employerRate: 0 },
];

const money = new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
});

function safeNumber(value: string) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
}

export default function SocialInsuranceCalculator() {
    const [region, setRegion] = createSignal("自定义地区");
    const [effectiveDate, setEffectiveDate] = createSignal("");
    const [source, setSource] = createSignal("");
    const [grossSalary, setGrossSalary] = createSignal(0);
    const [commonBase, setCommonBase] = createSignal(0);
    const [items, setItems] = createSignal(defaultItems());

    const updateItem = (
        id: string,
        field: "name" | "base" | "employeeRate" | "employerRate",
        value: string,
    ) => {
        setItems((current) =>
            current.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          [field]: field === "name" ? value : safeNumber(value),
                      }
                    : item,
            ),
        );
    };

    const rows = createMemo(() =>
        items().map((item) => ({
            ...item,
            employeeAmount: item.base * (item.employeeRate / 100),
            employerAmount: item.base * (item.employerRate / 100),
        })),
    );

    const employeeTotal = createMemo(() =>
        rows().reduce((total, item) => total + item.employeeAmount, 0),
    );
    const employerTotal = createMemo(() =>
        rows().reduce((total, item) => total + item.employerAmount, 0),
    );

    const applyCommonBase = () => {
        setItems((current) =>
            current.map((item) => ({ ...item, base: commonBase() })),
        );
    };

    const addItem = () => {
        setItems((current) => [
            ...current,
            {
                id: `custom-${Date.now()}`,
                name: "自定义项目",
                base: commonBase(),
                employeeRate: 0,
                employerRate: 0,
                removable: true,
            },
        ]);
    };

    const reset = () => {
        setRegion("自定义地区");
        setEffectiveDate("");
        setSource("");
        setGrossSalary(0);
        setCommonBase(0);
        setItems(defaultItems());
    };

    return (
        <div class="space-y-6">
            <aside class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
                <strong class="font-semibold">使用前请确认参数。</strong>
                本工具不内置或声称提供任何地区的现行政策数据。请根据当地公开文件或单位说明填写，结果仅供估算，不构成财务、税务或法律建议。
            </aside>

            <section class="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div class="mb-5">
                    <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">参数说明</h2>
                    <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        这些信息只用于标记本次估算，全部计算均在你的浏览器中完成。
                    </p>
                </div>
                <div class="grid gap-4 md:grid-cols-3">
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">地区</span>
                        <input
                            value={region()}
                            onInput={(event) => setRegion(event.currentTarget.value)}
                            placeholder="例如：某市（自定义）"
                            class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950"
                        />
                    </label>
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">参数生效日期</span>
                        <input
                            type="date"
                            value={effectiveDate()}
                            onInput={(event) => setEffectiveDate(event.currentTarget.value)}
                            class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950"
                        />
                    </label>
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">参数来源</span>
                        <input
                            value={source()}
                            onInput={(event) => setSource(event.currentTarget.value)}
                            placeholder="文件名称、公开链接或单位说明"
                            class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950"
                        />
                    </label>
                </div>
            </section>

            <section class="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div class="flex flex-col gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between dark:border-zinc-800">
                    <div>
                        <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">缴费参数</h2>
                        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            比例按百分数填写，例如 8% 请填写 8。不同项目可以使用不同基数。
                        </p>
                    </div>
                    <div class="flex flex-wrap items-end gap-2">
                        <label>
                            <span class="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">统一基数</span>
                            <input
                                type="number"
                                min="0"
                                step="100"
                                inputMode="decimal"
                                value={commonBase()}
                                onInput={(event) => setCommonBase(safeNumber(event.currentTarget.value))}
                                class="w-36 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={applyCommonBase}
                            class="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-orange-400 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-orange-300"
                        >
                            应用到全部
                        </button>
                    </div>
                </div>

                <div class="mt-5 space-y-3">
                    <For each={rows()}>
                        {(item) => (
                            <div class="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 md:grid-cols-[minmax(8rem,1.2fr)_repeat(3,minmax(7rem,1fr))_minmax(9rem,1fr)_auto] md:items-end dark:border-zinc-800 dark:bg-zinc-950/50">
                                <label>
                                    <span class="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">项目</span>
                                    <input
                                        value={item.name}
                                        onInput={(event) => updateItem(item.id, "name", event.currentTarget.value)}
                                        class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
                                    />
                                </label>
                                <label>
                                    <span class="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">基数（元）</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        inputMode="decimal"
                                        value={item.base}
                                        onInput={(event) => updateItem(item.id, "base", event.currentTarget.value)}
                                        class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
                                    />
                                </label>
                                <label>
                                    <span class="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">个人比例（%）</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        inputMode="decimal"
                                        value={item.employeeRate}
                                        onInput={(event) => updateItem(item.id, "employeeRate", event.currentTarget.value)}
                                        class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
                                    />
                                </label>
                                <label>
                                    <span class="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">单位比例（%）</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        inputMode="decimal"
                                        value={item.employerRate}
                                        onInput={(event) => updateItem(item.id, "employerRate", event.currentTarget.value)}
                                        class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
                                    />
                                </label>
                                <div class="rounded-lg bg-white px-3 py-2 text-sm dark:bg-zinc-900">
                                    <span class="block text-xs text-zinc-500 dark:text-zinc-400">个人 / 单位</span>
                                    <span class="mt-1 block font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                                        {money.format(item.employeeAmount)} / {money.format(item.employerAmount)}
                                    </span>
                                </div>
                                <Show when={item.removable} fallback={<span class="hidden w-8 md:block" />}>
                                    <button
                                        type="button"
                                        aria-label={`删除${item.name}`}
                                        onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                                        class="rounded-lg px-2 py-2 text-sm text-zinc-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                    >
                                        删除
                                    </button>
                                </Show>
                            </div>
                        )}
                    </For>
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={addItem}
                        class="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition hover:border-orange-400 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-zinc-700 dark:hover:text-orange-300"
                    >
                        添加自定义项目
                    </button>
                    <button
                        type="button"
                        onClick={reset}
                        class="rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                        清空参数
                    </button>
                </div>
            </section>

            <section class="rounded-xl border border-zinc-200 bg-zinc-900 p-5 text-white sm:p-6 dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">
                <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p class="text-sm text-zinc-300 dark:text-zinc-600">本次自定义估算</p>
                        <h2 class="mt-1 text-xl font-semibold">{region() || "未填写地区"}</h2>
                        <p class="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                            生效日期：{effectiveDate() || "未填写"} · 来源：{source() || "未填写"}
                        </p>
                    </div>
                    <label class="block lg:w-56">
                        <span class="mb-1 block text-xs text-zinc-300 dark:text-zinc-600">税前月薪（可选）</span>
                        <input
                            type="number"
                            min="0"
                            step="100"
                            inputMode="decimal"
                            value={grossSalary()}
                            onInput={(event) => setGrossSalary(safeNumber(event.currentTarget.value))}
                            class="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-400 dark:border-zinc-300 dark:bg-white dark:text-zinc-900"
                        />
                    </label>
                </div>

                <dl class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div class="rounded-lg bg-white/10 p-4 dark:bg-zinc-900/5">
                        <dt class="text-xs text-zinc-300 dark:text-zinc-600">个人缴费合计</dt>
                        <dd class="mt-1 text-xl font-semibold tabular-nums">{money.format(employeeTotal())}</dd>
                    </div>
                    <div class="rounded-lg bg-white/10 p-4 dark:bg-zinc-900/5">
                        <dt class="text-xs text-zinc-300 dark:text-zinc-600">单位缴费合计</dt>
                        <dd class="mt-1 text-xl font-semibold tabular-nums">{money.format(employerTotal())}</dd>
                    </div>
                    <div class="rounded-lg bg-white/10 p-4 dark:bg-zinc-900/5">
                        <dt class="text-xs text-zinc-300 dark:text-zinc-600">缴费总计</dt>
                        <dd class="mt-1 text-xl font-semibold tabular-nums">{money.format(employeeTotal() + employerTotal())}</dd>
                    </div>
                    <div class="rounded-lg bg-orange-500 p-4 text-white dark:bg-orange-600">
                        <dt class="text-xs text-orange-100">仅扣本表个人缴费后</dt>
                        <dd class="mt-1 text-xl font-semibold tabular-nums">
                            {money.format(Math.max(0, grossSalary() - employeeTotal()))}
                        </dd>
                    </div>
                </dl>
                <p class="mt-4 text-xs leading-5 text-zinc-400 dark:text-zinc-500">
                    “仅扣本表个人缴费后”未计算个人所得税、专项扣除、补缴、封顶或其他薪资项目，不等同于实际到手工资。
                </p>
            </section>
        </div>
    );
}
