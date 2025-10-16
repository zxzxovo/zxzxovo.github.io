<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
  >
    <div class="max-w-md mx-auto text-center px-6">
      <div class="text-9xl font-bold text-gray-300 dark:text-gray-600 mb-8">
        404
      </div>

      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        页面未找到
      </h1>

      <p class="text-gray-600 dark:text-gray-400 mb-8">
        抱歉，您访问的页面不存在或已被移除。
      </p>

      <div class="space-y-4">
        <button
          @click="goBack"
          class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回上一页
        </button>

        <router-link
          to="/"
          class="block w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

function goBack() {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push("/");
  }
}
</script>

<style scoped>
/* 404 页面样式 */
</style>
