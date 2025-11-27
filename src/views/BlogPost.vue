<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import CardView from "@/components/CardView.vue";
import { renderMarkdownWithTOC, type TableOfContent } from "@/utils/markdown";
import { useSEO } from "@/composables/useSEO";
import type { BlogPost } from "@/types";
import { devLog } from "@/utils/logger";

// 路由和响应式数据
const route = useRoute();
const router = useRouter();
const { setBlogPostSEO } = useSEO();
const isLoading = ref(true);
const loadError = ref<string | null>(null);
const currentPost = ref<BlogPost | null>(null);
const relatedPosts = ref<BlogPost[]>([]);
const allPosts = ref<BlogPost[]>([]);
const tableOfContents = ref<TableOfContent[]>([]);
const activeHeadingId = ref<string>(""); // 当前活跃的标题ID
const scrollY = ref<number>(0); // 滚动位置
const renderedContent = ref<string>(""); // 渲染后的HTML内容

// 响应式设计状态
const isLeftSidebarOpen = ref(false);
const isRightSidebarOpen = ref(false);
const isMobile = ref(false);

// 明暗主题切换功能
function setTheme(theme: string | null) {
  const finalTheme = theme || "light"; // 默认为 light 主题
  localStorage.setItem("darkTheme", finalTheme);
  document.documentElement.setAttribute("data-theme", finalTheme);

  // 同时设置 class 以确保 Tailwind 暗色模式生效
  if (finalTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

const changeDayLight = () => {
  const now = document.documentElement.getAttribute("data-theme");
  setTheme(now === "dark" ? "light" : "dark");

  // 主题切换后重新加载评论以应用新主题
  if (currentPost.value) {
    setTimeout(() => {
      loadGiscus();
    }, 100);
  }
};

// 检测屏幕尺寸
function checkScreenSize() {
  isMobile.value = window.innerWidth < 1024; // lg 断点

  // 在大屏幕上默认显示侧边栏，小屏幕上默认隐藏
  if (!isMobile.value) {
    isLeftSidebarOpen.value = true;
    isRightSidebarOpen.value = true;
  } else {
    isLeftSidebarOpen.value = false;
    isRightSidebarOpen.value = false;
  }
}

// 切换侧边栏状态
const toggleLeftSidebar = () => {
  isLeftSidebarOpen.value = !isLeftSidebarOpen.value;
};

const toggleRightSidebar = () => {
  isRightSidebarOpen.value = !isRightSidebarOpen.value;
};

// 关闭侧边栏（用于移动端点击内容区域时）
const closeSidebars = () => {
  if (isMobile.value) {
    isLeftSidebarOpen.value = false;
    isRightSidebarOpen.value = false;
  }
};

// 防抖加载，避免快速连续的路由变化导致重复加载
let loadingTimeout: ReturnType<typeof setTimeout> | null = null;

// 计算属性
const postSlug = computed(() => route.params.slug as string);

// 获取标签颜色
const getTagColor = (tag: string) => {
  // 预定义的特殊标签颜色
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

  // 如果有预定义颜色，直接返回
  if (colorMap[tag.toLowerCase()]) {
    return colorMap[tag.toLowerCase()];
  }

  // 为其他标签自动分配颜色
  // 使用丰富的颜色调色板
  const colorPalette = [
    "#3B82F6", // blue-500
    "#10B981", // green-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#06B6D4", // cyan-500
    "#6366F1", // indigo-500
    "#F97316", // orange-500
    "#14B8A6", // teal-500
    "#A855F7", // purple-500
    "#84CC16", // lime-500
    "#F43F5E", // rose-500
    "#0EA5E9", // sky-500
    "#22D3EE", // cyan-400
    "#FB923C", // orange-400
    "#34D399", // emerald-400
    "#FBBF24", // amber-400
    "#A78BFA", // violet-400
    "#F472B6", // pink-400
  ];

  // 基于标签字符串生成一个稳定的哈希值
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // 使用哈希值选择颜色
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
};

// Giscus 评论系统
function loadGiscus() {
  // 清除现有的评论
  const container = document.getElementById("giscus-container");
  if (container) {
    container.innerHTML = "";
  }

  // 获取当前主题
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const giscusTheme = currentTheme === "dark" ? "dark" : "light";

  // 创建 script 标签
  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.setAttribute("data-repo", "zxzxovo/zxzxovo.github.io");
  script.setAttribute("data-repo-id", "R_kgDONxTewg");
  script.setAttribute("data-category", "Announcements");
  script.setAttribute("data-category-id", "DIC_kwDONxTews4CmeWX");
  script.setAttribute("data-mapping", "pathname");
  script.setAttribute("data-strict", "0");
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "top");
  script.setAttribute("data-theme", giscusTheme);
  script.setAttribute("data-lang", "zh-CN");
  script.setAttribute("data-loading", "lazy");
  script.setAttribute("crossorigin", "anonymous");
  script.async = true;

  // 将 script 添加到容器中
  if (container) {
    container.appendChild(script);
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// 找到相关文章
const findRelatedPosts = (post: BlogPost) => {
  if (!post) return [];

  const related = allPosts.value
    .filter((p) => p.slug !== post.slug && !p.draft)
    .map((p) => {
      let score = 0;

      // 根据共同标签计算相关性
      post.tags.forEach((tag) => {
        if (p.tags.includes(tag)) score += 2;
      });

      // 根据共同分类计算相关性
      post.categories.forEach((category) => {
        if (p.categories.includes(category)) score += 1;
      });

      return { post: p, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.post);

  return related;
};

// 跳转到其他文章
const goToPost = (slug: string) => {
  // 直接跳转，路由监听器会自动处理数据加载
  router.push(`/blog/${slug}`);
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 滚动到目录项
const scrollToHeading = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    // 更新地址栏Hash
    globalThis.history.pushState(null, "", `#${id}`);
    // 平滑滚动到目标元素
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// 分享到 Twitter
const shareToTwitter = () => {
  if (currentPost.value) {
    const text = `${currentPost.value.title} - ${currentPost.value.description}`;
    const url = globalThis.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    globalThis.open(twitterUrl, "_blank");
  }
};

// 复制链接
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(globalThis.location.href);
    alert("链接已复制到剪贴板！");
  } catch (err) {
    const textArea = document.createElement("textarea");
    textArea.value = globalThis.location.href;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    alert("链接已复制到剪贴板！");
  }
};

// 带防抖的加载文章数据函数
const debouncedLoadPostData = () => {
  // 清除之前的timeout
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
  }

  // 设置新的timeout
  loadingTimeout = setTimeout(() => {
    loadPostData();
  }, 100); // 100ms防抖延迟
};

// 加载文章数据
const loadPostData = async () => {
  try {
    isLoading.value = true;
    loadError.value = null;

    devLog("正在加载文章:", postSlug.value);

    // 首先加载所有文章数据
    const response = await fetch("/posts.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const postsData = await response.json();
    allPosts.value = postsData.posts;

    // 找到当前文章
    const post = allPosts.value.find((p) => p.slug === postSlug.value);
    if (!post) {
      throw new Error("文章未找到");
    }

    // 加载文章内容
    const contentResponse = await fetch(`/posts/${post.slug}/index.md`);
    if (!contentResponse.ok) {
      throw new Error(
        `文章内容加载失败: ${contentResponse.status} ${contentResponse.statusText}`,
      );
    }

    const contentText = await contentResponse.text();

    // 解析 frontmatter 和内容
    const frontmatterMatch = contentText.match(
      /^\+\+\+\n([\s\S]*?)\n\+\+\+\n([\s\S]*)$/,
    );
    if (frontmatterMatch) {
      const content = frontmatterMatch[2].trim();
      currentPost.value = {
        ...post,
        content: content || post.description,
      };
    } else {
      currentPost.value = {
        ...post,
        content: contentText || post.description,
      };
    }

    if (!currentPost.value?.content) {
      throw new Error("文章内容为空");
    }


    // 处理Markdown内容并生成目录和HTML
    const { html, toc } = await renderMarkdownWithTOC(
      currentPost.value.content,
    );
    renderedContent.value = html;
    tableOfContents.value = toc;

    // 设置SEO meta标签
    setBlogPostSEO({
      title: currentPost.value.title,
      description: currentPost.value.description,
      date: currentPost.value.date,
      lastModified: currentPost.value.lastModified,
      tags: currentPost.value.tags,
      slug: currentPost.value.slug,
      image: currentPost.value.image,
    });

    // 找到相关文章
    relatedPosts.value = findRelatedPosts(currentPost.value);

    // 内容加载完成后，设置滚动监听
    setTimeout(() => {
      if (tableOfContents.value.length > 0) {
        setupScrollListener();
      }
    }, 500);
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : "加载失败";
  } finally {
    isLoading.value = false;
  }
};

// 滚动监听相关函数
function updateActiveHeading() {
  if (tableOfContents.value.length === 0) return;

  // 使用 Intersection Observer API 获取更准确的可见性
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);

      if (visibleEntries.length > 0) {
        // 按照距离顶部的距离排序，取最接近顶部的元素
        const sortedEntries = visibleEntries.sort((a, b) => {
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });

        const activeElement = sortedEntries[0];
        const activeId = activeElement.target.id;

        if (activeId && activeHeadingId.value !== activeId) {
          activeHeadingId.value = activeId;
        }
      }
    },
    {
      root: null,
      rootMargin: "-20% 0px -70% 0px", // 只有当标题在视口上方20%-30%区域时才被认为是活跃的
      threshold: [0, 0.1, 1],
    },
  );

  // 观察所有标题元素
  tableOfContents.value.forEach((item) => {
    const element = document.getElementById(item.id);
    if (element) {
      observer.observe(element);
    }
  });

  // 保存observer实例以便后续清理
  (globalThis as any).headingObserver = observer;
}

// 替代的基于scrollY的高亮方法（作为fallback）
function updateActiveHeadingByScroll() {
  if (tableOfContents.value.length === 0) return;

  const headings = tableOfContents.value
    .map((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        return {
          id: item.id,
          top: rect.top + globalThis.scrollY,
          offsetTop: rect.top,
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{ id: string; top: number; offsetTop: number }>;

  if (headings.length === 0) return;

  // 找到当前视口中最合适的标题
  const viewportMiddle = globalThis.innerHeight * 0.3; // 视口上方30%位置
  let activeHeading = headings[0];

  for (const heading of headings) {
    // 如果标题在视口上方30%以上，则认为是当前活跃标题
    if (heading.offsetTop <= viewportMiddle) {
      activeHeading = heading;
    } else {
      break;
    }
  }

  if (activeHeading && activeHeadingId.value !== activeHeading.id) {
    activeHeadingId.value = activeHeading.id;
  }
}

let scrollTimeout: number | null = null;
function handleScroll() {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  scrollY.value = globalThis.scrollY;

  // 使用防抖的scroll-based方法作为备用
  scrollTimeout = globalThis.setTimeout(() => {
    updateActiveHeadingByScroll();
  }, 50); // 减少防抖延迟以提高响应性
}

// 监听滚动事件
function setupScrollListener() {
  removeScrollListener();

  // 总是添加scroll监听来处理相关文章位置和目录高亮
  globalThis.addEventListener("scroll", handleScroll, { passive: true });

  // 优先使用 Intersection Observer 处理目录高亮
  if ("IntersectionObserver" in globalThis) {
    updateActiveHeading();
  } else {
    // 降级到基于scroll的方法
    updateActiveHeadingByScroll();
  }
}

function removeScrollListener() {
  // 清理 Intersection Observer
  if ((globalThis as any).headingObserver) {
    (globalThis as any).headingObserver.disconnect();
    delete (globalThis as any).headingObserver;
  }

  // 清理scroll监听器
  globalThis.removeEventListener("scroll", handleScroll);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }
}

// 监听目录变化，设置滚动监听
watch(tableOfContents, (newToc) => {
  if (newToc.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        setupScrollListener();
      }, 300);
    });
  } else {
    removeScrollListener();
  }
});

