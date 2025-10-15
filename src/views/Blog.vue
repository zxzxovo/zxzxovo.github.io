<script setup lang="ts">
import { ref, computed, onMounted, watch, onActivated } from "vue";
import { useRouter, useRoute } from "vue-router";
import CardView from "@/components/CardView.vue";
import LoadingState from "@/components/LoadingState.vue";
import ErrorBoundary from "@/components/ErrorBoundary.vue";
import { fetchPosts } from "@/services/api";
import { useAsyncState } from "@/composables/useAsyncState";
import type { PostsData, BlogPost } from "@/types";

const router = useRouter();
const route = useRoute();

// 使用异步状态管理文章数据
const {
  data: postsData,
  isLoading,
  error: loadError,
  execute: loadPosts
} = useAsyncState<PostsData>();

// 计算属性：所有文章
const allPosts = computed(() => postsData.value?.posts || []);

// 图片加载状态
const imageLoadStates = ref<
  Record<string, { loaded: boolean; error: boolean }>
>({});

// 分页状态
const currentPage = ref(1);
const postsPerPage = 6;

// 筛选状态
const selectedCategory = ref("");
const selectedTag = ref("");
const selectedYear = ref("");

// 移动端筛选面板状态
const showMobileFilters = ref(false);

// 计算属性
const publishedPosts = computed(() =>
  allPosts.value.filter((post) => !post.draft),
);

const categories = computed(() => {
  const cats = new Set<string>();
  publishedPosts.value.forEach((post) => {
    post.categories.forEach((cat) => cats.add(cat));
  });
  return Array.from(cats).sort();
});

const tags = computed(() => {
  const tagSet = new Set<string>();
  publishedPosts.value.forEach((post) => {
    post.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
});

const years = computed(() => {
  const yearSet = new Set<string>();
  publishedPosts.value.forEach((post) => {
    const year = new Date(post.date).getFullYear().toString();
    yearSet.add(year);
  });
  return Array.from(yearSet).sort().reverse();
});

const filteredPosts = computed(() => {
  let filtered = publishedPosts.value;

  if (selectedCategory.value) {
    filtered = filtered.filter((post) =>
      post.categories.includes(selectedCategory.value),
    );
  }

  if (selectedTag.value) {
    filtered = filtered.filter((post) => post.tags.includes(selectedTag.value));
  }

  if (selectedYear.value) {
    filtered = filtered.filter(
      (post) =>
        new Date(post.date).getFullYear().toString() === selectedYear.value,
    );
  }

  return filtered.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
});

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage;
  const end = start + postsPerPage;
  const posts = filteredPosts.value.slice(start, end);

  // 为每个文章初始化图片状态
  posts.forEach((post) => {
    if (!imageLoadStates.value[post.slug]) {
      imageLoadStates.value[post.slug] = { loaded: false, error: false };
    }
  });

  return posts;
});

const totalPages = computed(() =>
  Math.ceil(filteredPosts.value.length / postsPerPage),
);

// 获取标签颜色
const getTagColor = (tag: string) => {
  const colorMap: Record<string, string> = {
    daily: "#10B981",
    code: "#3B82F6",
    rust: "#FF5722",
    android: "#4CAF50",
    git: "#F97316",
    tauri: "#9C27B0",
    gui: "#6366F1",
    教程: "#059669",
    诗歌: "#EC4899",
    呓语: "#8B5CF6",
    散文诗类似体: "#EF4444",
    小诗: "#F59E0B",
  };

  return colorMap[tag.toLowerCase()] || "#6B7280";
};

