<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import CardView from "@/components/CardView.vue";

// 定义类型
interface GitHubEvent {
  type: string;
  created_at: string;
  payload: {
    commits?: Array<any>;
  };
}

interface GitHubUser {
  public_repos: number;
  followers: number;
  following: number;
}

// 简介信息
const personalInfo = ref({
  name: "zhixia_OvO",
  age: 23,
  avatar: "https://avatars.githubusercontent.com/u/196936508?v=4",
  bio: `热爱编程的全栈开发者。\n\n“长恨此身非我有，何时忘却营营？\n夜阑风静縠纹平。小舟从此逝，江海寄余生。”`,
});

const interests = ref([
  {
    title: "软件开发",
    icon: "💻",
    description: "Rust, Android, Vue.js",
    details: "应用开发者，主要使用Rust",
    items: [
      { name: "Rust", status: "熟练使用" },
      { name: "Java/Kotlin", status: "使用中" },
      { name: "HTML/CSS/JS+Vue", status: "使用中" },
      { name: "Android", status: "应用开发" },
      { name: "C/C++", status: "不常用" },
    ],
  },
  {
    title: "阅读",
    icon: "📚",
    description: "技术书籍，小说",
    details: "不要丢掉人性，不要忘记阅读",
    items: [
      { name: "《Blue》", status: "" },
      { name: "《代码整洁之道》", status: "" },
      { name: "《野草》", status: "" },
      { name: "《终结的感觉》", status: "" },
    ],
  },
  {
    title: "音乐",
    icon: "🎵",
    description: "摇滚民谣，古典，流行",
    details: "音乐会替你说出情绪",
    items: [
      { name: "Leonard Cohen", status: "" },
      { name: "沉默演讲", status: "" },
      { name: "万能青年旅店", status: "" },
      { name: "U2", status: "" },
    ],
  },
  {
    title: "摄影",
    icon: "📸",
    description: "是记录，是生活",
    details: "拍自己喜欢的好玩的照片",
    items: [
      { name: "街头摄影", status: "练习中" },
      { name: "风景摄影", status: "爱好" },
    ],
  },
]);

const githubStats = ref({
  totalCommits: 0,
  repositories: 0,
  followers: 0,
  following: 0,
});

const friends = ref([
  {
    name: "Runoob菜鸟教程",
    url: "https://runoob.com",
    description: "较为齐全的基础知识参考手册",
  },
]);

const isLoadingStats = ref(false);
const isLoadingGitHubImages = ref(false);

// GitHub用户名
const githubUsername = "zxzxovo";


// 主题状态 - 使用ref以确保响应性
const currentTheme = ref(document.documentElement.getAttribute("data-theme") || "light");

// 检测当前主题
const isDarkMode = computed(() => {
  return currentTheme.value === "dark" || 
         document.documentElement.classList.contains("dark");
});

// 获取今天的日期字符串（用于缓存）
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0]; // 格式: YYYY-MM-DD
};

// 每日缓存键 - 每天自动更新
const dailyCacheKey = ref(getTodayDateString());

// 手动更新主题状态
const updateThemeState = () => {
  const theme = document.documentElement.getAttribute("data-theme");
  const hasClassDark = document.documentElement.classList.contains("dark");
  const newTheme = theme === "dark" || hasClassDark ? "dark" : "light";
  
  if (currentTheme.value !== newTheme) {
    currentTheme.value = newTheme;
  }
};

// GitHub统计图片URL - 使用每日缓存
const githubStatsUrl = computed(() => {
  const cacheKey = dailyCacheKey.value;
  if (isDarkMode.value) {
    return `https://github-readme-stats.vercel.app/api?username=${githubUsername}&show_icons=true&theme=github_dark&hide_border=true&bg_color=00000000&text_color=e6edf3&icon_color=7c3aed&title_color=e6edf3&cache_seconds=86400&t=${cacheKey}`;
  } else {
    return `https://github-readme-stats.vercel.app/api?username=${githubUsername}&show_icons=true&theme=default&hide_border=true&bg_color=00000000&text_color=24292f&icon_color=0969da&title_color=24292f&cache_seconds=86400&t=${cacheKey}`;
  }
});

