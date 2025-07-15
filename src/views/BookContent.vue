<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useNavStore } from "@/stores/nav";
import SearchFrame from "@/components/SearchFrame.vue";
import {
  processMarkdownContent,
  generateTableOfContents,
  type TableOfContent,
} from "@/utils/markdown";
import type { Book } from "@/types";

// 定义章节接口
interface BookChapter {
  id: string;
  title: string;
  order: number;
  level: number;
  hasContent: boolean;
  wordCount?: number;
  children?: BookChapter[];
}

// 路由和响应式数据
const route = useRoute();
const router = useRouter();
const isLoading = ref(true);
const isContentLoading = ref(false);
const loadError = ref<string | null>(null);
const currentBook = ref<Book | null>(null);
const currentChapter = ref<BookChapter | null>(null);
const chapterContent = ref<string>("");
const allBooks = ref<Book[]>([]);
const tableOfContents = ref<TableOfContent[]>([]);
const expandedChapters = ref<Set<string>>(new Set());
const contentCache = ref<Map<string, string>>(new Map());
const activeHeadingId = ref<string>(""); // 当前活跃的标题ID

// 明暗模式和搜索功能
const navStore = useNavStore();

// 响应式设计状态
const isLeftSidebarOpen = ref(false);
const isRightSidebarOpen = ref(false);
const isMobile = ref(false);

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

// Giscus 评论系统
function loadGiscus() {
  // 清除现有的评论
  const container = document.getElementById('giscus-container-book');
  if (container) {
    container.innerHTML = '';
  }

  // 获取当前主题
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const giscusTheme = currentTheme === "dark" ? "dark" : "light";

  // 创建 script 标签
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.setAttribute('data-repo', 'zxzxovo/zxzxovo.github.io');
  script.setAttribute('data-repo-id', 'R_kgDONxTewg');
  script.setAttribute('data-category', 'Announcements');
  script.setAttribute('data-category-id', 'DIC_kwDONxTews4CmeWX');
  script.setAttribute('data-mapping', 'pathname');
  script.setAttribute('data-strict', '0');
  script.setAttribute('data-reactions-enabled', '1');
  script.setAttribute('data-emit-metadata', '0');
  script.setAttribute('data-input-position', 'top');
  script.setAttribute('data-theme', giscusTheme);
  script.setAttribute('data-lang', 'zh-CN');
  script.setAttribute('data-loading', 'lazy');
  script.setAttribute('crossorigin', 'anonymous');
  script.async = true;

  // 将 script 添加到容器中
  if (container) {
    container.appendChild(script);
  }
}

const changeDayLight = () => {
  const now = document.documentElement.getAttribute("data-theme");
  setTheme(now === "dark" ? "light" : "dark");
  
  // 主题切换后重新加载评论以应用新主题
  if (chapterContent.value) {
    setTimeout(() => {
      loadGiscus();
    }, 100);
  }
};

const searchToggled = () => navStore.onSearch();

// 计算属性
const bookId = computed(() => route.params.bookId as string);
const chapterId = computed(() => route.params.chapterId as string);

// 渲染的 Markdown 内容
const renderedContent = computed(() => {
  if (!chapterContent.value) return "";

  try {
    // 在显示章节内容时，移除首个 H1 标题以避免与章节标题重复
    const processedContent = processMarkdownContent(chapterContent.value, {
      removeFirstH1: true,
    });
    tableOfContents.value = generateTableOfContents(processedContent);
    return processedContent;
  } catch (error) {
    console.error("Markdown 渲染错误:", error);
    return '<p class="text-red-500">内容渲染失败</p>';
  }
});