// 获取默认图片
const getDefaultImage = (post: BlogPost) => {
  // 根据分类返回不同的默认图片
  const defaultImages = {
    code: "/defaults/code.svg",
    daily: "/defaults/daily.svg",
    rust: "/defaults/rust.svg",
    android: "/defaults/code.svg",
    git: "/defaults/code.svg",
    tauri: "/defaults/rust.svg",
    gui: "/defaults/code.svg",
    教程: "/defaults/code.svg",
    诗歌: "/defaults/default.svg",
    呓语: "/defaults/default.svg",
    散文诗类似体: "/defaults/default.svg",
    小诗: "/defaults/default.svg",
    default: "/defaults/default.svg",
  };

  // 检查是否匹配任何分类
  for (const category of post.categories) {
    if (defaultImages[category.toLowerCase() as keyof typeof defaultImages]) {
      return defaultImages[
        category.toLowerCase() as keyof typeof defaultImages
      ];
    }
  }

  return defaultImages.default;
};

// 处理图片加载
const handleImageLoad = (slug: string) => {
  imageLoadStates.value[slug] = { loaded: true, error: false };
};

const handleImageError = (slug: string) => {
  imageLoadStates.value[slug] = { loaded: false, error: true };
};

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// 清除筛选
const clearFilters = () => {
  selectedCategory.value = "";
  selectedTag.value = "";
  selectedYear.value = "";
  currentPage.value = 1;
  showMobileFilters.value = false; // 关闭移动端筛选面板
};

// 跳转到文章详情
const goToPost = (slug: string) => {
  // 保存当前的筛选状态到sessionStorage，以便返回时恢复
  const currentState = {
    selectedCategory: selectedCategory.value,
    selectedTag: selectedTag.value,
    selectedYear: selectedYear.value,
    currentPage: currentPage.value,
  };
  sessionStorage.setItem("blog-filter-state", JSON.stringify(currentState));

  // 跳转到文章详情页
  router.push(`/blog/${slug}`);
};

// 加载文章数据
const loadPostsData = async () => {
  await loadPosts(() => fetchPosts());
};

// 恢复筛选状态
const restoreFilterState = () => {
  try {
    const savedState = sessionStorage.getItem("blog-filter-state");
    if (savedState) {
      const state = JSON.parse(savedState);
      selectedCategory.value = state.selectedCategory || "";
      selectedTag.value = state.selectedTag || "";
      selectedYear.value = state.selectedYear || "";
      currentPage.value = state.currentPage || 1;

      // 恢复后清除保存的状态
      sessionStorage.removeItem("blog-filter-state");
    }
  } catch (error) {
    console.warn("恢复筛选状态失败:", error);
  }
};

onMounted(() => {
  // 先恢复筛选状态，再加载数据
  restoreFilterState();
  loadPostsData();
});

// 监听路由变化，处理从文章详情页返回的情况
watch(
  () => route.path,
  (newPath, oldPath) => {
    // 如果当前路由是博客列表页
    if (newPath === "/blog" || newPath.startsWith("/blog?")) {
      // 如果之前的路由是文章详情页，则恢复筛选状态
      if (oldPath?.startsWith("/blog/")) {
        restoreFilterState();
      }

      // 如果文章数据为空，重新加载
      if (allPosts.value.length === 0) {
        loadPostsData();
      }
    }
  },
  { immediate: false },
);

// 处理组件激活时的情况（用于keep-alive缓存的组件）
onActivated(() => {
  // 如果文章数据为空或者有错误，重新加载
  if (allPosts.value.length === 0 || loadError.value) {
    loadPostsData();
  }
});
</script>

