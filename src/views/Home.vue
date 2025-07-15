<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import CardView from "@/components/CardView.vue";
import LoadingState from "@/components/LoadingState.vue";
import ErrorBoundary from "@/components/ErrorBoundary.vue";
import { fetchPosts, fetchBooks } from "@/services/api";
import { useAsyncState } from "@/composables/useAsyncState";
import type { PostsData, BooksData, BlogPost, Book } from "@/types";

const router = useRouter();

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

// 统计数据
const stats = computed(() => ({
  posts: postsData.value?.posts?.filter((p) => !p.draft).length || 0,
  books: booksData.value?.books?.length || 0,
  categories:
    new Set(postsData.value?.posts?.flatMap((p) => p.categories)).size || 0,
  words: Math.round(
    (postsData.value?.posts?.reduce(
      (acc, post) => acc + (post.wordCount || 0),
      0,
    ) || 0) / 1000,
  ),
}));

// 打字机效果
const typewriterText = ref("");
const fullText = "欢迎来到我的个人网站";
const typewriterIndex = ref(0);
let timeoutBegin = 200;

const startTypewriter = () => {
  if (typewriterIndex.value < fullText.length) {
    typewriterText.value += fullText.charAt(typewriterIndex.value);
    typewriterIndex.value++;
    setTimeout(startTypewriter, timeoutBegin);
    timeoutBegin -= 15;
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

// 获取默认图片
const getDefaultImage = (post?: BlogPost, type: "post" | "book" = "post") => {
  if (type === "book") {
    return "/defaults/default.svg";
  }

  if (!post) {
    return "/defaults/default.svg";
  }

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

// 图片加载状态
const imageLoadStates = ref<Record<string, { error: boolean }>>({});

// 处理图片加载错误
const handleImageError = (slug: string) => {
  imageLoadStates.value[slug] = { error: true };
};

// 生命周期
onMounted(async () => {
  console.log("Home页面开始加载数据...");
  startTypewriter();

  try {
    await Promise.all([
      loadPosts(fetchPosts).catch((error) => {
        console.error("加载文章失败:", error);
        throw error;
      }),
      loadBooks(fetchBooks).catch((error) => {
        console.error("加载书籍失败:", error);
        throw error;
      }),
    ]);
    console.log("数据加载成功");
  } catch (error) {
    console.error("数据加载失败:", error);
  }
});
</script>

<template>
  <div class="bg-gray-50 dark:bg-zinc-900 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Hero Section -->
      <section
        class="relative py-12 md:py-20 px-4 bg-gradient-to-br from-gray-50 via-slate-50 to-stone-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 rounded-2xl mb-8 md:mb-12"
      >
        <div
          class="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 bg-[size:24px_24px] opacity-90 rounded-2xl"
        ></div>
        <!-- 朴素背景层 -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-slate-100/40 via-gray-100/30 to-stone-100/40 dark:from-slate-900/20 dark:via-zinc-900/30 dark:to-stone-900/20 rounded-2xl"
        ></div>
        <div class="relative max-w-6xl mx-auto text-center z-10">
          <div class="mb-6 md:mb-8">
            <div
              class="w-20 h-20 md:w-28 md:h-28 mx-auto mb-4 md:mb-6 bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-3 md:p-4 flex items-center justify-center"
            >
              <img
                src="/zx.svg"
                alt="Logo"
                class="w-full h-full object-contain"
              />
            </div>
            <h1
              class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 px-4"
            >
              {{ typewriterText }}<span class="animate-pulse">|</span>
            </h1>
          </div>

          <!-- 统计数据 -->
          <div
            class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12 px-4"
          >
            <CardView class="text-center" padding="p-3 md:p-4">
              <div
                class="text-xl md:text-3xl font-bold text-blue-600 dark:text-blue-400"
              >
                {{ stats.posts }}
              </div>
              <div
                class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1"
              >
                文章
              </div>
            </CardView>
            <CardView class="text-center" padding="p-3 md:p-4">
              <div
                class="text-xl md:text-3xl font-bold text-green-600 dark:text-green-400"
              >
                {{ stats.books }}
              </div>
              <div
                class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1"
              >
                书籍
              </div>
            </CardView>
            <CardView class="text-center" padding="p-3 md:p-4">
              <div
                class="text-xl md:text-3xl font-bold text-purple-600 dark:text-purple-400"
              >
                {{ stats.categories }}
              </div>
              <div
                class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1"
              >
                分类
              </div>
            </CardView>
            <CardView class="text-center" padding="p-3 md:p-4">
              <div
                class="text-xl md:text-3xl font-bold text-orange-600 dark:text-orange-400"
              >
                {{ stats.words }}k
              </div>
              <div
                class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1"
              >
                总字数
              </div>
            </CardView>
          </div>

          <!-- CTA 按钮 -->
          <div
            class="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4"
          >
            <button
              @click="navigateTo('/blog')"
              class="px-6 md:px-8 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm md:text-base"
            >
              📖 阅读文章
            </button>
            <button
              @click="navigateTo('/book')"
              class="px-6 md:px-8 py-2 md:py-3 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-zinc-600 hover:border-blue-500 dark:hover:border-blue-400 rounded-full font-medium transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
            >
              📚 浏览合集
            </button>
          </div>
        </div>
      </section>

      <!-- 最新文章 -->
      <section class="mb-12 md:mb-16">
        <div class="text-center mb-6 md:mb-8 px-4">
          <h2
            class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4"
          >
            ✨ 最近博文
          </h2>
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

          <div class="text-center px-4">
            <button
              @click="navigateTo('/blog')"
              class="px-4 md:px-6 py-2 md:py-3 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors font-medium text-sm md:text-base"
            >
              查看全部文章 →
            </button>
          </div>
        </div>
      </section>

      <!-- 精选书籍 -->
      <section class="mb-12 md:mb-16">
        <div class="text-center mb-6 md:mb-8 px-4">
          <h2
            class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4"
          >
            📚 部分合集
          </h2>
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

          <div class="text-center px-4">
            <button
              @click="navigateTo('/book')"
              class="px-4 md:px-6 py-2 md:py-3 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors font-medium text-sm md:text-base"
            >
              查看全部合集 →
            </button>
          </div>
        </div>
      </section>

      <!-- 联系方式 -->
      <section
        class="py-12 md:py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl"
      >
        <div class="max-w-4xl mx-auto text-center text-white">
          <h2 class="text-2xl md:text-3xl font-bold mb-4">💬 联系我</h2>
          <p
            class="text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto text-sm md:text-base"
          >
            欢迎交流技术问题，分享学习心得，或者只是简单地打个招呼
          </p>

          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            <CardView
              class="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              padding="p-4 md:p-6"
            >
              <div class="text-2xl md:text-3xl mb-3">📧</div>
              <h3
                class="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base"
              >
                邮箱
              </h3>
              <a
                href="mailto:zhixiaovo@gmail.com"
                class="text-gray-600 dark:text-gray-400 text-xs md:text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-all"
              >
                zhixiaovo@gmail.com
              </a>
            </CardView>

            <CardView
              class="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              padding="p-4 md:p-6"
            >
              <div class="text-2xl md:text-3xl mb-3">🐙</div>
              <h3
                class="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base"
              >
                GitHub
              </h3>
              <a
                href="https://github.com/zxzxovo"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-600 dark:text-gray-400 text-xs md:text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                github.com/zxzxovo
              </a>
            </CardView>

            <CardView
              class="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1"
              padding="p-4 md:p-6"
            >
              <div class="text-2xl md:text-3xl mb-3">🌐</div>
              <h3
                class="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base"
              >
                博客
              </h3>
              <a
                href="https://hizhixia.site"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-600 dark:text-gray-400 text-xs md:text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                hizhixia.site
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
</style>
