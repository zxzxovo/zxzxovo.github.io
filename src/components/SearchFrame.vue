<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNavStore } from "../stores/nav";
import { searchContent } from '../services/api';
import { useAsyncState } from '../composables/useAsyncState';
import type { SearchResult } from '../types';

const router = useRouter();
const navStore = useNavStore();

const searchInput = ref<HTMLInputElement>();
const searchQuery = ref('');

// 使用异步状态管理
const {
  data: searchResults,
  isLoading: isSearching,
  execute: performSearch
} = useAsyncState<SearchResult[]>([]);

const closeFrame = () => {
  navStore.closeSearch();
  searchQuery.value = '';
  searchResults.value = [];
};

const handleResultClick = (result: SearchResult) => {
  router.push(result.link);
  closeFrame();
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeFrame();
  }
};

// 防抖搜索
let searchTimeout: ReturnType<typeof setTimeout>;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }
  
  searchTimeout = setTimeout(() => {
    performSearch(() => searchContent(searchQuery.value));
  }, 300);
};

// 监听搜索查询变化
watch(searchQuery, debounceSearch);

// 当搜索框打开时聚焦输入框
watch(() => navStore.isOnSearch, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    searchInput.value?.focus();
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  clearTimeout(searchTimeout);
});
</script>

<template>
  <Teleport to="body">
      <div
        v-if="navStore.isOnSearch"
        class="fixed z-50 w-screen h-screen top-0 flex justify-center items-center backdrop-blur-xs backdrop-brightness-60"
        @click="closeFrame"
      >
        <div
          class="w-3/4 max-w-2xl h-3/4 max-h-96 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          @click.stop
        >
          <!-- 搜索输入区域 -->
          <div class="p-6 border-b border-zinc-200 dark:border-zinc-700">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="搜索博客和合集..."
                class="w-full pl-10 pr-4 py-3 text-lg border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-zinc-700 dark:text-white"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- 搜索结果区域 -->
          <div class="flex-1 overflow-y-auto p-6 search-results">
            <!-- 加载状态 -->
            <div v-if="isSearching" class="flex justify-center items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
            </div>

            <!-- 无搜索内容 -->
            <div v-else-if="!searchQuery" class="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <svg class="mx-auto w-16 h-16 mb-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <p class="text-lg">开始搜索内容</p>
              <p class="text-sm mt-2">输入关键词来查找博客文章和合集</p>
            </div>

            <!-- 无搜索结果 -->
            <div v-else-if="!searchResults || searchResults.length === 0" class="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <svg class="mx-auto w-16 h-16 mb-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33"></path>
              </svg>
              <p class="text-lg">未找到相关内容</p>
              <p class="text-sm mt-2">尝试使用其他关键词搜索</p>
            </div>

            <!-- 搜索结果列表 -->
            <div v-else class="space-y-4">
              <div
                v-for="result in searchResults"
                :key="result.id"
                class="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
                @click="handleResultClick(result)"
              >
                <div class="flex items-start justify-between mb-2">
                  <h3 class="text-lg font-semibold text-zinc-900 dark:text-white flex-1">
                    {{ result.title }}
                  </h3>
                  <span class="ml-2 px-2 py-1 text-xs rounded-full bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200">
                    {{ result.type === 'blog' ? '博客' : result.type === 'book' ? '合集' : '章节' }}
                  </span>
                </div>
                <p class="text-zinc-600 dark:text-zinc-300 text-sm mb-2">
                  {{ result.excerpt || result.description }}
                </p>
                <!-- 博客文章的标签 -->
                <div v-if="result.type === 'blog' && result.tags" class="flex flex-wrap gap-1 mb-2">
                  <span
                    v-for="tag in result.tags.slice(0, 3)"
                    :key="tag"
                    class="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300 rounded"
                  >
                    {{ tag }}
                  </span>
                  <span v-if="result.tags.length > 3" class="text-xs text-zinc-400">
                    +{{ result.tags.length - 3 }}
                  </span>
                </div>
                <!-- 合集的作者信息 -->
                <div v-else-if="result.type === 'book' && result.author" class="text-xs text-zinc-500 dark:text-zinc-400">
                  作者: {{ result.author.join(', ') }}
                </div>
                <!-- 章节的合集信息 -->
                <div v-else-if="result.type === 'chapter' && result.bookTitle" class="text-xs text-zinc-500 dark:text-zinc-400">
                  来自: {{ result.bookTitle }}
                </div>
              </div>
            </div>
          </div>

          <!-- 底部提示 -->
          <div class="px-6 py-3 bg-zinc-50 dark:bg-zinc-700 text-xs text-zinc-500 dark:text-zinc-400 flex justify-between">
            <span>按 ESC 键关闭</span>
            <span>{{ searchResults?.length || 0 }} 个结果</span>
          </div>
        </div>
      </div>
  </Teleport>
</template>

<style lang="css" scoped></style>
