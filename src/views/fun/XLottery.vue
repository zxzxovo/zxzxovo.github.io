<template>
  <div class="bg-gray-50 dark:bg-zinc-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="mb-8 text-center relative">
        <!-- 明暗模式切换按钮 -->
        <button
          @click="toggleTheme"
          class="absolute right-0 top-0 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800 transition-colors"
          aria-label="切换主题"
        >
          <svg
            v-if="isDarkMode"
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <!-- 太阳图标 -->
            <path
              fill-rule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <!-- 月亮图标 -->
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>

        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🎲 X-Lottery
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          从 X (Twitter) 评论中随机抽取幸运用户
        </p>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- 左侧边栏：提示信息 -->
        <aside class="lg:w-80 space-y-6">
          <!-- 重要提示 -->
          <CardView>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span class="mr-2">⚠️</span>
              重要提示
            </h3>
            <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p class="text-yellow-800 dark:text-yellow-300 font-medium mb-1">
                  📌 加载所有评论
                </p>
                <p class="text-yellow-700 dark:text-yellow-400">
                  在 X 网页上向下滚动到底部，确保加载完<strong>所有评论</strong>后再保存或复制 HTML。
                </p>
              </div>
              
              <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p class="text-blue-800 dark:text-blue-300 font-medium mb-1">
                  💡 推荐方式
                </p>
                <p class="text-blue-700 dark:text-blue-400">
                  使用浏览器"保存网页"功能（Ctrl+S）保存为 HTML 文件，然后上传文件，这样最可靠。
                </p>
              </div>

              <div class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p class="text-amber-800 dark:text-amber-300 font-medium mb-1">
                  🔒 隐私安全
                </p>
                <p class="text-amber-700 dark:text-amber-400">
                  所有数据仅在浏览器本地处理，不会上传到任何服务器。
                </p>
              </div>
            </div>
          </CardView>

          <!-- 使用说明 -->
          <CardView>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📖 使用说明
            </h3>
            <div class="text-sm text-gray-600 dark:text-gray-400 space-y-3">
              <div>
                <p class="font-medium text-gray-900 dark:text-white mb-1">方式一：上传 HTML 文件（推荐）</p>
                <ol class="list-decimal list-inside space-y-1 ml-2 text-xs">
                  <li>打开 X 上的推文页面</li>
                  <li>滚动加载所有评论</li>
                  <li>按 Ctrl+S 保存网页</li>
                  <li>选择"网页，仅 HTML"</li>
                  <li>点击上传按钮选择文件</li>
                </ol>
              </div>

              <div>
                <p class="font-medium text-gray-900 dark:text-white mb-1">方式二：粘贴 HTML</p>
                <ol class="list-decimal list-inside space-y-1 ml-2 text-xs">
                  <li>打开开发者工具（F12）</li>
                  <li>右键 &lt;html&gt; 标签</li>
                  <li>Copy → Copy outerHTML</li>
                  <li>粘贴到输入框</li>
                </ol>
              </div>

              <div>
                <p class="font-medium text-gray-900 dark:text-white mb-1">方式三：手动输入</p>
                <p class="ml-2 text-xs">每行输入一个用户名</p>
              </div>
            </div>
          </CardView>

          <!-- 统计信息 -->
          <CardView v-if="users.length > 0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 统计信息
            </h3>
            <div class="space-y-3 text-sm">
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
          </CardView>
        </aside>

        <!-- 主内容区：数据输入、筛选和抽奖 -->
        <main class="flex-1 space-y-6">
          <!-- 数据输入 -->
          <CardView>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              1️⃣ 数据输入
            </h2>

            <!-- Tab 切换 -->
            <div class="flex space-x-2 mb-4 border-b border-gray-200 dark:border-zinc-700">
              <button
                @click="currentTab = 'file'"
                :class="[
                  'px-4 py-2 font-medium transition-colors border-b-2',
                  currentTab === 'file'
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                ]"
              >
                📁 上传文件
              </button>
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

            <!-- 文件上传 -->
            <div v-if="currentTab === 'file'" class="space-y-4">
              <div class="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-8 text-center">
                <input
                  ref="fileInput"
                  type="file"
                  accept=".html,.htm"
                  @change="handleFileUpload"
                  class="hidden"
                />
                <div class="mb-4">
                  <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <button
                  @click="triggerFileInput"
                  :disabled="isProcessing"
                  class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  {{ isProcessing ? '处理中...' : '选择 HTML 文件' }}
                </button>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  或拖拽文件到此处（仅支持 .html 文件）
                </p>
              </div>
            </div>

            <!-- HTML 输入 -->
            <div v-if="currentTab === 'html'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  粘贴推文页面的完整 HTML
                </label>
                <textarea
                  v-model="htmlInput"
                  placeholder="粘贴从开发者工具复制的 HTML 代码..."
                  class="w-full h-48 px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
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
                  class="w-full h-48 px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <p class="text-red-800 dark:text-red-400 text-sm">{{ parseError }}</p>
            </div>
          </CardView>

          <!-- 筛选条件 -->
          <CardView v-if="users.length > 0">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2️⃣ 筛选条件
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 排除自己 -->
              <div class="md:col-span-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <label class="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="excludeSelf"
                    @change="applyFilters"
                    class="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div class="flex-1">
                    <span class="text-gray-900 dark:text-gray-100 font-medium">排除自己</span>
                    <input
                      v-if="excludeSelf"
                      type="text"
                      v-model="selfUsername"
                      @input="applyFilters"
                      placeholder="自动检测或手动输入 @username"
                      class="w-full mt-2 px-3 py-1.5 text-sm border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </label>
              </div>

              <!-- 点赞要求（暂时禁用） -->
              <label class="flex items-center space-x-2 cursor-not-allowed opacity-50">
                <input
                  type="checkbox"
                  v-model="lotteryConfig.requireLike"
                  @change="applyFilters"
                  disabled
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span class="text-gray-700 dark:text-gray-300">必须点赞（暂不可用）</span>
              </label>

              <!-- 转发要求（暂时禁用） -->
              <label class="flex items-center space-x-2 cursor-not-allowed opacity-50">
                <input
                  type="checkbox"
                  v-model="lotteryConfig.requireRetweet"
                  @change="applyFilters"
                  disabled
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span class="text-gray-700 dark:text-gray-300">必须转发（暂不可用）</span>
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

              <!-- 最低粉丝数（暂时禁用） -->
              <div class="opacity-50">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  最低粉丝数（暂不可用）
                </label>
                <input
                  type="number"
                  v-model.number="lotteryConfig.minFollowers"
                  @input="applyFilters"
                  min="0"
                  disabled
                  class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
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
                  排除其他用户（逗号分隔）
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

          <!-- 抽奖设置和结果 -->
          <CardView v-if="filteredUsers.length > 0">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              3️⃣ 开始抽奖
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="md:col-span-2">
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

              <div class="flex items-end">
                <button
                  @click="drawLottery"
                  class="w-full px-6 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                >
                  🎉 开始抽奖
                </button>
              </div>
            </div>

            <!-- 中奖结果 -->
            <div v-if="winners.length > 0" class="border-t border-gray-200 dark:border-zinc-700 pt-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  🎊 中奖名单
                </h3>
                <div class="flex space-x-2">
                  <button
                    @click="copyWinners"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    📋 复制
                  </button>
                  <button
                    @click="exportJSON"
                    class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  >
                    💾 导出
                  </button>
                  <button
                    @click="resetAll"
                    class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                  >
                    🔄 重置
                  </button>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div
                  v-for="(winner, index) in winners"
                  :key="index"
                  class="flex items-center space-x-3 p-3 bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-700"
                >
                  <div class="shrink-0 w-10 h-10 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {{ index + 1 }}
                  </div>
                  <div v-if="winner.avatar" class="shrink-0">
                    <img :src="winner.avatar" :alt="winner.username" class="w-10 h-10 rounded-full" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 dark:text-white truncate text-sm">
                      {{ winner.displayName }}
                      <span v-if="winner.verified" class="text-blue-500">✓</span>
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">@{{ winner.username }}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardView>

          <!-- 空状态 -->
          <CardView v-if="users.length === 0" class="text-center py-16">
            <div class="text-6xl mb-4">🎲</div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              开始你的抽奖
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              选择上方数据输入方式开始
            </p>
          </CardView>
        </main>
      </div>
    </div>

    <!-- 导出 JSON 弹窗 -->
    <div
      v-if="showExportModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showExportModal = false"
    >
      <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        <!-- 弹窗标题 -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            导出中奖结果
          </h3>
          <button
            @click="showExportModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 格式选择 -->
        <div class="px-6 py-3 bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-700">
          <div class="flex items-center gap-4">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">格式：</span>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="json"
                v-model="exportFormat"
                @change="exportJsonText = generateExportContent()"
                class="w-4 h-4 text-blue-600"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">JSON</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="toml"
                v-model="exportFormat"
                @change="exportJsonText = generateExportContent()"
                class="w-4 h-4 text-blue-600"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">TOML</span>
            </label>
          </div>
        </div>

        <!-- 内容显示 -->
        <div class="flex-1 overflow-auto p-6">
          <pre class="bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg text-sm text-gray-800 dark:text-gray-200 overflow-x-auto font-mono text-left">{{ exportJsonText }}</pre>
        </div>

        <!-- 按钮组 -->
        <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-700">
          <button
            @click="showExportModal = false"
            class="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium"
          >
            关闭
          </button>
          <button
            @click="copyJSON"
            class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            复制 JSON
          </button>
          <button
            @click="saveJSON"
            class="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            保存文件
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CardView from '@/components/CardView.vue'

