import type { CollectionEntry } from "astro:content";

export type ProjectEntry = CollectionEntry<"projects">;

export function getProjectAnchor(project: ProjectEntry): string {
  const stableId = project.id
    .replace(/\.[^.]+$/u, "")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return `project-${stableId || "item"}`;
}

export function sortProjects(projects: readonly ProjectEntry[]): ProjectEntry[] {
  return [...projects].sort((left, right) => {
    const byOrder = left.data.order - right.data.order;
    return byOrder || left.data.title.localeCompare(right.data.title, "zh-CN");
  });
}

export async function getPublishedProjects(): Promise<ProjectEntry[]> {
  const { getCollection } = await import("astro:content");
  const projects = await getCollection("projects", ({ data }) => !data.draft);
  return sortProjects(projects);
}
