export interface GiscusConfig {
  repo: `${string}/${string}`;
  repoId: string;
  category: string;
  categoryId: string;
}

// Verified against the public GitHub API on 2026-07-15. These identifiers are
// public Giscus metadata, not credentials.
const verifiedConfig = {
  repo: "zxzxovo/zxzxovo.github.io",
  repoId: "R_kgDONxTewg",
  category: "Announcements",
  categoryId: "DIC_kwDONxTews4CmeWX",
} as const satisfies GiscusConfig;

const environmentConfig = {
  repo: import.meta.env.PUBLIC_GISCUS_REPO,
  repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID,
  category: import.meta.env.PUBLIC_GISCUS_CATEGORY,
  categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID,
};

const hasEnvironmentOverride = Object.values(environmentConfig).some(
  (value) => value !== undefined,
);
const candidate = hasEnvironmentOverride ? environmentConfig : verifiedConfig;
const isComplete =
  typeof candidate.repo === "string" &&
  /^[^/\s]+\/[^/\s]+$/.test(candidate.repo) &&
  [candidate.repoId, candidate.category, candidate.categoryId].every(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

export const GISCUS_CONFIG: GiscusConfig | undefined = isComplete
  ? {
      repo: candidate.repo as GiscusConfig["repo"],
      repoId: candidate.repoId!,
      category: candidate.category!,
      categoryId: candidate.categoryId!,
    }
  : undefined;

export function getGiscusTerm(slug: string): string {
  return `blog/${encodeURIComponent(slug)}`;
}
