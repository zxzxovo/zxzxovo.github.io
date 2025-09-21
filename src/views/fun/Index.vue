<script lang="ts" setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-zinc-900">
    <!-- 小标题栏 -->
    <header class="sticky top-0 z-40 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-12">
          <!-- 标题和返回按钮 -->
          <div class="flex items-center space-x-3">
            <button
              @click="goToHome"
              class="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span class="text-sm font-medium">返回首页</span>
            </button>
            <div class="w-px h-4 bg-gray-300 dark:bg-zinc-600"></div>
            <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">实用工具</span>
          </div>
          
          <!-- 右侧标识 -->
          <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <span>🛠️</span>
            <span>Tools</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="relative">
      <router-view name="fun" class="overflow-auto" />
    </main>
  </div>
</template>

<style scoped lang="scss">
/* 确保内容区域正确显示 */
main {
  min-height: calc(100vh - 3rem); /* 减去header高度 */
}

/* 平滑过渡效果 */
button {
  transition: all 0.2s ease-in-out;
}

button:hover svg {
  transform: translateX(-2px);
}
</style>