const githubLangsUrl = computed(() => {
  const cacheKey = dailyCacheKey.value;
  if (isDarkMode.value) {
    return `https://github-readme-stats.vercel.app/api/top-langs/?username=${githubUsername}&layout=compact&theme=github_dark&hide_border=true&bg_color=00000000&text_color=e6edf3&title_color=e6edf3&hide=html&cache_seconds=86400&t=${cacheKey}`;
  } else {
    return `https://github-readme-stats.vercel.app/api/top-langs/?username=${githubUsername}&layout=compact&theme=default&hide_border=true&bg_color=00000000&text_color=24292f&title_color=24292f&hide=html&cache_seconds=86400&t=${cacheKey}`;
  }
});

// 监听主题变化
watch([isDarkMode, currentTheme], () => {
  // 主题变化时，更新日期缓存键以强制刷新图片
  dailyCacheKey.value = getTodayDateString();
}, { immediate: false });

// 监听DOM变化来检测主题切换
const observeThemeChanges = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'data-theme' || mutation.attributeName === 'class')) {
        // 延时更新，确保主题变化完成
        setTimeout(() => {
          updateThemeState();
        }, 50);
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class']
  });

  return observer;
};

// GitHub个人主页链接
const githubProfileUrl = computed(() => `https://github.com/${githubUsername}`);

// 获取GitHub用户统计数据
const fetchGitHubStats = async () => {
  isLoadingStats.value = true;
  try {
    const response = await fetch(
      `https://api.github.com/users/${githubUsername}`,
    );
    const userData: GitHubUser = await response.json();

    // 获取总提交数（通过events API估算）
    const eventsResponse = await fetch(
      `https://api.github.com/users/${githubUsername}/events?per_page=100`,
    );
    const events: GitHubEvent[] = await eventsResponse.json();

    let totalCommits = 0;
    events.forEach((event: GitHubEvent) => {
      if (event.type === "PushEvent") {
        totalCommits += event.payload.commits?.length || 0;
      }
    });

    // 更新统计数据
    githubStats.value = {
      totalCommits: totalCommits * 10, // 估算总提交数（最近100个事件的10倍）
      repositories: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
    };
  } catch (error) {
    console.error("获取GitHub统计数据失败:", error);
    // 保持默认值
    githubStats.value = {
      totalCommits: 1234,
      repositories: 56,
      followers: 89,
      following: 123,
    };
  } finally {
    isLoadingStats.value = false;
  }
};

onMounted(() => {
  // 初始化主题状态
  updateThemeState();
  
  // 检查并更新缓存键（确保每天更新）
  const today = getTodayDateString();
  if (dailyCacheKey.value !== today) {
    dailyCacheKey.value = today;
  }
  
  fetchGitHubStats();
  
  // 开始监听主题变化
  const themeObserver = observeThemeChanges();
  
  // 组件卸载时清理观察器
  onUnmounted(() => {
    themeObserver.disconnect();
  });
});
</script>