// 加载书籍数据
async function loadBookData() {
  try {
    isLoading.value = true;
    loadError.value = null;

    const response = await fetch("/books.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const books: Book[] = data.books || [];
    allBooks.value = books;

    // 查找当前书籍
    const book = books.find((b) => b.id === bookId.value);
    if (!book) {
      throw new Error(`找不到书籍: ${bookId.value}`);
    }

    currentBook.value = book;

    // 初始化章节展开状态 - 一级章节默认展开
    initializeExpandedChapters(book.chapters || []);

    // 如果有章节 ID，加载章节内容
    if (chapterId.value) {
      await loadChapterContent();
    }
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : "加载失败";
  } finally {
    isLoading.value = false;
  }
}

// 加载章节内容
async function loadChapterContent() {
  if (!currentBook.value || !chapterId.value || isContentLoading.value) return;

  // 检查缓存
  const cacheKey = `${bookId.value}/${chapterId.value}`;
  if (contentCache.value.has(cacheKey)) {
    const cachedContent = contentCache.value.get(cacheKey)!;
    chapterContent.value = cachedContent;

    // 查找章节信息
    const chapter = findChapterById(
      currentBook.value.chapters || [],
      chapterId.value,
    );
    currentChapter.value = chapter;
    loadError.value = null;
    
    // 缓存内容加载完成后，初始化评论系统
    nextTick(() => {
      setTimeout(() => {
        loadGiscus();
      }, 800);
    });
    return;
  }

  try {
    isContentLoading.value = true;
    loadError.value = null;

    // 查找章节信息
    const chapter = findChapterById(
      currentBook.value.chapters || [],
      chapterId.value,
    );
    if (!chapter) {
      throw new Error(`找不到章节: ${chapterId.value}`);
    }

    if (!chapter.hasContent) {
      throw new Error("该章节暂无内容");
    }

    currentChapter.value = chapter;

    // 尝试加载章节文件
    const content = await loadChapterFile(bookId.value, chapterId.value);
    chapterContent.value = content;

    // 缓存内容
    contentCache.value.set(cacheKey, content);
    
    // 内容加载完成后，初始化评论系统
    nextTick(() => {
      setTimeout(() => {
        loadGiscus();
      }, 800); // 稍微延迟确保DOM完全渲染
    });
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : "加载章节失败";
    chapterContent.value = "";
    currentChapter.value = null;
  } finally {
    isContentLoading.value = false;
  }
}

// 辅助函数：获取章节的完整路径
function getChapterPath(
  chapters: BookChapter[],
  targetId: string,
  currentPath: string[] = [],
): string[] | null {
  for (const chapter of chapters) {
    const newPath = [...currentPath, chapter.id];

    if (chapter.id === targetId) {
      return newPath;
    }

    if (chapter.children) {
      const found = getChapterPath(chapter.children, targetId, newPath);
      if (found) return found;
    }
  }
  return null;
}

// 辅助函数：尝试加载章节文件（index.md 或 README.md）
async function loadChapterFile(
  bookId: string,
  chapterId: string,
): Promise<string> {
  const filenames = ["README.md", "index.md"]; // 优先尝试 README.md

  // 获取章节的完整路径
  const chapterPath = getChapterPath(
    currentBook.value?.chapters || [],
    chapterId,
  );
  if (!chapterPath) {
    throw new Error(`无法找到章节路径: ${chapterId}`);
  }

  for (const filename of filenames) {
    const fullPath = `/books/${bookId}/${chapterPath.join("/")}/${filename}`;

    try {
      const response = await fetch(fullPath);

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";

        // 检查是否真的是 Markdown 文件
        if (contentType.includes("text/html")) {
          continue;
        }

        const content = await response.text();

        // 再次检查内容是否是 HTML
        if (
          content.trim().startsWith("<!doctype") ||
          content.trim().startsWith("<html")
        ) {
          continue;
        }

        return content;
      }
    } catch (error) {
      // 继续尝试下一个文件
    }
  }

  throw new Error(
    `无法找到章节文件，已尝试路径: ${chapterPath.join("/")}, 文件: ${filenames.join(", ")}`,
  );
}

// 递归查找章节
function findChapterById(
  chapters: BookChapter[],
  id: string,
): BookChapter | null {
  for (const chapter of chapters) {
    if (chapter.id === id) {
      return chapter;
    }
    if (chapter.children) {
      const found = findChapterById(chapter.children, id);
      if (found) return found;
    }
  }
  return null;
}

