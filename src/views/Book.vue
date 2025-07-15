<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import CardView from "@/components/CardView.vue";
import { fetchBooks } from "@/services/api";
import { useAsyncState } from "@/composables/useAsyncState";
import type { Book, BooksData } from "@/types";

const router = useRouter();

// 使用异步状态管理书籍数据
const {
  data: booksData,
  isLoading,
  error: loadError,
  execute: loadBooks
} = useAsyncState<BooksData>();

// 计算属性：所有书籍
const allBooks = computed(() => booksData.value?.books || []);

const selectedCategory = ref<"all" | "book" | "link">("all");

// 图片加载状态
const imageLoadStates = ref<
  Record<string, { loaded: boolean; error: boolean }>
>({});

// 筛选后的书籍
const filteredBooks = computed(() => {
  if (selectedCategory.value === "all") {
    return allBooks.value;
  }
  return allBooks.value.filter((book) => book.ref === selectedCategory.value);
});

// 获取默认图片
const getDefaultImage = (_book: Book) => {
  // 根据书籍类型返回默认图片
  return "/defaults/default.svg";
};

// 处理图片加载
const handleImageLoad = (bookId: string) => {
  imageLoadStates.value[bookId] = { loaded: true, error: false };
};

const handleImageError = (bookId: string) => {
  imageLoadStates.value[bookId] = { loaded: true, error: true };
};

// 处理书籍点击
const handleBookClick = (book: Book) => {
  if (book.ref === "link" && book.link) {
    window.open(book.link, "_blank");
  } else if (book.ref === "book") {
    // 跳转到书籍内容页面
    router.push(`/book/${book.id}`);
  }
};

// 加载书籍数据
// 加载书籍数据
const loadBooksData = async () => {
  await loadBooks(() => fetchBooks());
};

// 格式化作者列表
const formatAuthors = (authors: string[]) => {
  if (authors.length <= 2) {
    return authors.join(" & ");
  }
  return `${authors[0]} 等 ${authors.length} 位作者`;
};

onMounted(() => {
  loadBooksData();
});
</script>

<template>
  <div class="bg-gray-50 dark:bg-zinc-900 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- 筛选选项 -->
      <div class="flex justify-center mb-8">
        <CardView class="inline-flex p-2" padding="p-2">
          <button
            v-for="option in [
              { key: 'all', label: '全部', icon: '📚' },
              { key: 'book', label: '本站内容', icon: '📖' },
              { key: 'link', label: '外部链接', icon: '🔗' },
            ]"
            :key="option.key"
            @click="selectedCategory = option.key as any"
            :class="[
              'px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium transition-all duration-200',
              selectedCategory === option.key
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700',
            ]"
          >
            <span>{{ option.icon }}</span>
            <span>{{ option.label }}</span>
          </button>
        </CardView>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
        ></div>
        <p class="mt-4 text-gray-600 dark:text-gray-300">加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="loadError" class="text-center py-12">
        <div class="text-red-500 text-xl mb-4">⚠️</div>
        <p class="text-red-600 dark:text-red-400">{{ loadError }}</p>
        <button
          @click="loadBooksData"
          class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          重试
        </button>
      </div>

      <!-- 书籍网格 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <CardView
          v-for="book in filteredBooks"
          :key="book.id"
          class="group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          padding="p-0"
          @click="handleBookClick(book)"
        >
          <div class="relative overflow-hidden">
            <!-- 书籍封面 -->
            <div
              class="aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-800 dark:to-zinc-700 relative overflow-hidden"
            >
              <!-- 默认显示书籍封面 -->
              <div
                class="w-full h-full flex items-center justify-center"
              >
                <img
                  :src="getDefaultImage(book)"
                  :alt="book.title"
                  class="w-full h-full object-contain p-8 group-hover:scale-110 transition-transform duration-500"
                  @load="handleImageLoad(book.id)"
                  @error="handleImageError(book.id)"
                />
                <div class="text-6xl opacity-20">📖</div>
              </div>

              <!-- 类型标识 -->
              <div class="absolute top-4 right-4">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-medium',
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
            <div class="p-6">
              <h3
                class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              >
                {{ book.title }}
              </h3>

              <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                {{ book.description }}
              </p>

              <!-- 作者信息 -->
              <div
                class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4"
              >
                <span class="mr-2">👤</span>
                <span>{{ formatAuthors(book.author) }}</span>
              </div>

              <!-- 统计信息 -->
              <div
                v-if="book.stats"
                class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4"
              >
                <span>📄 {{ book.stats.totalChapters }} 章节</span>
                <span
                  >📝 {{ Math.round(book.stats.totalWords / 1000) }}k 字</span
                >
              </div>

              <!-- 外链提示 -->
              <div
                v-if="book.ref === 'link'"
                class="flex items-center text-sm text-blue-600 dark:text-blue-400"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M14 4h6m0 0v6m0-6L10 14"
                  ></path>
                </svg>
                <span>点击访问外部链接</span>
              </div>

              <!-- 本站内容提示 -->
              <div
                v-else
                class="flex items-center text-sm text-green-600 dark:text-green-400"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  ></path>
                </svg>
                <span>点击阅读详细内容</span>
              </div>
            </div>
          </div>
        </CardView>
      </div>

      <!-- 空状态 -->
      <div
        v-if="!isLoading && !loadError && filteredBooks.length === 0"
        class="text-center py-16"
      >
        <div class="text-6xl mb-4">📚</div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          暂无内容
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          {{
            selectedCategory === "all"
              ? "还没有添加任何书籍合集"
              : "当前分类下暂无内容"
          }}
        </p>
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

/* 响应式调整 */
@media (max-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .md\:grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