<template>
  <div class="bg-gray-50 dark:bg-zinc-900 py-6 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- 卡片网格布局 -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6"
      >
        <!-- 头像卡片 -->
        <CardView class="flex flex-col items-center">
          <div
            class="w-32 h-32 rounded-full overflow-hidden mb-4 ring-4 ring-blue-500 dark:ring-blue-400"
          >
            <img
              :src="personalInfo.avatar"
              :alt="personalInfo.name"
              class="w-full h-full object-cover"
            />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {{ personalInfo.name }}
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            {{ personalInfo.age }} 岁
          </p>
        </CardView>

        <!-- 个人信息卡片 -->
        <CardView class="md:col-span-2">
          <h3
            class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
          >
            <span class="mr-2">👋</span>
            自我介绍
          </h3>
          <p
            class="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line"
          >
            {{ personalInfo.bio }}
          </p>
        </CardView>

        <!-- GitHub统计卡片 -->
        <CardView>
          <h3
            class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
          >
            <span class="mr-2">📊</span>
            GitHub 统计
            <span v-if="isLoadingStats" class="ml-2 text-xs text-gray-500"
              >加载中...</span
            >
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">提交数</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{
                githubStats.totalCommits
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">仓库数</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{
                githubStats.repositories
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">关注者</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{
                githubStats.followers
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">关注中</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{
                githubStats.following
              }}</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-zinc-700">
            <a
              :href="githubProfileUrl"
              target="_blank"
              class="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white bg-gray-800 dark:bg-gray-700 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              访问 GitHub
            </a>
          </div>
        </CardView>

        <!-- GitHub Stats 卡片 -->
        <CardView class="md:col-span-2 lg:col-span-4">
          <h3
            class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
          >
            <span class="mr-2">📈</span>
            GitHub 数据统计
            <span v-if="isLoadingGitHubImages" class="ml-2 text-xs text-gray-500"
              >重新加载中...</span
            >
          </h3>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="flex justify-center">
              <img
                :src="githubStatsUrl"
                :key="`stats-${dailyCacheKey}-${isDarkMode}`"
                alt="GitHub Stats"
                class="max-w-full h-auto rounded-lg transition-opacity duration-300"
                @load="isLoadingGitHubImages = false"
                @loadstart="isLoadingGitHubImages = true"
                @error="isLoadingGitHubImages = false"
              />
            </div>
            <div class="flex justify-center">
              <img
                :src="githubLangsUrl"
                :key="`langs-${dailyCacheKey}-${isDarkMode}`"
                alt="Top Languages"
                class="max-w-full h-auto rounded-lg transition-opacity duration-300"
                @load="isLoadingGitHubImages = false"
                @loadstart="isLoadingGitHubImages = true" 
                @error="isLoadingGitHubImages = false"
              />
            </div>
          </div>
        </CardView>

        <!-- 兴趣爱好卡片 -->
        <CardView
          v-for="interest in interests"
          :key="interest.title"
          class="md:col-span-1 lg:col-span-2"
        >
          <div class="text-3xl mb-3">{{ interest.icon }}</div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ interest.title }}
          </h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm mb-3">
            {{ interest.description }}
          </p>
          <div class="border-t border-gray-200 dark:border-zinc-700 pt-3 mb-4">
            <p
              class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3"
            >
              {{ interest.details }}
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="item in interest.items"
                :key="item.name"
                class="flex justify-between items-center p-2 bg-gray-50 dark:bg-zinc-800 rounded text-xs"
              >
                <span class="text-gray-700 dark:text-gray-300 truncate mr-2">{{
                  item.name
                }}</span>
                <span
                  class="text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap"
                  >{{ item.status }}</span
                >
              </div>
            </div>
          </div>
        </CardView>

        <!-- GitHub提交活动卡片 - GitHub官方贡献图 -->
        <CardView class="md:col-span-2 lg:col-span-4">
          <h3
            class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
          >
            <span class="mr-2">📈</span>
            GitHub 贡献活动
          </h3>
          
          <!-- 使用 GitHub 官方的贡献图 -->
          <div class="w-full overflow-hidden rounded-lg">
            <img 
              :src="`https://ghchart.rshah.org/${githubUsername}`" 
              alt="GitHub 贡献图"
              class="w-full h-auto"
              loading="lazy"
            />
          </div>
        </CardView>

        <!-- 友链卡片 -->
        <CardView class="md:col-span-2 lg:col-span-4">
          <h3
            class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
          >
            <span class="mr-2">🔗</span>
            友情链接
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              v-for="friend in friends"
              :key="friend.name"
              :href="friend.url"
              target="_blank"
              class="block p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200"
            >
              <h4 class="font-semibold text-gray-900 dark:text-white mb-1">
                {{ friend.name }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ friend.description }}
              </p>
            </a>
          </div>
        </CardView>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}
</style>
