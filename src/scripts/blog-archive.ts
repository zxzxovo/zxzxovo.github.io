class BlogArchiveElement extends HTMLElement {
    private controller?: AbortController;

    connectedCallback() {
        this.controller?.abort();
        this.controller = new AbortController();
        const { signal } = this.controller;

        const form = this.querySelector<HTMLFormElement>("[data-filter-form]");
        const tagSelect = this.querySelector<HTMLSelectElement>("[data-tag-select]");
        const resetButton = this.querySelector<HTMLButtonElement>("[data-reset-filter]");
        const status = this.querySelector<HTMLElement>("[data-filter-status]");
        const pagination = this.querySelector<HTMLElement>("[data-pagination]");
        const cards = [...this.querySelectorAll<HTMLElement>("[data-post-card]")];

        if (!form || !tagSelect || !resetButton || !status || !pagination) return;

        const currentPage = Number(this.dataset.currentPage ?? "1");
        const lastPage = Number(this.dataset.lastPage ?? "1");
        const total = Number(this.dataset.total ?? cards.length);
        const validCategories = new Set(
            [...form.querySelectorAll<HTMLInputElement>('input[name="category"]')].map((input) => input.value),
        );
        const validTags = new Set([...tagSelect.options].map((option) => option.value));

        const readUrlState = () => {
            const url = new URL(window.location.href);
            const categoryParam = url.searchParams.get("category") ?? "";
            const tagParam = url.searchParams.get("tag") ?? "";
            return {
                category: validCategories.has(categoryParam) ? categoryParam : "",
                tag: validTags.has(tagParam) ? tagParam : "",
            };
        };

        const setControls = (category: string, tag: string) => {
            for (const input of form.querySelectorAll<HTMLInputElement>('input[name="category"]')) {
                input.checked = input.value === category;
            }
            tagSelect.value = tag;
        };

        const filteredUrl = (category: string, tag: string) => {
            const nextUrl = new URL(window.location.href);
            if (category || tag) nextUrl.pathname = "/blog";
            if (category) nextUrl.searchParams.set("category", category);
            else nextUrl.searchParams.delete("category");
            if (tag) nextUrl.searchParams.set("tag", tag);
            else nextUrl.searchParams.delete("tag");
            return nextUrl;
        };

        const cardMatches = (card: HTMLElement, category: string, tag: string) => {
            const categories = new Set((card.dataset.categories ?? "").split(" ").filter(Boolean));
            let tags: string[] = [];
            try {
                tags = JSON.parse(card.dataset.tags ?? "[]") as string[];
            } catch {
                tags = [];
            }
            return (!category || categories.has(category)) && (!tag || tags.includes(tag));
        };

        const renderFilters = (category: string, tag: string) => {
            const filtering = Boolean(category || tag);
            let count = 0;

            for (const card of cards) {
                const matches = cardMatches(card, category, tag);
                const onCurrentPage = Number(card.dataset.page) === currentPage;
                card.hidden = filtering ? !matches : !onCurrentPage;
                if (matches) count += 1;
            }

            pagination.hidden = filtering;
            resetButton.disabled = !filtering;
            status.textContent = filtering
                ? `找到 ${count} 篇文章`
                : `共 ${total} 篇 · 第 ${currentPage}/${lastPage} 页`;
        };

        const applyControlState = (updateHistory: boolean) => {
            const category = new FormData(form).get("category")?.toString() ?? "";
            const tag = tagSelect.value;
            const nextUrl = filteredUrl(category, tag);

            if (updateHistory && (category || tag) && currentPage > 1) {
                window.location.assign(nextUrl.toString());
                return;
            }

            renderFilters(category, tag);
            if (updateHistory && nextUrl.href !== window.location.href) {
                window.history.pushState(window.history.state, "", nextUrl);
            }
        };

        const syncFromUrl = () => {
            const { category, tag } = readUrlState();
            if ((category || tag) && currentPage > 1) {
                window.location.replace(filteredUrl(category, tag).toString());
                return;
            }
            setControls(category, tag);
            renderFilters(category, tag);
        };

        form.addEventListener("change", () => applyControlState(true), { signal });
        resetButton.addEventListener("click", () => {
            setControls("", "");
            applyControlState(true);
        }, { signal });
        window.addEventListener("popstate", syncFromUrl, { signal });

        syncFromUrl();
    }

    disconnectedCallback() {
        this.controller?.abort();
    }
}

export function initBlogArchives() {
    if (!customElements.get("blog-archive")) {
        customElements.define("blog-archive", BlogArchiveElement);
    }
}
