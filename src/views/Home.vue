<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import CardView from "@/components/CardView.vue";
import LoadingState from "@/components/LoadingState.vue";
import ErrorBoundary from "@/components/ErrorBoundary.vue";
import { fetchPosts, fetchBooks } from "@/services/api";
import { useAsyncState } from "@/composables/useAsyncState";
import { useSEO } from "@/composables/useSEO";
import type { PostsData, BooksData, BlogPost, Book } from "@/types";
import { devLog, devError } from "@/utils/logger";

const router = useRouter();
const { setMeta, setStructuredData } = useSEO();

// 使用异步状态管理
const {
  data: postsData,
  isLoading: postsLoading,
  error: postsError,
  execute: loadPosts,
} = useAsyncState<PostsData>();

const {
  data: booksData,
  isLoading: booksLoading,
  error: booksError,
  execute: loadBooks,
} = useAsyncState<BooksData>();

// 计算属性
const recentPosts = computed(() => {
  if (!postsData.value?.posts) return [];
  return postsData.value.posts.filter((post) => !post.draft).slice(0, 3);
});

const featuredBooks = computed(() => {
  if (!booksData.value?.books) return [];
  return booksData.value.books.slice(0, 4);
});

// 统计数据(使用缓存避免重复计算)
const stats = computed(() => {
  const posts = postsData.value?.posts?.filter((p) => !p.draft) || [];
  const books = booksData.value?.books || [];
  
  return {
    posts: posts.length,
    books: books.length,
    categories: new Set(posts.flatMap((p) => p.categories)).size,
    words: Math.round(posts.reduce((acc, post) => acc + (post.wordCount || 0), 0) / 1000),
  };
});

// 统计卡片配置
const statCards = computed(() => [
  { label: '文章', value: stats.value.posts, rotation: 0 },
  { label: '合集', value: stats.value.books, rotation: 90 },
  { label: '分类', value: stats.value.categories, rotation: 180 },
  { label: '总字数', value: `${stats.value.words}k`, rotation: 270 },
]);

// 打字机效果常量
const TYPEWRITER_CONFIG = {
  text: "欢迎来到芷夏的个人网站",
  initialDelay: 200,
  delayDecrement: 15,
  minDelay: 50,
};

const typewriterText = ref("");
const typewriterIndex = ref(0);
let currentDelay = TYPEWRITER_CONFIG.initialDelay;
let timeoutId: number | null = null;

const startTypewriter = () => {
  if (typewriterIndex.value < TYPEWRITER_CONFIG.text.length) {
    typewriterText.value += TYPEWRITER_CONFIG.text.charAt(typewriterIndex.value);
    typewriterIndex.value++;
    currentDelay = Math.max(
      TYPEWRITER_CONFIG.minDelay,
      currentDelay - TYPEWRITER_CONFIG.delayDecrement
    );
    timeoutId = window.setTimeout(startTypewriter, currentDelay);
  }
};