// 初始化章节展开状态
function initializeExpandedChapters(chapters: BookChapter[]) {
  expandedChapters.value.clear();

  function processChapters(chapters: BookChapter[], level: number = 0) {
    for (const chapter of chapters) {
      // 一级章节(level 0)默认展开
      if (level === 0 && chapter.children && chapter.children.length > 0) {
        expandedChapters.value.add(chapter.id);
      }

      if (chapter.children) {
        processChapters(chapter.children, level + 1);
      }
    }
  }

  processChapters(chapters);
}

// 切换章节展开状态
function toggleChapterExpanded(chapterId: string) {
  if (expandedChapters.value.has(chapterId)) {
    expandedChapters.value.delete(chapterId);
  } else {
    expandedChapters.value.add(chapterId);
  }
  // 强制触发响应式更新
  expandedChapters.value = new Set(expandedChapters.value);
}

// 计算扁平化的章节列表
const flattenedChapters = computed(() => {
  if (!currentBook.value?.chapters) return [];

  // 用于跟踪各级别的编号
  const sectionNumbers: number[] = [0, 0, 0, 0, 0, 0]; // 支持6级标题

  // 简单的递归渲染，避免复杂的响应式依赖
  function flattenChapters(chapters: BookChapter[], level: number = 0): any[] {
    const result: any[] = [];

    for (const chapter of chapters) {
      // 生成节号
      sectionNumbers[level]++; // 当前级别+1
      // 重置更低级别的编号
      for (let i = level + 1; i < 6; i++) {
        sectionNumbers[i] = 0;
      }

      // 构建节号字符串，如 "1.", "1.1", "1.1.1"
      const sectionNumber =
        sectionNumbers
          .slice(0, level + 1)
          .filter((num) => num > 0)
          .join(".") + ".";

      result.push({
        id: chapter.id,
        title: chapter.title,
        hasContent: chapter.hasContent,
        wordCount: chapter.wordCount,
        level,
        sectionNumber,
        isExpanded: expandedChapters.value.has(chapter.id),
        hasChildren: !!(chapter.children && chapter.children.length > 0),
      });

      if (
        chapter.children &&
        chapter.children.length > 0 &&
        expandedChapters.value.has(chapter.id)
      ) {
        result.push(...flattenChapters(chapter.children, level + 1));
      }
    }

    return result;
  }

  return flattenChapters(currentBook.value.chapters);
});

// 导航到章节
function navigateToChapter(chapterId: string) {
  router.push(`/book/${bookId.value}/${chapterId}`);
}

