<script setup lang="ts">
import CardView from "@/components/CardView.vue";
import { onMounted, ref } from "vue";
import zxLogo from "@/assets/zx.svg";
import BioHereLogo from "@/assets/projects/bio-here.png";
import SeqHereLogo from "@/assets/projects/seq-here.png";
import PlacecareLogo from "@/assets/projects/placecare.png";
import ReminexLogo from "@/assets/projects/reminex.png";

// 有趣的小项目
const somethingFun = [
  {
    title: "好玩的标签",
    link: "https://hizhixia.site",
    description: "这只是一个标签喵^w^",
    tags: ["fun", "ui"],
  },
  {
    title: "Unicode-Emoji Copy😼",
    link: "/fun/unicode-emoji",
    description: "Unicode Emoji Chars ( AI generated )",
    tags: ["unicode", "emoji", "tool"],
  },
  {
    title: "社保缴纳计算😼",
    link: "/fun/social-insurance",
    description: "Social Insurance Count( AI generated )",
    tags: ["social-insurance", "job", "tool"],
  },
  {
    title: "X-Lottery🎲",
    link: "/fun/x-lottery",
    description: "X (Twitter) 评论抽奖工具",
    tags: ["lottery", "x", "twitter", "tool"],
  },
];

// 主要项目
const activeProjects = [
  {
    title: "bio-here",
    githubRepo: "bio-here/bio-here",
    link: "https://bio-here.github.io/",
    description: "A series of bioinformatics tools",
    image: BioHereLogo, // 每个项目使用不同的图片
    tags: ["Rust", "bioinformatics"],
  },
  {
    title: "bio-here/seq-here",
    githubRepo: "bio-here/seq-here",
    link: "https://bio-here.github.io/seq-here",
    description: "A fast tool for bio-sequence processing",
    image: SeqHereLogo,
    tags: ["Rust", "bioinformatics", "cli", "linux", "windows"],
  },
  {
    title: "bio-here/placecare",
    githubRepo: "bio-here/placecare",
    link: "https://bio-here.github.io/zh/project/placecare.html",
    description:
      "A tool for cis-acting regulatory elements search, based on PLACE",
    image: PlacecareLogo,
    tags: [
      "Rust",
      "bioinformatics",
      "cli",
      "linux",
      "windows",
      "PLACE",
      "string search",
    ],
  },
    {
    title: "Reminex",
    githubRepo: "zxzxovo/reminex",
    link: "https://zxzxovo.github.io/reminex",
    description: "A fast tool for bio-sequence processing",
    image: ReminexLogo,
    tags: ["Rust", "File Search", "cli", "Web", "NAS Indexing"],
  },
];

// 图片加载错误状态
const imageErrors = ref<Record<string, boolean>>({});

// 处理图片加载错误
const handleImageError = (projectTitle: string) => {
  imageErrors.value[projectTitle] = true;
};

// More标签弹框状态
const showMoreTags = ref<Record<string, boolean>>({});
const maxVisibleTags = 3; // 最多显示3个标签

// 获取可见的标签
const getVisibleTags = (tags: string[]) => {
  return tags.slice(0, maxVisibleTags);
};

// 检查是否有更多标签
const hasMoreTags = (tags: string[]) => {
  return tags.length > maxVisibleTags;
};

// 切换More弹框显示
const toggleMoreTags = (projectTitle: string) => {
  showMoreTags.value[projectTitle] = !showMoreTags.value[projectTitle];
};

// 关闭More弹框
const closeMoreTags = (projectTitle: string) => {
  showMoreTags.value[projectTitle] = false;
};

// 获取标签颜色
const getTagColor = (tag: string) => {
  const colorMap: Record<string, string> = {
    rust: "#ff5722",
    bioinformatics: "#26A69A",
    cli: "#2196f3",
    linux: "#455A64",
    windows: "#42A5F5",
    tauri: "#9c27b0",
    tool: "#795548",
    installation: "#ff9800",
    software: "#3f51b5",
    place: "#4CAF50",
    "string search": "#9E9E9E",
    fun: "#E91E63",
    ui: "#FF9800",
    unicode: "#673AB7",
    emoji: "#FFC107",
    lottery: "#9C27B0",
    x: "#000000",
    twitter: "#1DA1F2",
    "social-insurance": "#4CAF50",
    job: "#FF5722",
  };

  return colorMap[tag.toLowerCase()] || "#5C6BC0";
};

// 图片懒加载设置
const setupLazyLoading = () => {
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute("data-src");
          }
          observer.unobserve(img);
        }
      });
    });

    // 延迟执行以确保DOM已更新
    setTimeout(() => {
      document.querySelectorAll(".project-image img").forEach((img) => {
        imageObserver.observe(img);
      });
    }, 300);
  }
};

onMounted(() => {
  setupLazyLoading();
});
</script>