const stopTypewriter = () => {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

// 导航功能
const navigateTo = (path: string) => {
  router.push(path);
};

const navigateToPost = (post: BlogPost) => {
  router.push(`/blog/${post.slug}`);
};

const navigateToBook = (book: Book) => {
  if (book.ref === "book") {
    router.push(`/book/${book.id}`);
  } else {
    window.open(book.link, "_blank");
  }
};

// 默认图片映射常量
const DEFAULT_IMAGES = {
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

// 获取默认图片
const getDefaultImage = (post?: BlogPost, type: "post" | "book" = "post") => {
  if (type === "book" || !post) {
    return DEFAULT_IMAGES.default;
  }

  // 查找匹配的分类图片
  const matchedCategory = post.categories.find(
    (category) => category.toLowerCase() in DEFAULT_IMAGES
  );

  return matchedCategory
    ? DEFAULT_IMAGES[matchedCategory.toLowerCase() as keyof typeof DEFAULT_IMAGES]
    : DEFAULT_IMAGES.default;
};

// 联系方式配置
const CONTACT_INFO = [
  {
    icon: "📧",
    title: "邮箱",
    value: "zhixiaovo@gmail.com",
    link: "mailto:zhixiaovo@gmail.com",
    type: "email" as const,
  },
  {
    icon: "🐙",
    title: "GitHub",
    value: "github.com/zxzxovo",
    link: "https://github.com/zxzxovo",
    type: "external" as const,
  },
  {
    icon: "🌐",
    title: "博客",
    value: "hizhixia.site",
    link: "https://hizhixia.site",
    type: "external" as const,
  },
];

// 图片加载状态
const imageLoadStates = ref<Record<string, { error: boolean }>>({});

// 处理图片加载错误
const handleImageError = (slug: string) => {
  imageLoadStates.value[slug] = { error: true };
};

// 生命周期
onMounted(async () => {
  devLog("Home页面开始加载数据...");
  startTypewriter();

  // 设置首页SEO
  setMeta({
    title: "Zhixia的官方网站 - 技术博客与项目展示",
    description:
      "欢迎来到Zhixia的个人网站，这里分享技术文章、开源项目、编程经验和生活感悟。涵盖Vue、Rust、前端开发、软件工程等技术内容。",
    keywords:
      "Zhixia,个人博客,技术博客,Vue,Rust,编程,前端开发,软件工程,开源项目",
    url: "https://hizhixia.site",
    type: "website",
  });

  // 设置网站的结构化数据
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Zhixia的官方网站",
    description: "一个关于技术、生活和思考的个人网站",
    url: "https://hizhixia.site",
    author: {
      "@type": "Person",
      name: "Zhixia",
      url: "https://hizhixia.site/about",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://hizhixia.site/blog?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  });

  try {
    await Promise.all([
      loadPosts(fetchPosts).catch((error) => {
        devError("加载文章失败:", error);
        throw error;
      }),
      loadBooks(fetchBooks).catch((error) => {
        devError("加载书籍失败:", error);
        throw error;
      }),
    ]);
    devLog("数据加载成功");
  } catch (error) {
    devError("数据加载失败:", error);
  }
});

onUnmounted(() => {
  stopTypewriter();
  devLog("Home页面已卸载");
});
</script>

<template>
  <div class="bg-gray-50 dark:bg-zinc-900 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Hero Section -->
      <section
        class="relative py-6 md:py-10 px-4 bg-gradient-to-br from-gray-50 via-slate-50 to-stone-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 rounded-2xl mb-8 md:mb-12 shadow-lg"
      >
        <div
          class="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 bg-[size:24px_24px] opacity-90 rounded-2xl"
        ></div>
        <!-- 朴素背景层 -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-slate-100/40 via-gray-100/30 to-stone-100/40 dark:from-slate-900/20 dark:via-zinc-900/30 dark:to-stone-900/20 rounded-2xl"
        ></div>
        <div class="relative max-w-6xl mx-auto text-center z-10">
          <div class="mb-6 md:mb-10">
            <h1
              class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 px-4"
            >
              {{ typewriterText }}<span class="animate-pulse">|</span>
            </h1>
          </div>

          <!-- 统计数据 -->
          <div
            class="flex flex-wrap gap-2 md:gap-3 mb-0 px-2 md:px-4 justify-center"
          >
            <div 
              v-for="card in statCards" 
              :key="card.label" 
              class="stat-card-wrapper flex-shrink-0"
              :style="{ '--rotation': card.rotation + 'deg' }"
            >
              <CardView class="w-[calc(25vw-1rem)] max-w-[75px] md:max-w-[90px] h-16 md:h-18 flex flex-col rounded-2xl border border-gray-50 dark:border-zinc-900" padding="p-0">
                <div class="flex-1 flex items-center justify-center">
                  <div class="text-sm md:text-base font-bold text-green-600 dark:text-green-300">
                    {{ card.value }}
                  </div>
                </div>
                <div class="text-[9px] md:text-[10px] text-gray-600 dark:text-gray-400 pb-1">
                  {{ card.label }}
                </div>
              </CardView>
            </div>
          </div>
        </div>
      </section>

      <!-- 最新文章 -->
      <section class="mb-12 md:mb-16">
        <div class="flex justify-center mb-6 md:mb-8 px-4">
          <div class="title-box flex w-[220px] md:w-[280px] h-12 md:h-14 rounded-xl overflow-hidden shadow-sm">
            <div class="flex-1 flex items-center justify-center bg-transparent">
              <h2 class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white select-none whitespace-nowrap">最近博文</h2>
            </div>
            <button
              @click="navigateTo('/blog')"
              class="flex items-center justify-center px-4 md:px-5 font-medium text-base md:text-lg bg-gray-200 dark:bg-zinc-700 text-pink-600 dark:text-pink-300 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors rounded-lg"
            >
              全部
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <LoadingState v-if="postsLoading" text="正在加载文章..." />

        <!-- 错误状态 -->
        <ErrorBoundary
          v-else-if="postsError"
          :error="postsError"
          @retry="() => loadPosts(fetchPosts)"
        />

        <!-- 文章网格 -->
        <div v-else>
          <div
            class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8"
          >
            <CardView
              v-for="post in recentPosts"
              :key="post.slug"
              class="group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              padding="p-0"
              @click="navigateToPost(post)"
            >
              <div class="relative overflow-hidden rounded-t-lg">
                <!-- 文章图片 -->
                <div
                  class="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-800 dark:to-zinc-700 relative overflow-hidden"
                >
                  <!-- 实际图片 -->
                  <img
                    v-if="post.image"
                    :src="post.image"
                    :alt="post.title"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    @error="handleImageError(post.slug)"
                  />

                  <!-- 错误时或无图片时显示默认图片 -->
                  <div
                    v-if="!post.image || imageLoadStates[post.slug]?.error"
                    class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-zinc-700 dark:to-zinc-600"
                  >
                    <img
                      :src="getDefaultImage(post)"
                      :alt="post.title"
                      class="w-16 h-16 opacity-60"
                    />
                  </div>
                </div>

                <!-- 文章信息 -->
                <div class="p-4 md:p-6">
                  <div class="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      v-for="category in post.categories.slice(0, 2)"
                      :key="category"
                      class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                    >
                      {{ category }}
                    </span>
                  </div>

                  <h3
                    class="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                  >
                    {{ post.title }}
                  </h3>

                  <p
                    class="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2"
                  >
                    {{ post.description }}
                  </p>

                  <div
                    class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
                  >
                    <span>{{
                      new Date(post.date).toLocaleDateString("zh-CN")
                    }}</span>
                    <span v-if="post.readingTime"
                      >{{ post.readingTime }} 分钟阅读</span
                    >
                  </div>
                </div>
              </div>
            </CardView>
          </div>

          <!-- 移除底部按钮，已移至标题右侧 -->
        </div>
      </section>

      <!-- 精选书籍 -->
      <section class="mb-12 md:mb-16">
        <div class="flex justify-center mb-6 md:mb-8 px-4">
          <div class="title-box flex w-[220px] md:w-[280px] h-12 md:h-14 rounded-xl overflow-hidden shadow-sm">
            <div class="flex-1 flex items-center justify-center bg-transparent">
              <h2 class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white select-none whitespace-nowrap">部分合集</h2>
            </div>
            <button
              @click="navigateTo('/book')"
              class="flex items-center justify-center px-4 md:px-5 font-medium text-base md:text-lg bg-gray-200 dark:bg-zinc-700 text-pink-600 dark:text-pink-300 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors rounded-lg"
            >
              全部
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <LoadingState v-if="booksLoading" text="正在加载书籍..." />

        <!-- 错误状态 -->
        <ErrorBoundary
          v-else-if="booksError"
          :error="booksError"
          @retry="() => loadBooks(fetchBooks)"
        />

        <!-- 书籍网格 -->
        <div v-else>
          <div
            class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-6 md:mb-8"
          >
            <CardView
              v-for="book in featuredBooks"
              :key="book.id"
              class="group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              padding="p-0"
              @click="navigateToBook(book)"
            >
              <div class="relative overflow-hidden">
                <!-- 书籍封面 -->
                <div
                  class="aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-800 dark:to-zinc-700 relative overflow-hidden"
                >
                  <div class="w-full h-full flex items-center justify-center">
                    <img
                      :src="getDefaultImage(undefined, 'book')"
                      :alt="book.title"
                      class="w-full h-full object-contain p-4 md:p-8 group-hover:scale-110 transition-transform duration-500"
                    />
                    <div class="absolute text-4xl md:text-6xl opacity-20">
                      📖
                    </div>
                  </div>

                  <!-- 类型标识 -->
                  <div class="absolute top-2 md:top-4 right-2 md:right-4">
                    <span
                      :class="[
                        'px-2 md:px-3 py-1 rounded-full text-xs font-medium',
                        book.ref === 'book'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                      ]"
                    >
                      {{ book.ref === "book" ? "📖 本站" : "🔗 外链" }}
                    </span>
                  </div>
                </div>

                <!-- 书籍信息 -->
                <div class="p-3 md:p-6">
                  <h3
                    class="text-sm md:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2"
                  >
                    {{ book.title }}
                  </h3>

                  <p
                    class="text-gray-600 dark:text-gray-300 mb-2 md:mb-4 line-clamp-2 text-xs md:text-sm"
                  >
                    {{ book.description }}
                  </p>

                  <!-- 作者信息 -->
                  <div
                    class="flex items-center text-xs md:text-sm text-gray-500 dark:text-gray-400"
                  >
                    <span class="mr-1 md:mr-2">👤</span>
                    <span class="line-clamp-1">{{
                      Array.isArray(book.author)
                        ? book.author.join(", ")
                        : book.author
                    }}</span>
                  </div>
                </div>
              </div>
            </CardView>
          </div>

          <!-- 移除底部按钮，已移至标题右侧 -->
        </div>
      </section>

      <!-- 联系方式 -->
      <section
        class="py-8 md:py-12 px-4 bg-gradient-to-br from-blue-100 via-pink-50 to-blue-50 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 rounded-2xl shadow-lg"
      >
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">💬 联系我</h2>
          <p
            class="text-gray-600 dark:text-gray-400 mb-6 md:mb-8 max-w-2xl mx-auto text-sm md:text-base"
          >
            欢迎交流技术问题，分享学习心得，或者只是简单地打个招呼
          </p>

          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            <CardView
              v-for="(contact, index) in CONTACT_INFO"
              :key="contact.title"
              :class="[
                'text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1',
                index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''
              ]"
              padding="p-3 md:p-4"
            >
              <div class="text-2xl md:text-3xl mb-2">{{ contact.icon }}</div>
              <h3
                class="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base"
              >
                {{ contact.title }}
              </h3>
              <a
                :href="contact.link"
                :target="contact.type === 'external' ? '_blank' : undefined"
                :rel="contact.type === 'external' ? 'noopener noreferrer' : undefined"
                :class="[
                  'text-gray-600 dark:text-gray-400 text-xs md:text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors',
                  contact.type === 'email' ? 'break-all' : ''
                ]"
              >
                {{ contact.value }}
              </a>
            </CardView>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.bg-grid-slate-100 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(100 116 139 / 0.3)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e");
}
.dark .bg-grid-slate-700\/25 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(71 85 105 / 0.4)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e");
}
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
/* 标题盒子新设计 */
.title-box {
  background: #fff;
  box-shadow: 0 1px 6px 0 #0001;
  border-radius: 0.75rem;
  padding: 4px;
  gap: 4px;
}
.dark .title-box {
  background: #27272a;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.5);
}