// 监听内容变化，确保在内容渲染后重新设置监听
watch(currentPost, (newPost) => {
  if (newPost && tableOfContents.value.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        setupScrollListener();
      }, 500);
    });
  }

  // 文章内容加载完成后，初始化评论
  if (newPost) {
    nextTick(() => {
      setTimeout(() => {
        loadGiscus();
      }, 800); // 稍微延迟确保DOM完全渲染
    });
  }
});

onMounted(() => {
  // 初始化响应式设计
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);

  // 初始化主题
  setTheme(localStorage.getItem("darkTheme"));

  loadPostData();

  // 添加全局的 updateUrlHash 函数
  (globalThis as any).updateUrlHash = (id: string) => {
    if (id) {
      globalThis.history.pushState(null, "", `#${id}`);
    }
  };

  // 页面加载完成后，设置滚动监听
  setTimeout(() => {
    if (tableOfContents.value.length > 0) {
      setupScrollListener();
    }
  }, 800);
});

// 监听路由参数变化，当文章slug改变时重新加载数据
watch(
  () => route.params.slug,
  (newSlug, oldSlug) => {
    if (newSlug && newSlug !== oldSlug) {
      debouncedLoadPostData();
    }
  },
  { immediate: false },
);

// 监听完整路由路径变化，确保任何URL变化都会触发重新加载
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    if (newPath !== oldPath && newPath.startsWith("/blog/")) {
      // 确保在路由变化时重新加载数据
      debouncedLoadPostData();
    }
  },
  { immediate: false },
);

