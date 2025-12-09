<script lang="ts" setup>
import { ref, computed } from "vue";
import CardView from "@/components/CardView.vue";

// 类型定义
interface User {
  username: string;
  displayName: string;
  avatar?: string;
  verified?: boolean;
  followers?: number;
  liked?: boolean;
  retweeted?: boolean;
  commentText?: string;
}

interface LotteryConfig {
  winnerCount: number;
  requireLike: boolean;
  requireRetweet: boolean;
  keywords: string;
  minFollowers: number;
  excludeUsers: string;
  deduplication: boolean;
}

// 状态管理
const currentTab = ref<'html' | 'manual'>('html');
const htmlInput = ref('');
const manualInput = ref('');
const users = ref<User[]>([]);
const filteredUsers = ref<User[]>([]);
const winners = ref<User[]>([]);
const isProcessing = ref(false);
const parseError = ref('');

// 抽奖配置
const lotteryConfig = ref<LotteryConfig>({
  winnerCount: 1,
  requireLike: false,
  requireRetweet: false,
  keywords: '',
  minFollowers: 0,
  excludeUsers: '',
  deduplication: true,
});

// 统计信息
const stats = computed(() => ({
  total: users.value.length,
  filtered: filteredUsers.value.length,
  withLike: users.value.filter(u => u.liked).length,
  withRetweet: users.value.filter(u => u.retweeted).length,
  verified: users.value.filter(u => u.verified).length,
}));

/**
 * 解析 HTML 中的用户信息
 * 这是一个简化版本，实际需要根据 X 的 HTML 结构调整
 */
function parseHTMLInput() {
  isProcessing.value = true;
  parseError.value = '';
  users.value = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlInput.value, 'text/html');
    
    // 注意：以下选择器需要根据实际 X 网页结构调整
    // 这里提供一个示例结构
    const userElements = doc.querySelectorAll('[data-testid="tweet"]');
    
    const parsedUsers: User[] = [];
    userElements.forEach(element => {
      try {
        // 提取用户名（需要根据实际结构调整）
        const usernameEl = element.querySelector('[data-testid="User-Name"]');
        const username = usernameEl?.textContent?.match(/@(\w+)/)?.[1] || '';
        
        if (!username) return;

        // 提取显示名称
        const displayName = usernameEl?.textContent?.split('@')[0]?.trim() || username;
        
        // 提取头像
        const avatarEl = element.querySelector('img[src*="pbs.twimg.com"]') as HTMLImageElement;
        const avatar = avatarEl?.src || '';
        
        // 检测是否认证
        const verified = !!element.querySelector('[data-testid="icon-verified"]');
        
        // 提取评论文本
        const commentEl = element.querySelector('[data-testid="tweetText"]');
        const commentText = commentEl?.textContent || '';

        parsedUsers.push({
          username,
          displayName,
          avatar,
          verified,
          commentText,
          liked: false, // HTML 解析较难获取，可能需要用户手动标注
          retweeted: false,
        });
      } catch (err) {
        console.error('解析用户失败:', err);
      }
    });

    if (parsedUsers.length === 0) {
      parseError.value = '未能从 HTML 中解析出用户信息，请确保粘贴了完整的推文页面 HTML';
    } else {
      users.value = parsedUsers;
      applyFilters();
    }
  } catch (error) {
    parseError.value = '解析 HTML 失败: ' + (error as Error).message;
  } finally {
    isProcessing.value = false;
  }
}

/**
 * 解析手动输入的用户名列表
 */
function parseManualInput() {
  isProcessing.value = true;
  parseError.value = '';
  users.value = [];

  try {
    const lines = manualInput.value.split('\n').filter(line => line.trim());
    const parsedUsers: User[] = [];

    lines.forEach(line => {
      const username = line.trim().replace('@', '');
      if (username) {
        parsedUsers.push({
          username,
          displayName: username,
        });
      }
    });

    if (parsedUsers.length === 0) {
      parseError.value = '请输入至少一个用户名';
    } else {
      users.value = parsedUsers;
      applyFilters();
    }
  } catch (error) {
    parseError.value = '解析用户名失败: ' + (error as Error).message;
  } finally {
    isProcessing.value = false;
  }
}

/**
 * 应用筛选条件
 */
