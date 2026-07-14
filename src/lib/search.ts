export type SearchEntryType = "article" | "page" | "tool" | "project";

export interface SiteSearchEntry {
  title: string;
  description: string;
  href: string;
  type: SearchEntryType;
  keywords: string[];
  content?: string;
}

export interface RankedSearchEntry extends SiteSearchEntry {
  score: number;
}

const searchableWhitespace = /\s+/g;
const searchablePunctuation = /[，。！？、；：,.!?;:()[\]{}（）"“”‘’|]+/gu;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(searchablePunctuation, " ")
    .replace(searchableWhitespace, " ")
    .trim();
}

export function markdownToSearchText(markdown: string): string {
  return markdown
    .replace(/^---[\s\S]*?---\s*/u, " ")
    .replace(/```[^\n]*\n([\s\S]*?)```/gu, "$1")
    .replace(/`([^`]+)`/gu, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/<[^>]+>/gu, " ")
    .replace(/^[#>*+-]+\s*/gmu, " ")
    .replace(searchableWhitespace, " ")
    .trim();
}

function scoreField(field: string, token: string, weight: number): number {
  if (!field.includes(token)) return 0;
  if (field === token) return weight * 4;
  if (field.startsWith(token)) return weight * 2;
  return weight;
}

export function searchSiteEntries(
  entries: readonly SiteSearchEntry[],
  query: string,
): RankedSearchEntry[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const tokens = [...new Set(normalizedQuery.split(" ").filter(Boolean))];

  return entries
    .map((entry) => {
      const title = normalizeSearchText(entry.title);
      const description = normalizeSearchText(entry.description);
      const keywords = normalizeSearchText(entry.keywords.join(" "));
      const content = normalizeSearchText(entry.content ?? "");
      const combined = `${title} ${description} ${keywords} ${content}`;

      if (!tokens.every((token) => combined.includes(token))) return undefined;

      const score = tokens.reduce(
        (total, token) =>
          total +
          scoreField(title, token, 120) +
          scoreField(keywords, token, 48) +
          scoreField(description, token, 24) +
          scoreField(content, token, 6),
        0,
      );

      return { ...entry, score };
    })
    .filter((entry): entry is RankedSearchEntry => entry !== undefined)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.title.localeCompare(right.title, "zh-CN"),
    );
}