// 组件卸载时移除监听器
onUnmounted(() => {
  removeScrollListener();
  window.removeEventListener("resize", checkScreenSize);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  // 清理全局函数
  delete (globalThis as any).updateUrlHash;
});
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- 移动端顶部控制栏 -->
    <div
      class="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 px-4 py-3"
    >
      <div class="flex items-center justify-between">
        <button
          @click="goBack"
          class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2"
        >
          ← 返回博客
        </button>

        <div class="flex items-center gap-0">
          <!-- 明暗切换按钮 -->
          <button
            @click="changeDayLight"
            class="hover:bg-zinc-200 dark:hover:bg-zinc-800 size-12 flex justify-center items-center rounded-full cursor-pointer dark:rotate-180 transition-transform ease-in-out"
            title="切换主题"
          >
            <Icon icon="noto:waxing-gibbous-moon" width="20" height="20" />
          </button>

          <!-- 左侧边栏切换按钮 -->
          <button
            @click="toggleLeftSidebar"
            class="hover:bg-zinc-200 dark:hover:bg-zinc-800 size-12 flex justify-center items-center rounded-full cursor-pointer transition-all"
            :class="{ 'bg-zinc-200 dark:bg-zinc-800': isLeftSidebarOpen }"
            title="文章信息"
          >
            <Icon
              icon="streamline-plump-color:information-circle"
              width="20"
              height="20"
            />
          </button>

          <!-- 右侧边栏切换按钮（仅在有目录时显示） -->
          <button
            v-if="tableOfContents.length > 0"
            @click="toggleRightSidebar"
            class="hover:bg-zinc-200 dark:hover:bg-zinc-800 size-12 flex justify-center items-center rounded-full cursor-pointer transition-all"
            :class="{
              'bg-zinc-200 dark:bg-zinc-800': isRightSidebarOpen,
              'rotate-90': isRightSidebarOpen,
            }"
            title="文章目录"
          >
            <Icon icon="marketeq:menu" width="20" height="20" />
          </button>
        </div>
      </div>
    </div>
    <!-- 加载状态 -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center h-96 pt-20 lg:pt-0"
    >
      <div class="text-center">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-4"
        ></div>
        <p class="text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="loadError"
      class="flex items-center justify-center h-96 pt-20 lg:pt-0"
    >
      <CardView class="max-w-md mx-4">
        <div class="text-center p-6">
          <div class="text-red-500 dark:text-red-400 text-xl mb-2">❌</div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            加载失败
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-4">{{ loadError }}</p>
          <div class="space-x-2">
            <button
              @click="loadPostData"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              重试
            </button>
            <button
              @click="goBack"
              class="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-white rounded-lg transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </CardView>
    </div>

    <!-- 文章内容 -->
    <div
      v-else-if="currentPost"
      class="flex-1 py-2 sm:py-4 px-2 sm:px-4 lg:px-6 pb-8 relative pt-20 lg:pt-2"
    >
      <!-- 移动端遮罩层 -->
      <div
        v-if="isMobile && (isLeftSidebarOpen || isRightSidebarOpen)"
        @click="closeSidebars"
        class="fixed inset-0 backdrop-blur-xs backdrop-brightness-60 z-20 lg:hidden"
        :style="{ top: '61px' }"
      ></div>

      <div
        class="max-w-none mx-auto grid grid-cols-1 gap-3 lg:gap-4 relative"
        :class="
          tableOfContents.length > 0 ? 'lg:grid-cols-12' : 'lg:grid-cols-10'
        "
      >
        <!-- 左侧栏：返回按钮、文章信息、相关文章 -->
        <Transition name="sidebar-left">
          <aside
            v-if="isLeftSidebarOpen"
            class="lg:col-span-2 order-1 lg:order-1 z-30"
            :class="{
              'fixed left-0 h-full w-4/5 max-w-sm bg-white dark:bg-zinc-900 p-4 lg:relative lg:top-auto lg:w-auto lg:p-0 lg:bg-transparent dark:lg:bg-transparent':
                isMobile,
              relative: !isMobile,
            }"
            :style="
              isMobile ? { top: '61px', height: 'calc(100vh - 61px)' } : {}
            "
          >
            <div
              class="sticky top-6 h-[calc(100vh-5rem)] flex flex-col"
              :class="{ 'h-full': isMobile }"
            >
              <!-- 返回按钮 - 只在桌面端显示 -->
              <CardView v-if="!isMobile" class="p-3 flex-shrink-0 mb-4">
                <button
                  @click="goBack"
                  class="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm text-sm"
                >
                  <svg
                    class="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  返回
                </button>
              </CardView>

              <!-- 可滚动内容区域 -->
              <div
                class="flex-1 overflow-y-auto space-y-4 min-h-0 pb-2 sidebar-scroll"
              >
                <!-- 文章信息 - 移动端和桌面端都显示 -->
                <CardView class="p-3" data-article-info>
                  <h3
                    class="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center"
                  >
                    文章信息
                  </h3>

                  <!-- 发布日期 -->
                  <div class="mb-3 flex justify-center">
                    <div
                      class="flex items-center text-xs text-gray-600 dark:text-gray-400"
                    >
                      <svg
                        class="w-3 h-3 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {{ formatDate(currentPost.date) }}
                    </div>
                  </div>

                  <!-- 分类 -->
                  <div
                    v-if="currentPost.categories.length > 0"
                    class="mb-3 text-center"
                  >
                    <h4
                      class="text-xs font-medium text-gray-900 dark:text-white mb-2"
                    >
                      分类
                    </h4>
                    <div class="flex flex-wrap gap-1 justify-center">
                      <span
                        v-for="category in currentPost.categories"
                        :key="category"
                        class="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {{ category }}
                      </span>
                    </div>
                  </div>

                  <!-- 标签 -->
                  <div
                    v-if="currentPost.tags.length > 0"
                    class="mb-3 text-center"
                  >
                    <h4
                      class="text-xs font-medium text-gray-900 dark:text-white mb-2"
                    >
                      标签
                    </h4>
                    <div class="flex flex-wrap gap-1 justify-center">
                      <span
                        v-for="tag in currentPost.tags"
                        :key="tag"
                        class="px-1.5 py-0.5 text-xs rounded text-white"
                        :style="{ backgroundColor: getTagColor(tag) }"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>

                  <!-- 阅读统计 - 简化显示 -->
                  <div
                    v-if="currentPost.wordCount || currentPost.readingTime"
                    class="text-center"
                  >
                    <div
                      class="space-y-1 text-xs text-gray-600 dark:text-gray-400"
                    >
                      <div
                        v-if="currentPost.wordCount"
                        class="flex items-center justify-center"
                      >
                        <svg
                          class="w-3 h-3 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {{ currentPost.wordCount }} 字
                      </div>
                      <div
                        v-if="currentPost.readingTime"
                        class="flex items-center justify-center"
                      >
                        <svg
                          class="w-3 h-3 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {{ currentPost.readingTime }} 分钟
                      </div>
                    </div>
                  </div>
                </CardView>

                <!-- 相关文章 - 移动端和桌面端都显示 -->
                <CardView v-if="relatedPosts.length > 0" class="p-3">
                  <h3
                    class="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center"
                  >
                    相关文章
                  </h3>

                  <!-- 紧凑的列表显示 -->
                  <div class="space-y-2">
                    <div
                      v-for="post in relatedPosts"
                      :key="post.slug"
                      @click="goToPost(post.slug)"
                      class="group p-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <h4
                        class="font-medium text-xs text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight mb-1"
                      >
                        {{ post.title }}
                      </h4>
                      <time class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatDate(post.date) }}
                      </time>
                    </div>
                  </div>
                </CardView>
              </div>
            </div>
          </aside>
        </Transition>

        <!-- 主要内容区 -->
        <article
          :class="
            tableOfContents.length > 0 ? 'lg:col-span-7' : 'lg:col-span-8'
          "
          class="order-2 lg:order-2"
          @click="closeSidebars"
        >
          <CardView class="mb-4 lg:mb-8">
            <!-- 文章头部 -->
            <header
              class="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700"
            >
              <!-- 封面图片 -->
              <div v-if="currentPost.image" class="mb-4 sm:mb-6">
                <img
                  :src="currentPost.image"
                  :alt="currentPost.title"
                  class="w-full h-48 sm:h-64 object-cover rounded-lg shadow-sm"
                />
              </div>

              <!-- 标题和描述 -->
              <h1
                class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-tight"
              >
                {{ currentPost.title }}
              </h1>

              <p
                v-if="currentPost.description"
                class="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 leading-relaxed"
              >
                {{ currentPost.description }}
              </p>

              <!-- 移动端文章基本信息 -->
              <div
                class="flex flex-wrap items-center gap-3 mb-4 sm:mb-6 lg:hidden"
              >
                <time
                  class="text-sm text-gray-500 dark:text-gray-400 flex items-center"
                >
                  <svg
                    class="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {{ formatDate(currentPost.date) }}
                </time>

                <!-- 标签 -->
                <div v-if="currentPost.tags.length > 0" class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in currentPost.tags"
                    :key="tag"
                    class="px-2 py-1 text-xs rounded text-white"
                    :style="{ backgroundColor: getTagColor(tag) }"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <!-- 分享按钮 -->
              <div class="flex items-center gap-2 sm:gap-4">
                <button
                  @click="shareToTwitter"
                  class="inline-flex items-center px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <svg
                    class="w-4 h-4 mr-1 sm:mr-1.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
                    />
                  </svg>
                  <span class="hidden sm:inline">分享</span>
                </button>

                <button
                  @click="copyLink"
                  class="inline-flex items-center px-3 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <svg
                    class="w-4 h-4 mr-1 sm:mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span class="hidden sm:inline">复制链接</span>
                </button>
              </div>
            </header>

            <!-- 文章正文 -->
            <div class="p-4 sm:p-6">
              <div
                class="prose prose-sm sm:prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20 text-left overflow-x-hidden"
                v-html="renderedContent"
              ></div>

              <!-- 评论区 -->
              <div
                class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
              >
                <div id="giscus-container"></div>
              </div>
            </div>
          </CardView>
        </article>

        <!-- 右侧栏：只保留目录 -->
        <Transition name="sidebar-right">
          <aside
            v-if="tableOfContents.length > 0 && isRightSidebarOpen"
            class="lg:col-span-3 order-1 lg:order-3 z-30"
            :class="{
              'fixed right-0 h-full w-4/5 max-w-sm bg-white dark:bg-zinc-900 p-4 lg:relative lg:top-auto lg:w-auto lg:p-0 lg:bg-transparent dark:lg:bg-transparent':
                isMobile,
              relative: !isMobile,
            }"
            :style="
              isMobile ? { top: '61px', height: 'calc(100vh - 61px)' } : {}
            "
          >
            <!-- 目录 -->
            <CardView
              v-if="tableOfContents.length > 0"
              class="p-3 lg:sticky lg:top-6 h-full lg:h-auto"
            >
              <h4
                class="text-sm font-semibold text-gray-900 dark:text-white mb-3"
              >
                目录
              </h4>
              <nav
                class="text-sm max-h-[calc(100vh-12rem)] overflow-y-auto toc-scroll"
              >
                <ul class="space-y-1">
                  <li
                    v-for="item in tableOfContents"
                    :key="item.id"
                    :class="{
                      'ml-0': item.level === 1,
                      'ml-3': item.level === 2,
                      'ml-6': item.level === 3,
                      'ml-9': item.level > 3,
                    }"
                  >
                    <a
                      @click="scrollToHeading(item.id)"
                      class="block w-full text-left py-1.5 px-2 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      :class="{
                        'font-semibold text-gray-900 dark:text-white':
                          item.level === 1,
                        'font-medium text-gray-800 dark:text-gray-200':
                          item.level === 2,
                        'text-gray-700 dark:text-gray-300': item.level === 3,
                        'text-gray-600 dark:text-gray-400': item.level > 3,
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500':
                          activeHeadingId === item.id,
                      }"
                    >
                      <span
                        class="text-blue-500 dark:text-blue-400 font-mono text-xs mr-2"
                        >{{ item.sectionNumber }}</span
                      >
                      <span>{{ item.text }}</span>
                    </a>
                  </li>
                </ul>
              </nav>
            </CardView>
          </aside>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 侧边栏过渡动画 */
.sidebar-left-enter-active,
.sidebar-left-leave-active,
.sidebar-right-enter-active,
.sidebar-right-leave-active {
  transition: all 0.3s ease-in-out;
}

.sidebar-left-enter-from,
.sidebar-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.sidebar-right-enter-from,
.sidebar-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.sidebar-left-enter-to,
.sidebar-left-leave-from,
.sidebar-right-enter-to,
.sidebar-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* 移动端侧边栏在固定定位时的样式调整 */
@media (max-width: 1023px) {
  .sidebar-left-enter-active,
  .sidebar-left-leave-active,
  .sidebar-right-enter-active,
  .sidebar-right-leave-active {
    transition: all 0.3s ease-in-out;
  }
}

/* 移除所有可能造成冲突的自定义样式，只保留必要的样式 */

/* Giscus 评论系统样式 */
:deep(.giscus) {
  max-width: 100%;
}

:deep(.giscus-frame) {
  width: 100%;
  border: none;
  border-radius: 0.5rem;
}
</style>