// 滚动到目录项
function scrollToHeading(id: string) {
  const element = document.getElementById(id);
  if (element) {
    // 更新地址栏Hash
    window.history.pushState(null, "", `#${id}`);
    // 平滑滚动到目标元素
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// 监听路由变化
watch(
  [bookId, chapterId],
  async ([newBookId, newChapterId], [, oldChapterId]) => {
    // 防止重复执行
    if (!newBookId) return;

    try {
      // 如果书籍变了，重新加载书籍数据
      if (!currentBook.value || currentBook.value.id !== newBookId) {
        await loadBookData();
      } else if (newChapterId && newChapterId !== oldChapterId) {
        // 只是章节变了，只加载章节内容
        await loadChapterContent();
      } else if (!newChapterId && oldChapterId) {
        // 从章节页面回到书籍首页
        chapterContent.value = "";
        currentChapter.value = null;
        tableOfContents.value = [];
        loadError.value = null;
      }
    } catch (error) {
      console.error("路由变化处理错误:", error);
    }
  },
  { immediate: false },
);

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
  (globalThis as any).bookHeadingObserver = observer;
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

  // 使用防抖的scroll-based方法作为备用
  scrollTimeout = globalThis.setTimeout(() => {
    updateActiveHeadingByScroll();
  }, 50); // 减少防抖延迟以提高响应性
}

// 监听滚动事件
function setupScrollListener() {
  removeScrollListener();

  // 总是添加scroll监听来处理目录高亮
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
  if ((globalThis as any).bookHeadingObserver) {
    (globalThis as any).bookHeadingObserver.disconnect();
    delete (globalThis as any).bookHeadingObserver;
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

// 组件挂载时加载数据
onMounted(() => {
  // 初始化明暗模式
  setTheme(localStorage.getItem("darkTheme"));

  // 初始化响应式设计
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);

  if (bookId.value) {
    loadBookData();
  }

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

// 组件卸载时清理
onUnmounted(() => {
  removeScrollListener();
  window.removeEventListener('resize', checkScreenSize);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  // 清理全局函数
  delete (globalThis as any).updateUrlHash;
});
</script>

<template>
  <div class="book-content h-screen flex flex-col">
    <!-- 顶部导航 - 桌面端 -->
    <div
      class="hidden lg:block bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 px-4 py-3"
    >
      <div class="flex items-center gap-2 lg:gap-4">
        <!-- 左侧章节目录按钮 -->
        <button
          @click="toggleLeftSidebar"
          class="hover:bg-gray-200 dark:hover:bg-zinc-800 size-8 lg:size-10 flex justify-center items-center rounded-full cursor-pointer transition-all shrink-0"
          :class="{ 'bg-gray-200 dark:bg-zinc-800': isLeftSidebarOpen }"
          title="章节目录"
        >
          <Icon
            icon="streamline-plump-color:book-1"
            width="18"
            height="18"
            class="lg:w-5 lg:h-5"
          />
        </button>

        <div v-if="currentBook" class="flex-1 min-w-0">
          <h1 class="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white truncate">
            {{ currentBook.title }}
          </h1>
          <p
            v-if="currentChapter"
            class="text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate"
          >
            {{ currentChapter.title }}
          </p>
        </div>

        <!-- 桌面端按钮组 -->
        <div class="flex items-center gap-1 lg:gap-2 shrink-0">
          <button
            @click="searchToggled"
            class="hover:bg-gray-200 dark:hover:bg-zinc-800 size-8 lg:size-10 flex justify-center items-center rounded-full cursor-pointer"
            title="搜索"
          >
            <Icon
              icon="streamline-stickies-color:search"
              width="18"
              height="18"
              class="lg:w-5 lg:h-5"
            />
          </button>
          <button
            @click="changeDayLight"
            class="hover:bg-gray-200 dark:hover:bg-zinc-800 size-8 lg:size-10 flex justify-center items-center rounded-full cursor-pointer dark:rotate-180 transition-transform ease-in-out"
            title="切换主题"
          >
            <Icon 
              icon="noto:waxing-gibbous-moon" 
              width="18" 
              height="18"
              class="lg:w-5 lg:h-5" 
            />
          </button>
          
          <!-- 右侧文档目录按钮 -->
          <button
            @click="toggleRightSidebar"
            class="hover:bg-gray-200 dark:hover:bg-zinc-800 size-8 lg:size-10 flex justify-center items-center rounded-full cursor-pointer transition-all"
            :class="{ 
              'bg-gray-200 dark:bg-zinc-800': isRightSidebarOpen,
              'rotate-90': isRightSidebarOpen 
            }"
            title="文档目录"
          >
            <Icon
              icon="marketeq:menu"
              width="18"
              height="18"
              class="lg:w-5 lg:h-5"
            />
          </button>
        </div>
      </div>
      <SearchFrame />
    </div>

    <!-- 移动端顶部控制栏 -->
    <div class="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- 左侧章节目录按钮 -->
        <button
          @click="toggleLeftSidebar"
          class="hover:bg-zinc-200 dark:hover:bg-zinc-800 size-12 flex justify-center items-center rounded-full cursor-pointer transition-all"
          :class="{ 'bg-zinc-200 dark:bg-zinc-800': isLeftSidebarOpen }"
          title="章节目录"
        >
          <Icon
            icon="streamline-plump-color:book-1 "
            width="20"
            height="20"
          />
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
          
          <!-- 搜索按钮 -->
          <button
            @click="searchToggled"
            class="hover:bg-zinc-200 dark:hover:bg-zinc-800 size-12 flex justify-center items-center rounded-full cursor-pointer transition-all"
            title="搜索"
          >
            <Icon
              icon="streamline-stickies-color:search"
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
              'rotate-90': isRightSidebarOpen 
            }"
            title="文档目录"
          >
            <Icon
              icon="marketeq:menu"
              width="20"
              height="20"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端搜索框 -->
    <div class="lg:hidden">
      <SearchFrame />
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 flex overflow-hidden relative pt-16 lg:pt-0 bg-white dark:bg-zinc-900">
      <!-- 移动端遮罩层 -->
      <div
        v-if="isMobile && (isLeftSidebarOpen || isRightSidebarOpen)"
        @click="closeSidebars"
        class="fixed inset-0 backdrop-blur-xs backdrop-brightness-60 z-20 lg:hidden"
        :style="{ top: '61px' }"
      ></div>
      
      <!-- 左侧章节目录 -->
      <Transition name="sidebar-left">
        <div
          v-if="isLeftSidebarOpen"
          class="bg-gray-50 dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 overflow-y-auto sidebar-scroll z-30"
          :class="{
            'fixed left-0 h-full w-4/5 max-w-sm lg:relative lg:top-auto lg:w-80': isMobile,
            'relative w-80': !isMobile
          }"
          :style="isMobile ? { top: '61px', height: 'calc(100vh - 61px)' } : {}"
        >
        <div class="p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              章节目录
            </h2>
            <button
              @click="router.push('/book')"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
              title="返回书籍列表"
            >
              ← 返回
            </button>
          </div>
          <div v-if="isLoading" class="text-gray-500 dark:text-gray-400">
            加载中...
          </div>
          <div v-else-if="loadError" class="text-red-500 dark:text-red-400">
            {{ loadError }}
          </div>
          <div v-else-if="currentBook?.chapters" class="space-y-1">
            <div
              v-for="chapter in flattenedChapters"
              :key="chapter.id"
              class="chapter-item"
              :style="{ paddingLeft: `${chapter.level * 16}px` }"
            >
              <div class="flex items-center">
                <!-- 折叠/展开按钮 -->
                <button
                  v-if="chapter.hasChildren"
                  @click="toggleChapterExpanded(chapter.id)"
                  class="w-4 h-4 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mr-1"
                >
                  <svg
                    :class="{ 'rotate-90': chapter.isExpanded }"
                    class="w-3 h-3 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </button>
                <div v-else class="w-5"></div>

                <!-- 章节标题按钮 -->
                <button
                  @click="navigateToChapter(chapter.id)"
                  :class="[
                    'flex-1 text-left p-2 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors',
                    chapterId === chapter.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300',
                  ]"
                  :disabled="!chapter.hasContent"
                >
                  <div class="flex items-center justify-between">
                    <span
                      :class="{
                        'text-gray-400 dark:text-gray-500': !chapter.hasContent,
                      }"
                      class="flex items-center"
                    >
                      <span
                        class="text-blue-500 dark:text-blue-400 font-mono text-xs mr-2"
                        >{{ chapter.sectionNumber }}</span
                      >
                      {{ chapter.title }}
                    </span>
                    <span
                      v-if="chapter.wordCount"
                      class="text-xs text-gray-400 dark:text-gray-500"
                    >
                      {{ chapter.wordCount }} 字
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Transition>

      <!-- 中间内容区域 -->
      <div 
        class="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 main-content"
        @click="closeSidebars"
      >
        <div class="max-w-4xl mx-auto p-4 lg:p-8">
          <div v-if="isLoading || isContentLoading" class="text-center py-8">
            <div class="text-gray-500 dark:text-gray-400">正在加载内容...</div>
          </div>
          <div v-else-if="loadError" class="text-center py-8">
            <div class="text-red-500 dark:text-red-400">{{ loadError }}</div>
          </div>
          <div v-else-if="!chapterId && currentBook" class="py-8">
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {{ currentBook.title }}
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                {{ currentBook.description }}
              </p>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                <p>作者：{{ currentBook.author.join(", ") }}</p>
                <p v-if="currentBook.link">
                  原文链接：<a
                    :href="currentBook.link"
                    target="_blank"
                    class="text-blue-600 dark:text-blue-400 hover:underline"
                    >{{ currentBook.link }}</a
                  >
                </p>
              </div>
            </div>
            <div class="text-left">
              <h2 class="text-xl font-semibold dark:text-white mb-4">目录</h2>
              <div class="space-y-2">
                <div
                  v-for="chapter in currentBook.chapters"
                  :key="chapter.id"
                  :style="{ paddingLeft: `${chapter.level * 20}px` }"
                >
                  <button
                    v-if="chapter.hasContent"
                    @click="navigateToChapter(chapter.id)"
                    class="text-blue-600 dark:text-blue-400 hover:underline text-left"
                  >
                    {{ chapter.title }}
                  </button>
                  <span v-else class="text-gray-400 dark:text-gray-500">{{
                    chapter.title
                  }}</span>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else-if="chapterContent"
            class="prose prose-lg max-w-none text-left prose-gray dark:prose-invert"
            v-html="renderedContent"
          ></div>
          
          <!-- 评论区 - 仅在有章节内容时显示 -->
          <div v-if="chapterContent" class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div id="giscus-container-book"></div>
          </div>
        </div>
      </div>

      <!-- 右侧文档目录 -->
      <Transition name="sidebar-right">
        <div
          v-if="isRightSidebarOpen"
          class="bg-gray-50 dark:bg-zinc-800 border-l border-gray-200 dark:border-zinc-700 overflow-y-auto toc-scroll z-30"
          :class="{
            'fixed right-0 h-full w-4/5 max-w-sm lg:relative lg:top-auto lg:w-64': isMobile,
            'relative w-64': !isMobile
          }"
          :style="isMobile ? { top: '61px', height: 'calc(100vh - 61px)' } : {}"
        >
        <div class="p-4 text-left">
          <h3
            class="text-sm font-semibold text-gray-900 dark:text-white mb-4 text-left"
          >
            文档目录
          </h3>
          <div
            v-if="tableOfContents.length > 0"
            class="space-y-1"
            style="text-align: left"
          >
            <button
              v-for="item in tableOfContents"
              :key="item.id"
              @click="scrollToHeading(item.id)"
              :class="[
                'block w-full text-sm py-1.5 px-2 rounded transition-colors text-left',
                item.level === 1
                  ? 'font-bold text-gray-900 dark:text-white'
                  : item.level === 2
                    ? 'font-semibold text-gray-800 dark:text-gray-200'
                    : item.level === 3
                      ? 'font-medium text-gray-700 dark:text-gray-300'
                      : 'text-gray-600 dark:text-gray-400',
                activeHeadingId === item.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-2 border-blue-500 dark:border-blue-400'
                  : 'hover:bg-gray-200 dark:hover:bg-zinc-700 hover:text-blue-600 dark:hover:text-blue-400',
              ]"
              style="text-align: left"
            >
              <span
                class="text-blue-500 dark:text-blue-400 font-mono text-xs mr-2"
                >{{ item.sectionNumber }}</span
              >
              <span>{{ item.text }}</span>
            </button>
          </div>
          <div v-else class="text-sm text-gray-500 dark:text-gray-400">
            暂无目录
          </div>
        </div>
      </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.book-content {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
}

.chapter-item {
  transition: all 0.2s ease;
}

/* 侧边栏过渡动画 - 仅设置过渡时间 */
.sidebar-left-enter-active,
.sidebar-left-leave-active,
.sidebar-right-enter-active,
.sidebar-right-leave-active {
  transition: all 0.3s ease-in-out;
}

/* 大屏幕上的动画 */
@media (min-width: 1024px) {
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
}

/* 小屏幕上的动画 */
@media (max-width: 1023px) {
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
}

/* 自定义 prose 样式覆盖 - 使用 Tailwind 类无法实现的特殊需求 */
:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  text-align: center; /* 标题居中 */
}

:deep(.prose p),
:deep(.prose ul),
:deep(.prose ol),
:deep(.prose blockquote),
:deep(.prose table) {
  text-align: left; /* 内容左对齐 */
}

/* 代码块圆角和内边距微调 */
:deep(.prose pre) {
  border-radius: 0.5rem;
}

:deep(.prose code) {
  border-radius: 0.25rem;
}

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