function applyFilters() {
  let filtered = [...users.value];

  // 点赞筛选
  if (lotteryConfig.value.requireLike) {
    filtered = filtered.filter(u => u.liked);
  }

  // 转发筛选
  if (lotteryConfig.value.requireRetweet) {
    filtered = filtered.filter(u => u.retweeted);
  }

  // 关键词筛选
  if (lotteryConfig.value.keywords.trim()) {
    const keywords = lotteryConfig.value.keywords.split(',').map(k => k.trim().toLowerCase());
    filtered = filtered.filter(u => 
      keywords.some(keyword => u.commentText?.toLowerCase().includes(keyword))
    );
  }

  // 粉丝数筛选
  if (lotteryConfig.value.minFollowers > 0) {
    filtered = filtered.filter(u => (u.followers || 0) >= lotteryConfig.value.minFollowers);
  }

  // 排除特定用户
  if (lotteryConfig.value.excludeUsers.trim()) {
    const excludeList = lotteryConfig.value.excludeUsers.split(',').map(u => u.trim().toLowerCase().replace('@', ''));
    filtered = filtered.filter(u => !excludeList.includes(u.username.toLowerCase()));
  }

  // 去重
  if (lotteryConfig.value.deduplication) {
    const seen = new Set<string>();
    filtered = filtered.filter(u => {
      if (seen.has(u.username.toLowerCase())) {
        return false;
      }
      seen.add(u.username.toLowerCase());
      return true;
    });
  }

  filteredUsers.value = filtered;
}

/**
 * 执行抽奖
 */
function drawLottery() {
  if (filteredUsers.value.length === 0) {
    alert('没有符合条件的用户可以抽奖');
    return;
  }

  const count = Math.min(lotteryConfig.value.winnerCount, filteredUsers.value.length);
  const pool = [...filteredUsers.value];
  const selected: User[] = [];

  // Fisher-Yates 洗牌算法
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    selected.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  winners.value = selected;
}

/**
 * 复制中奖用户名列表
 */
function copyWinners() {
  const text = winners.value.map(u => '@' + u.username).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板');
  });
}

/**
 * 导出为 JSON
 */