// 数据类型定义
interface User {
  username: string
  displayName?: string
  avatar?: string
  verified?: boolean
  liked?: boolean
  retweeted?: boolean
  followers?: number
  comment?: string
}

interface LotteryConfig {
  requireLike: boolean
  requireRetweet: boolean
  minFollowers: number
  keywords: string
  excludeUsers: string
  deduplication: boolean
  winnerCount: number
}

// 响应式数据
const currentTab = ref<'html' | 'manual' | 'file'>('file')
const htmlInput = ref('')
const manualInput = ref('')
const fileInput = ref<HTMLInputElement>()
const isProcessing = ref(false)
const parseError = ref('')

const users = ref<User[]>([])
const filteredUsers = ref<User[]>([])
const winners = ref<User[]>([])

// 排除自己
const excludeSelf = ref(true)
const selfUsername = ref('')

// 导出弹窗
const showExportModal = ref(false)
const exportJsonText = ref('')
const exportFormat = ref<'json' | 'toml'>('json')

const lotteryConfig = ref<LotteryConfig>({
  requireLike: false,
  requireRetweet: false,
  minFollowers: 0,
  keywords: '',
  excludeUsers: '',
  deduplication: true,
  winnerCount: 1
})

// 检测当前主题
const isDarkMode = computed(() => {
  return document.documentElement.getAttribute('data-theme') === 'dark'
})

