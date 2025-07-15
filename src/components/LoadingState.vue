<template>
  <div class="loading-container" :class="containerClass">
    <div class="loading-content">
      <!-- 骨架屏加载 -->
      <template v-if="type === 'skeleton'">
        <div class="space-y-4">
          <div class="skeleton-line h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="skeleton-line h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="skeleton-line h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </template>
      
      <!-- 旋转加载器 -->
      <template v-else-if="type === 'spinner'">
        <div class="flex items-center justify-center">
          <div class="loading-spinner"></div>
          <span v-if="text" class="ml-3 text-gray-600 dark:text-gray-400">{{ text }}</span>
        </div>
      </template>
      
      <!-- 脉冲加载 -->
      <template v-else-if="type === 'pulse'">
        <div class="flex items-center justify-center space-x-2">
          <div class="pulse-dot bg-blue-500"></div>
          <div class="pulse-dot bg-blue-500 animation-delay-200"></div>
          <div class="pulse-dot bg-blue-500 animation-delay-400"></div>
        </div>
        <p v-if="text" class="text-center mt-3 text-gray-600 dark:text-gray-400">{{ text }}</p>
      </template>
      
      <!-- 进度条加载 -->
      <template v-else-if="type === 'progress'">
        <div class="w-full">
          <div class="flex justify-between mb-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ text || '加载中...' }}</span>
            <span v-if="progress !== undefined" class="text-sm text-gray-600 dark:text-gray-400">{{ progress }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              class="bg-blue-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: progressWidth }"
            ></div>
          </div>
        </div>
      </template>
      
      <!-- 自定义加载内容 -->
      <template v-else>
        <slot>
          <div class="flex items-center justify-center">
            <div class="loading-spinner"></div>
            <span v-if="text" class="ml-3 text-gray-600 dark:text-gray-400">{{ text }}</span>
          </div>
        </slot>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  type?: 'spinner' | 'skeleton' | 'pulse' | 'progress' | 'custom';
  text?: string;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
  overlay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'spinner',
  size: 'md',
  fullscreen: false,
  overlay: false,
});

const containerClass = computed(() => {
  const classes = [];
  
  if (props.fullscreen) {
    classes.push('fixed inset-0 z-50 bg-white dark:bg-gray-900');
  } else if (props.overlay) {
    classes.push('absolute inset-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm');
  } else {
    classes.push('py-8');
  }
  
  classes.push('flex items-center justify-center');
  
  return classes.join(' ');
});

const progressWidth = computed(() => {
  if (props.progress !== undefined) {
    return `${Math.min(100, Math.max(0, props.progress))}%`;
  }
  return '0%';
});
</script>

<style scoped>
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.animation-delay-200 {
  animation-delay: 0.2s;
}

.animation-delay-400 {
  animation-delay: 0.4s;
}

.skeleton-line {
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes skeleton-loading {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}
</style>