function exportJSON() {
  const data = {
    config: lotteryConfig.value,
    users: users.value,
    filtered: filteredUsers.value,
    winners: winners.value,
    timestamp: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `x-lottery-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 重置所有数据
 */
function resetAll() {
  if (confirm('确定要重置所有数据吗？')) {
    htmlInput.value = '';
    manualInput.value = '';
    users.value = [];
    filteredUsers.value = [];
    winners.value = [];
    parseError.value = '';
  }
}
</script>

<template>
  <div class="bg-gray-50 dark:bg-zinc-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🎲 X-Lottery
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          从 X (Twitter) 评论中随机抽取幸运用户
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧：数据输入 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 输入方式选择 -->
          <CardView>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              1️⃣ 数据输入
            </h2>

            <!-- Tab 切换 -->
            <div class="flex space-x-2 mb-4 border-b border-gray-200 dark:border-zinc-700">
              <button
                @click="currentTab = 'html'"
                :class="[
                  'px-4 py-2 font-medium transition-colors border-b-2',
                  currentTab === 'html'
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                ]"
              >
                📄 粘贴 HTML
              </button>
              <button
                @click="currentTab = 'manual'"
                :class="[
                  'px-4 py-2 font-medium transition-colors border-b-2',
                  currentTab === 'manual'
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                ]"
              >
                ✍️ 手动输入
              </button>
            </div>

            <!-- HTML 输入 -->
            <div v-if="currentTab === 'html'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  粘贴推文页面的完整 HTML
                </label>
                <textarea
                  v-model="htmlInput"
                  placeholder="1. 访问推文页面&#10;2. 按 F12 打开开发者工具&#10;3. 在 Elements 标签中右键 <html> 标签&#10;4. 选择 Copy -> Copy outerHTML&#10;5. 粘贴到这里"
                  class="w-full h-64 px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>
              <button
                @click="parseHTMLInput"
                :disabled="!htmlInput || isProcessing"
                class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {{ isProcessing ? '解析中...' : '解析 HTML' }}
              </button>
            </div>

            <!-- 手动输入 -->
            <div v-if="currentTab === 'manual'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  输入用户名列表（每行一个）
                </label>
                <textarea
                  v-model="manualInput"
                  placeholder="@username1&#10;@username2&#10;@username3"
                  class="w-full h-64 px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>
              <button
                @click="parseManualInput"
                :disabled="!manualInput || isProcessing"
                class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {{ isProcessing ? '处理中...' : '添加用户' }}
              </button>
            </div>

            <!-- 错误提示 -->
            <div v-if="parseError" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-red-800 dark:text-red-400">{{ parseError }}</p>
            </div>
          </CardView>

          <!-- 筛选条件 -->
          <CardView v-if="users.length > 0">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2️⃣ 筛选条件
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 点赞要求 -->
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="lotteryConfig.requireLike"
                  @change="applyFilters"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span class="text-gray-700 dark:text-gray-300">必须点赞</span>
              </label>

              <!-- 转发要求 -->
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="lotteryConfig.requireRetweet"
                  @change="applyFilters"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span class="text-gray-700 dark:text-gray-300">必须转发</span>
              </label>

              <!-- 去重 -->
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="lotteryConfig.deduplication"
                  @change="applyFilters"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span class="text-gray-700 dark:text-gray-300">去除重复用户</span>
              </label>

              <!-- 最低粉丝数 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  最低粉丝数
                </label>
                <input
                  type="number"
                  v-model.number="lotteryConfig.minFollowers"
                  @input="applyFilters"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- 关键词 -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  评论包含关键词（逗号分隔）
                </label>
                <input
                  type="text"
                  v-model="lotteryConfig.keywords"
                  @input="applyFilters"
                  placeholder="例如：抽奖,参与,转发"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- 排除用户 -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  排除用户（逗号分隔）
                </label>
                <input
                  type="text"
                  v-model="lotteryConfig.excludeUsers"
                  @input="applyFilters"
                  placeholder="例如：@user1,@user2"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardView>

          <!-- 抽奖设置 -->
          <CardView v-if="filteredUsers.length > 0">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              3️⃣ 开始抽奖
            </h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  中奖人数
                </label>
                <input
                  type="number"
                  v-model.number="lotteryConfig.winnerCount"
                  min="1"
                  :max="filteredUsers.length"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  符合条件的用户共 {{ filteredUsers.length }} 人
                </p>
              </div>

              <button
                @click="drawLottery"
                class="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-lg transition-all transform hover:scale-105"
              >
                🎉 开始抽奖
              </button>
            </div>
          </CardView>
        </div>

        <!-- 右侧：统计信息和结果 -->
        <div class="space-y-6">
          <!-- 统计信息 -->
          <CardView v-if="users.length > 0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 统计信息
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">总用户数</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ stats.total }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">符合条件</span>
                <span class="font-bold text-green-600 dark:text-green-400">{{ stats.filtered }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">已点赞</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ stats.withLike }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">已转发</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ stats.withRetweet }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">认证用户</span>
                <span class="font-bold text-blue-600 dark:text-blue-400">{{ stats.verified }}</span>
              </div>
            </div>

            <button
              @click="resetAll"
              class="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              🔄 重置
            </button>
          </CardView>

          <!-- 中奖结果 -->
          <CardView v-if="winners.length > 0" class="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🎊 中奖名单
            </h3>
            
            <div class="space-y-3 mb-4">
              <div
                v-for="(winner, index) in winners"
                :key="index"
                class="flex items-center space-x-3 p-3 bg-white dark:bg-zinc-800 rounded-lg"
              >
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  {{ index + 1 }}
                </div>
                <div v-if="winner.avatar" class="flex-shrink-0">
                  <img :src="winner.avatar" :alt="winner.username" class="w-10 h-10 rounded-full" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ winner.displayName }}
                    <span v-if="winner.verified" class="text-blue-500">✓</span>
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">@{{ winner.username }}</p>
                </div>
              </div>
            </div>

            <div class="flex space-x-2">
              <button
                @click="copyWinners"
                class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                📋 复制
              </button>
              <button
                @click="exportJSON"
                class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                💾 导出
              </button>
            </div>
          </CardView>

          <!-- 使用说明 -->
          <CardView>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📖 使用说明
            </h3>
            <div class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p><strong>方式一：粘贴 HTML</strong></p>
              <ol class="list-decimal list-inside space-y-1 ml-2">
                <li>访问 X 上的推文</li>
                <li>按 F12 打开开发者工具</li>
                <li>右键点击 &lt;html&gt; 标签</li>
                <li>选择 Copy → Copy outerHTML</li>
                <li>粘贴到输入框</li>
              </ol>

              <p class="pt-2"><strong>方式二：手动输入</strong></p>
              <p class="ml-2">直接输入用户名列表，每行一个</p>

              <p class="pt-2 text-xs text-gray-500 dark:text-gray-500">
                ⚠️ 注意：HTML 解析功能依赖于 X 的网页结构，可能需要根据实际情况调整。
              </p>
            </div>
          </CardView>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 平滑过渡效果 */
button {
  transition: all 0.2s ease-in-out;
}

/* 输入框焦点样式 */
textarea:focus,
input:focus {
  outline: none;
}

/* 滚动条样式 */
textarea::-webkit-scrollbar {
  width: 8px;
}

textarea::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}
</style>