// 切换明暗主题
const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('theme', newTheme)
}

// 统计信息
const stats = computed(() => ({
  total: users.value.length,
  filtered: filteredUsers.value.length,
  withLike: users.value.filter(u => u.liked).length,
  withRetweet: users.value.filter(u => u.retweeted).length,
  verified: users.value.filter(u => u.verified).length
}))

// 解析 HTML
const parseHTMLInput = () => {
  isProcessing.value = true
  parseError.value = ''

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlInput.value, 'text/html')
    
    // 查找所有评论（article元素）
    const articles = doc.querySelectorAll('article[data-testid="tweet"]')
    const foundUsers: User[] = []
    const usernameSet = new Set<string>()

    // 首先尝试获取发帖人ID（自动排除）
    if (!selfUsername.value) {
      const firstArticle = articles[0]
      if (firstArticle) {
        const authorLinks = firstArticle.querySelectorAll('a[href^="/"]')
        for (const link of authorLinks) {
          const href = link.getAttribute('href') || ''
          const match = href.match(/^\/([a-zA-Z0-9_]+)$/)
          if (match && match[1] && match[1] !== 'i' && match[1] !== 'compose') {
            selfUsername.value = match[1]
            console.log(`自动检测到发帖人: @${selfUsername.value}`)
            break
          }
        }
      }
    }

    articles.forEach((article, index) => {
      // 跳过第一条（原帖）
      if (index === 0) return
      
      // 方法1: 通过链接提取用户名
      const userLinks = article.querySelectorAll('a[href^="/"]')
      let username = ''
      let displayName = ''
      
      for (const link of userLinks) {
        const href = link.getAttribute('href') || ''
        // 匹配 /username 格式（不包含 /status/ 的链接）
        const match = href.match(/^\/([a-zA-Z0-9_]+)$/)
        if (match && match[1] && match[1] !== 'i' && match[1] !== 'compose') {
          username = match[1]
          break
        }
      }

      // 方法2: 如果方法1失败，尝试从 data-testid="User-Name" 中提取
      if (!username) {
        const userNameDiv = article.querySelector('[data-testid="User-Name"]')
        if (userNameDiv) {
          const spans = userNameDiv.querySelectorAll('span')
          spans.forEach(span => {
            const text = span.textContent?.trim() || ''
            if (text.startsWith('@')) {
              username = text.substring(1)
            }
          })
        }
      }

      // 如果还是没找到，跳过这条
      if (!username || usernameSet.has(username.toLowerCase())) return

      // 提取显示名称
      const userNameElement = article.querySelector('[data-testid="User-Name"]')
      if (userNameElement) {
        const spans = userNameElement.querySelectorAll('span')
        let foundAt = false
        for (const span of spans) {
          const text = span.textContent?.trim() || ''
          if (text.startsWith('@')) {
            foundAt = true
            break
          }
          if (!foundAt && text && !text.includes('·') && text.length > 0) {
            displayName = text
          }
        }
      }

      if (!displayName) {
        displayName = username
      }

      // 提取头像
      const avatarElement = article.querySelector('img[src*="profile_images"]') as HTMLImageElement
      const avatar = avatarElement?.src

      // 检查认证状态
      const verified = article.querySelector('svg[aria-label*="Verified"]') !== null || 
                       article.querySelector('[data-testid="icon-verified"]') !== null

      // 提取评论文本
      const commentElement = article.querySelector('[data-testid="tweetText"]')
      const comment = commentElement?.textContent?.trim()

      // 检查是否点赞（like）
      const likeButton = article.querySelector('[data-testid="like"]')
      const liked = likeButton?.getAttribute('aria-label')?.includes('Liked') || false

      // 检查是否转发（retweet）
      const retweetButton = article.querySelector('[data-testid="retweet"]')
      const retweeted = retweetButton?.getAttribute('aria-label')?.includes('Retweeted') || false

      usernameSet.add(username.toLowerCase())
      
      foundUsers.push({
        username,
        displayName,
        avatar,
        verified,
        comment,
        liked,
        retweeted
      })
    })

    if (foundUsers.length === 0) {
      parseError.value = '未找到有效用户数据。请确保：\n1. 已加载所有评论\n2. 复制了完整的 HTML\n3. 或尝试使用"上传文件"或"手动输入"方式'
    } else {
      users.value = foundUsers
      applyFilters()
      console.log(`成功解析 ${foundUsers.length} 个用户`)
    }
  } catch (error) {
    console.error('HTML 解析失败:', error)
    parseError.value = '解析失败，请检查 HTML 格式是否正确'
  } finally {
    isProcessing.value = false
  }
}