/* 统计卡片跨性别旗帜蓝粉色拼接边框 */
.stat-card-wrapper {
  position: relative;
  border-radius: 1rem;
  padding: 2px;
  background: conic-gradient(from var(--rotation, 0deg), rgba(91, 206, 250, 0.8) 0deg 120deg, rgba(245, 169, 184, 0.8) 120deg 160deg, rgba(255, 255, 255, 0.8) 160deg 280deg, rgba(245, 169, 184, 0.8) 280deg 360deg);
}
.dark .stat-card-wrapper {
  background: conic-gradient(from var(--rotation, 0deg), rgba(91, 206, 250, 0.7) 0deg 120deg, rgba(245, 169, 184, 0.7) 120deg 160deg, rgba(255, 255, 255, 0.3) 160deg 280deg, rgba(245, 169, 184, 0.7) 280deg 360deg);
}

@media (max-width: 640px) {
  .title-box {
    width: 220px;
    min-width: 0;
    max-width: 98vw;
    height: 2.8rem;
    padding: 3px;
    gap: 3px;
  }
  .title-box h2 {
    font-size: 1.05rem;
  }
  .title-box button {
    font-size: 0.95rem;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}
</style>

/* 标题和全部按钮衔接美化 */
.section-title-group {
  display: flex;
  align-items: flex-end;
}
.section-title {
  border-bottom-width: 4px;
  border-color: #ec4899; /* pink-400 */
  padding-right: 0.5rem;
  margin-bottom: 0;
  line-height: 1.2;
}
.dark .section-title {
  border-color: #f472b6; /* pink-500 */
}
.all-btn {
  border-radius: 0 0.5rem 0.5rem 0;
  border-width: 1px;
  border-left: 0;
  border-color: #ec4899;
  color: #ec4899;
  background: #fff;
  margin-left: 0.5rem;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
}
.all-btn:hover {
  background: #fdf2f8;
}
.dark .all-btn {
  border-color: #f472b6;
  color: #f472b6;
  background: #18181b;
}
.dark .all-btn:hover {
  background: #83184333;
}
@media (max-width: 640px) {
  .section-title {
    font-size: 1.25rem;
    padding-right: 0.25rem;
  }
  .all-btn {
    font-size: 0.95rem;
    padding: 0.25rem 0.75rem;
  }
}