<template>
  <div class="bg-gray-50 dark:bg-zinc-900 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- 加载状态 -->
      <LoadingState v-if="isLoading" text="正在加载文章..." />

      <!-- 错误状态 -->
      <ErrorBoundary 
        v-else-if="loadError" 
        :error="loadError"
        @retry="loadPostsData"
      />

      <!-- 主要内容 -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- 移动端筛选按钮 -->
        <div class="lg:hidden mb-6">
          <button
            @click="showMobileFilters = !showMobileFilters"
            :class="[
              'w-full flex items-center justify-between px-4 py-3 border rounded-lg shadow-sm transition-all duration-200',
              selectedCategory || selectedTag || selectedYear
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900'
                : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700',
            ]"
          >
            <div class="flex items-center gap-2">
              <svg
                class="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                ></path>
              </svg>
              <span class="font-medium text-gray-900 dark:text-white"
                >筛选条件</span
              >
              <div
                v-if="selectedCategory || selectedTag || selectedYear"
                class="flex items-center gap-1"
              >
                <span
                  class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                >
                  {{
                    [selectedCategory, selectedTag, selectedYear].filter(
                      Boolean,
                    ).length
                  }}
                </span>
              </div>
            </div>
            <svg
              class="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform"
              :class="{ 'rotate-180': showMobileFilters }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          <!-- 移动端筛选面板 -->
          <transition name="filter-panel">
            <div
              v-show="showMobileFilters"
              class="mt-4 p-4 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-lg space-y-6 mobile-filter-panel"
            >
              <!-- 统计信息 -->
              <div>
                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center"
                >
                  <span class="mr-2">📊</span>
                  统计
                </h3>
                <div class="grid grid-cols-3 gap-4">
                  <div class="text-center">
                    <div
                      class="text-lg font-bold text-blue-600 dark:text-blue-400"
                    >
                      {{ publishedPosts.length }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      文章
                    </div>
                  </div>
                  <div class="text-center">
                    <div
                      class="text-lg font-bold text-orange-600 dark:text-orange-400"
                    >
                      {{ categories.length }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      分类
                    </div>
                  </div>
                  <div class="text-center">
                    <div
                      class="text-lg font-bold text-green-600 dark:text-green-400"
                    >
                      {{ tags.length }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      标签
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分类选择 -->
              <div>
                <h3
                  class="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center"
                >
                  <span class="mr-2">📂</span>
                  分类
                </h3>
                <select
                  v-model="selectedCategory"
                  @change="currentPage = 1"
                  class="w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">
                    全部分类 ({{ publishedPosts.length }})
                  </option>
                  <option
                    v-for="category in categories"
                    :key="category"
                    :value="category"
                  >
                    {{ category }} ({{
                      publishedPosts.filter((post: BlogPost) =>
                        post.categories.includes(category),
                      ).length
                    }})
                  </option>
                </select>
              </div>

              <!-- 年份选择 -->
              <div>
                <h3
                  class="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center"
                >
                  <span class="mr-2">📅</span>
                  年份
                </h3>
                <select
                  v-model="selectedYear"
                  @change="currentPage = 1"
                  class="w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">全部年份</option>
                  <option v-for="year in years" :key="year" :value="year">
                    {{ year }} ({{
                      publishedPosts.filter(
                        (post: BlogPost) =>
                          new Date(post.date).getFullYear().toString() === year,
                      ).length
                    }})
                  </option>
                </select>
              </div>

              <!-- 热门标签 -->
              <div>
                <h3
                  class="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center"
                >
                  <span class="mr-2">🏷️</span>
                  标签
                </h3>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="tag in tags.slice(0, 12)"
                    :key="tag"
                    @click="
                      selectedTag = selectedTag === tag ? '' : tag;
                      currentPage = 1;
                    "
                    class="px-3 py-1 rounded-full text-xs font-medium text-white transition-all duration-200 hover:transform hover:scale-105"
                    :style="{ backgroundColor: getTagColor(tag) }"
                    :class="
                      selectedTag === tag
                        ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-zinc-800'
                        : ''
                    "
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>

              <!-- 清除筛选按钮 -->
              <div
                v-if="selectedCategory || selectedTag || selectedYear"
                class="pt-2"
              >
                <button
                  @click="clearFilters"
                  class="w-full px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg font-medium transition-colors duration-200 hover:bg-red-200 dark:hover:bg-red-800"
                >
                  清除筛选
                </button>
              </div>
            </div>
          </transition>
        </div>

        <!-- 桌面端侧边栏筛选 -->
        <div class="lg:col-span-1 space-y-6 hidden lg:block">
          <!-- 统计信息 -->
          <CardView>
            <div class="p-6">
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <span class="mr-2">📊</span>
                博客统计
              </h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">总文章</span>
                  <span class="font-semibold text-blue-600 dark:text-blue-400">
                    {{ publishedPosts.length }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">分类</span>
                  <span
                    class="font-semibold text-orange-600 dark:text-orange-400"
                  >
                    {{ categories.length }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">标签</span>
                  <span
                    class="font-semibold text-green-600 dark:text-green-400"
                  >
                    {{ tags.length }}
                  </span>
                </div>
              </div>
            </div>
          </CardView>

          <!-- 分类筛选 -->
          <CardView>
            <div class="p-6">
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <span class="mr-2">📂</span>
                分类
              </h3>
              <div class="space-y-2">
                <button
                  @click="
                    selectedCategory = '';
                    currentPage = 1;
                  "
                  :class="[
                    'w-full text-left px-3 py-2 rounded-lg transition-colors duration-200',
                    selectedCategory === ''
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300',
                  ]"
                >
                  全部 ({{ publishedPosts.length }})
                </button>
                <button
                  v-for="category in categories"
                  :key="category"
                  @click="
                    selectedCategory = category;
                    currentPage = 1;
                  "
                  :class="[
                    'w-full text-left px-3 py-2 rounded-lg transition-colors duration-200',
                    selectedCategory === category
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300',
                  ]"
                >
                  {{ category }} ({{
                    publishedPosts.filter((post: BlogPost) =>
                      post.categories.includes(category),
                    ).length
                  }})
                </button>
              </div>
            </div>
          </CardView>

          <!-- 年份归档 -->
          <CardView>
            <div class="p-6">
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <span class="mr-2">📅</span>
                年份归档
              </h3>
              <div class="space-y-2">
                <button
                  @click="
                    selectedYear = '';
                    currentPage = 1;
                  "
                  :class="[
                    'w-full text-left px-3 py-2 rounded-lg transition-colors duration-200',
                    selectedYear === ''
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300',
                  ]"
                >
                  全部年份
                </button>
                <button
                  v-for="year in years"
                  :key="year"
                  @click="
                    selectedYear = year;
                    currentPage = 1;
                  "
                  :class="[
                    'w-full text-left px-3 py-2 rounded-lg transition-colors duration-200',
                    selectedYear === year
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300',
                  ]"
                >
                  {{ year }} ({{
                    publishedPosts.filter(
                      (post: BlogPost) =>
                        new Date(post.date).getFullYear().toString() === year,
                    ).length
                  }})
                </button>
              </div>
            </div>
          </CardView>

          <!-- 热门标签 -->
          <CardView>
            <div class="p-6">
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <span class="mr-2">🏷️</span>
                热门标签
              </h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in tags.slice(0, 12)"
                  :key="tag"
                  @click="
                    selectedTag = selectedTag === tag ? '' : tag;
                    currentPage = 1;
                  "
                  class="px-3 py-1 rounded-full text-xs font-medium text-white transition-all duration-200 hover:transform hover:scale-105"
                  :style="{ backgroundColor: getTagColor(tag) }"
                  :class="
                    selectedTag === tag
                      ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-zinc-900'
                      : ''
                  "
                >
                  {{ tag }}
                </button>
              </div>
            </div>
          </CardView>

          <!-- 清除筛选 -->
          <div v-if="selectedCategory || selectedTag || selectedYear">
            <button
              @click="clearFilters"
              class="w-full px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg font-medium transition-colors duration-200 hover:bg-red-200 dark:hover:bg-red-800"
            >
              清除筛选
            </button>
          </div>
        </div>

        <!-- 主内容区 -->
        <div class="lg:col-span-3">
          <!-- 文章列表 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <CardView
              v-for="post in paginatedPosts"
              :key="post.slug"
              class="transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl cursor-pointer"
              @click="goToPost(post.slug)"
            >
              <div class="flex flex-col h-full">
                <!-- 文章图片 -->
                <div
                  class="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-800 overflow-hidden rounded-t-xl"
                >
                  <!-- 加载占位符 -->
                  <div
                    v-if="
                      !imageLoadStates[post.slug]?.loaded &&
                      !imageLoadStates[post.slug]?.error
                    "
                    class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-zinc-700"
                  >
                    <div class="animate-pulse">
                      <div
                        class="w-12 h-12 bg-gray-300 dark:bg-zinc-600 rounded-full flex items-center justify-center"
                      >
                        <svg
                          class="w-6 h-6 text-gray-400 dark:text-zinc-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <!-- 实际图片 -->
                  <img
                    v-show="imageLoadStates[post.slug]?.loaded"
                    :src="post.image || getDefaultImage(post)"
                    :alt="post.title"
                    class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    loading="lazy"
                    @load="handleImageLoad(post.slug)"
                    @error="handleImageError(post.slug)"
                  />

                  <!-- 错误时显示默认图片 -->
                  <img
                    v-show="imageLoadStates[post.slug]?.error"
                    :src="getDefaultImage(post)"
                    :alt="post.title"
                    class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    @load="handleImageLoad(post.slug)"
                  />
                </div>

                <!-- 文章信息 -->
                <div class="p-6 flex flex-col gap-3 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <h3
                      class="text-lg font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2"
                    >
                      {{ post.title }}
                    </h3>
                  </div>

                  <p
                    class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 flex-1"
                  >
                    {{ post.description }}
                  </p>

                  <!-- 分类和日期 -->
                  <div
                    class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2"
                  >
                    <div class="flex items-center gap-2">
                      <span>📂</span>
                      <span>{{ post.categories.join(", ") }}</span>
                    </div>
                    <span>{{ formatDate(post.date) }}</span>
                  </div>

                  <!-- 标签 -->
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in post.tags.slice(0, 4)"
                      :key="tag"
                      class="px-2 py-1 rounded-full text-xs text-white font-medium"
                      :style="{ backgroundColor: getTagColor(tag) }"
                    >
                      {{ tag }}
                    </span>
                    <span
                      v-if="post.tags.length > 4"
                      class="px-2 py-1 rounded-full text-xs bg-gray-300 dark:bg-zinc-600 text-gray-700 dark:text-gray-300"
                    >
                      +{{ post.tags.length - 4 }}
                    </span>
                  </div>
                </div>
              </div>
            </CardView>
          </div>

          <!-- 分页 -->
          <div
            v-if="totalPages > 1"
            class="flex justify-center items-center gap-2"
          >
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700"
            >
              上一页
            </button>

            <div class="flex gap-2">
              <button
                v-for="page in Math.min(totalPages, 5)"
                :key="page"
                @click="currentPage = page"
                :class="[
                  'px-4 py-2 rounded-lg transition-colors duration-200',
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700',
                ]"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700"
            >
              下一页
            </button>
          </div>

          <!-- 无结果提示 -->
          <div v-if="filteredPosts.length === 0" class="text-center py-12">
            <div class="text-6xl mb-4">📝</div>
            <h3
              class="text-xl font-semibold text-gray-900 dark:text-white mb-2"
            >
              暂无文章
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              尝试调整筛选条件或清除筛选
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 移动端筛选面板动画 */
.filter-panel-enter-active,
.filter-panel-leave-active {
  transition: all 0.3s ease;
}

.filter-panel-enter-from,
.filter-panel-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 移动端优化 */
@media (max-width: 1024px) {
  .grid.grid-cols-1:where(.lg\:grid-cols-4) {
    gap: 1rem;
  }
}

/* 确保筛选面板在移动端有正确的层级 */
.mobile-filter-panel {
  z-index: 10;
}
</style>