// 文件上传
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  isProcessing.value = true
  parseError.value = ''
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    htmlInput.value = content
    parseHTMLInput()
  }
  
  reader.onerror = () => {
    parseError.value = '文件读取失败，请重试'
    isProcessing.value = false
  }
  
  reader.readAsText(file)
}

// 手动输入
const parseManualInput = () => {
  isProcessing.value = true
  parseError.value = ''

  try {
    const lines = manualInput.value.split('\n').filter(line => line.trim())
    const foundUsers: User[] = []

    lines.forEach(line => {
      const username = line.trim().replace('@', '')
      if (username) {
        foundUsers.push({ username, displayName: username })
      }
    })

    if (foundUsers.length === 0) {
      parseError.value = '未找到有效用户名'
    } else {
      users.value = foundUsers
      applyFilters()
    }
  } catch (error) {
    console.error('手动输入解析失败:', error)
    parseError.value = '解析失败，请检查格式'
  } finally {
    isProcessing.value = false
  }
}

// 应用筛选条件
const applyFilters = () => {
  let filtered = [...users.value]

  // 排除自己
  if (excludeSelf.value && selfUsername.value.trim()) {
    const self = selfUsername.value.trim().replace('@', '').toLowerCase()
    filtered = filtered.filter(u => u.username.toLowerCase() !== self)
  }

  // 去重
  if (lotteryConfig.value.deduplication) {
    const seen = new Set<string>()
    filtered = filtered.filter(u => {
      const key = u.username.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // 点赞要求
  if (lotteryConfig.value.requireLike) {
    filtered = filtered.filter(u => u.liked)
  }

  // 转发要求
  if (lotteryConfig.value.requireRetweet) {
    filtered = filtered.filter(u => u.retweeted)
  }

  // 最低粉丝数
  if (lotteryConfig.value.minFollowers > 0) {
    filtered = filtered.filter(u => (u.followers || 0) >= lotteryConfig.value.minFollowers)
  }

  // 关键词筛选
  if (lotteryConfig.value.keywords.trim()) {
    const keywords = lotteryConfig.value.keywords.split(',').map(k => k.trim().toLowerCase())
    filtered = filtered.filter(u => {
      const comment = (u.comment || '').toLowerCase()
      return keywords.some(keyword => comment.includes(keyword))
    })
  }

  // 排除用户
  if (lotteryConfig.value.excludeUsers.trim()) {
    const excludeList = lotteryConfig.value.excludeUsers
      .split(',')
      .map(u => u.trim().replace('@', '').toLowerCase())
    filtered = filtered.filter(u => !excludeList.includes(u.username.toLowerCase()))
  }

  filteredUsers.value = filtered
}

// 抽奖（改进的 Fisher-Yates 洗牌算法）
const drawLottery = () => {
  if (filteredUsers.value.length === 0) return

  const pool = [...filteredUsers.value]
  const count = Math.min(lotteryConfig.value.winnerCount, pool.length)
  const result: User[] = []

  // 使用 Fisher-Yates 洗牌算法，从后向前遍历
  for (let i = pool.length - 1; i > pool.length - 1 - count; i--) {
    // 使用 crypto.getRandomValues 获取更好的随机数
    const randomBuffer = new Uint32Array(1)
    crypto.getRandomValues(randomBuffer)
    const random = randomBuffer[0] / (0xFFFFFFFF + 1)
    
    const j = Math.floor(random * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
    result.push(pool[i])
  }

  winners.value = result
}

// 复制中奖名单
const copyWinners = async () => {
  const text = winners.value.map(w => `@${w.username}`).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板！')
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败，请手动复制')
  }
}

// 生成导出内容
const generateExportContent = () => {
  if (exportFormat.value === 'json') {
    // 只导出用户名数组
    const usernames = winners.value.map(w => w.username)
    return JSON.stringify(usernames, null, 2)
  } else {
    // TOML 格式
    const usernames = winners.value.map(w => w.username)
    let toml = '# X-Lottery 中奖名单\n'
    toml += `# 生成时间: ${new Date().toLocaleString('zh-CN')}\n`
    toml += `# 中奖人数: ${winners.value.length}\n\n`
    toml += 'winners = [\n'
    usernames.forEach((username, index) => {
      toml += `  "${username}"${index < usernames.length - 1 ? ',' : ''}\n`
    })
    toml += ']\n'
    return toml
  }
}

// 导出
const exportJSON = () => {
  exportJsonText.value = generateExportContent()
  showExportModal.value = true
}

// 复制 JSON
const copyJSON = async () => {
  try {
    await navigator.clipboard.writeText(exportJsonText.value)
    alert('JSON 已复制到剪贴板！')
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败，请手动复制')
  }
}

// 保存文件
const saveJSON = () => {
  const extension = exportFormat.value === 'json' ? 'json' : 'toml'
  const mimeType = exportFormat.value === 'json' ? 'application/json' : 'text/plain'
  const blob = new Blob([exportJsonText.value], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lottery-winners-${Date.now()}.${extension}`
  a.click()
  URL.revokeObjectURL(url)
}

// 重置
const resetAll = () => {
  if (confirm('确定要重置所有数据吗？')) {
    users.value = []
    filteredUsers.value = []
    winners.value = []
    htmlInput.value = ''
    manualInput.value = ''
    parseError.value = ''
  }
}
</script>