<template>
  <div class="bg-gray-50 dark:bg-zinc-900 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- 主要项目部分 -->
      <section class="mb-12">
        <h2
          class="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center"
        >
          主要项目
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardView
            v-for="(project, index) in activeProjects"
            :key="index"
            class="hover:shadow-xl"
            css-width="w-full"
            padding="p-0"
          >
            <div class="flex flex-col h-full">
              <!-- 项目图片 -->
              <div
                class="relative h-40 bg-white dark:bg-zinc-800 overflow-hidden rounded-t-xl project-image border-b border-gray-200 dark:border-neutral-700"
              >
                <img
                  v-if="!imageErrors[project.title]"
                  :src="project.image"
                  :alt="project.title"
                  class="w-full h-full object-contain p-4"
                  loading="lazy"
                  @error="handleImageError(project.title)"
                />
                <!-- 默认图片 -->
                <img
                  v-else
                  :src="zxLogo"
                  :alt="project.title"
                  class="w-full h-full object-contain p-4"
                />
              </div>

              <!-- 项目信息 -->
              <div class="p-6 flex flex-col gap-3 flex-1 text-left">
                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-white leading-tight text-left"
                >
                  {{ project.title }}
                </h3>

                <a
                  :href="`https://github.com/${project.githubRepo}`"
                  target="_blank"
                  class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200 w-fit text-left"
                  title="查看 GitHub 仓库"
                >
                  <svg
                    class="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
                    />
                  </svg>
                  <span class="truncate">{{ project.githubRepo }}</span>
                </a>

                <p
                  class="text-gray-600 dark:text-gray-300 leading-relaxed text-sm flex-1 text-left"
                >
                  {{ project.description }}
                </p>

                <!-- 标签 -->
                <div class="relative flex flex-wrap gap-2 justify-start items-center">
                  <span
                    v-for="(tag, tagIndex) in getVisibleTags(project.tags)"
                    :key="tagIndex"
                    class="px-2 py-1 rounded-full text-xs text-white font-medium"
                    :style="{ backgroundColor: getTagColor(tag) }"
                  >
                    {{ tag }}
                  </span>
                  
                  <!-- More按钮 -->
                  <button
                    v-if="hasMoreTags(project.tags)"
                    @click="toggleMoreTags(project.title)"
                    class="px-2 py-1 rounded-full text-xs font-medium bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    +{{ project.tags.length - maxVisibleTags }} More
                  </button>

                  <!-- 弹出浮框 -->
                  <div
                    v-if="showMoreTags[project.title]"
                    class="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[250px] max-w-[400px]"
                    @click.stop
                  >
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="text-sm font-semibold text-gray-900 dark:text-white">所有标签</h4>
                      <button
                        @click="closeMoreTags(project.title)"
                        class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="(tag, tagIndex) in project.tags"
                        :key="tagIndex"
                        class="px-2 py-1 rounded-full text-xs text-white font-medium"
                        :style="{ backgroundColor: getTagColor(tag) }"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 点击外部关闭浮框的遮罩 -->
                <div
                  v-if="showMoreTags[project.title]"
                  class="fixed inset-0 z-40"
                  @click="closeMoreTags(project.title)"
                ></div>

                <!-- 操作按钮 -->
                <div class="flex gap-3 mt-4 justify-start">
                  <a
                    :href="project.link"
                    target="_blank"
                    class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium text-sm transition-all duration-200 hover:bg-blue-700 dark:hover:bg-blue-600 hover:transform hover:-translate-y-0.5"
                  >
                    🔗 访问
                  </a>
                  <a
                    :href="`https://github.com/${project.githubRepo}`"
                    target="_blank"
                    class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-all duration-200 hover:bg-gray-300 dark:hover:bg-zinc-600 hover:transform hover:-translate-y-0.5"
                  >
                    📁 源码
                  </a>
                </div>
              </div>
            </div>
          </CardView>
        </div>
      </section>

      <!-- 有趣的小项目部分 -->
      <section class="mb-12">
        <h2
          class="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center"
        >
          有趣的小项目
        </h2>
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <CardView
            v-for="(project, index) in somethingFun"
            :key="index"
            class="transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
            css-width="w-full"
            padding="p-6"
          >
            <div class="text-center">
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-3"
              >
                {{ project.title }}
              </h3>
              <p
                class="text-gray-600 dark:text-gray-300 leading-relaxed text-sm mb-4"
              >
                {{ project.description }}
              </p>

              <!-- 标签 -->
              <div class="flex flex-wrap justify-center gap-2 mb-4">
                <span
                  v-for="(tag, tagIndex) in project.tags"
                  :key="tagIndex"
                  class="px-2 py-1 rounded-full text-xs text-white font-medium"
                  :style="{ backgroundColor: getTagColor(tag) }"
                >
                  {{ tag }}
                </span>
              </div>

              <a
                :href="project.link"
                class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium text-sm transition-all duration-200 hover:text-blue-700 dark:hover:text-blue-300 hover:transform hover:translate-x-1"
              >
                探索 →
              </a>
            </div>
          </CardView>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 保留必要的样式以确保懒加载正常工作 */
</style>
