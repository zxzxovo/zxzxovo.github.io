<template>
  <div class="error-boundary p-6 text-center">
    <div class="max-w-md mx-auto">
      <!-- 错误图标 -->
      <div class="mb-4">
        <Icon
          icon="mdi:alert-circle-outline"
          class="text-6xl text-red-500 mx-auto"
        />
      </div>

      <!-- 错误标题 -->
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ title || "出现错误" }}
      </h2>

      <!-- 错误描述 -->
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ description || "抱歉，加载内容时出现了问题。" }}
      </p>

      <!-- 操作按钮 -->
      <div class="space-y-3">
        <button
          v-if="showRetry"
          @click="$emit('retry')"
          class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          重试
        </button>

        <button
          v-if="showGoBack"
          @click="goBack"
          class="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          返回
        </button>

        <router-link
          v-if="showGoHome"
          to="/"
          class="block w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-center"
        >
          回到首页
        </router-link>
      </div>

      <!-- 详细错误信息（开发环境） -->
      <details v-if="showDetails && isDev" class="mt-6 text-left">
        <summary
          class="cursor-pointer text-sm text-gray-500 dark:text-gray-400 mb-2"
        >
          错误详情
        </summary>
        <pre
          class="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto text-red-600 dark:text-red-400"
          >{{ errorDetails }}</pre
        >
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";

interface Props {
  title?: string;
  description?: string;
  error?: Error | string;
  showRetry?: boolean;
  showGoBack?: boolean;
  showGoHome?: boolean;
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showRetry: true,
  showGoBack: true,
  showGoHome: true,
  showDetails: true,
});

defineEmits<{
  retry: [];
}>();

const router = useRouter();

const isDev = import.meta.env.DEV;

const errorDetails = computed(() => {
  if (!props.error) return "";

  if (typeof props.error === "string") {
    return props.error;
  }

  return `${props.error.name}: ${props.error.message}\n${props.error.stack}`;
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/");
  }
}
</script>

<style scoped>
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
