<script setup lang="ts">
import { ref, onMounted } from "vue";
import CardView from "@/components/CardView.vue";

// 服务数据
const services = ref([
  {
    id: 1,
    title: "前端/后端开发",
    icon: "🌐",
    description:
      "基于Vue的现代化前端开发，结合Rust actix-web，Java Spring等技术栈的后端开发服务",
    features: [
      "Vue.js/React 响应式前端界面",
      "Java Spring Boot 后端",
      "Rust actix-web 高性能API",
      "数据库设计与优化",
      "RESTful API 设计与实现",
      "前后端分离架构",
    ],
    technologies: [
      "Vue.js",
      "TypeScript",
      "Java",
      "Spring",
      "Rust",
      "MySQL",
      "Redis",
    ],
    price: "¥1000 +",
    duration: "1-3 周",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: 2,
    title: "PC端工具开发",
    icon: "🖥️",
    description:
      "使用Rust、C/C++、Java等编程语言开发高性能PC端工具软件，提供原生性能和优秀用户体验",
    features: [
      "跨平台桌面应用开发",
      "现代化UI设计",
      "高性能系统工具",
      "内存安全保证",
      "多线程并发处理",
    ],
    technologies: ["Rust", "Tauri", "C/C++", "Java", "Vue.js", "Electron"],
    price: "¥300 +",
    duration: "1-4 周",
    gradient: "from-purple-500 to-pink-600",
  },
  {
    id: 3,
    title: "生信软件开发",
    icon: "🧬",
    description:
      "专业的生物信息学工具开发，包括基因序列处理、高通量测序数据处理、数据可视化分析等各种文件处理工具",
    features: [
      "基因序列分析算法",
      "高通量测序数据处理",
      "生物数据可视化",
      "文件数据处理工具",
      "FASTA/FASTQ格式支持",
      "统计分析与报告生成",
    ],
    technologies: ["Rust", "Python", "BioPython", "R", "D3.js", "pandas"],
    price: "¥400 +",
    duration: "2-6 周",
    gradient: "from-green-500 to-teal-600",
  },
  {
    id: 4,
    title: "作业辅导/技术培训",
    icon: "🎓",
    description:
      "提供大学生软件设计作业辅导、编程技术培训、代码审查、技术咨询和项目指导服务",
    features: [
      "一对一编程指导",
      "软件设计作业辅导",
      "代码质量审查",
      "架构设计咨询",
      "学习路径规划",
      "技术面试指导",
    ],
    technologies: ["多语言支持", "最佳实践", "设计模式", "算法与数据结构"],
    price: "¥66+",
    duration: "灵活安排",
    gradient: "from-orange-500 to-red-600",
  },
]);

// 技术栈分类
const techStacks = ref([
  {
    category: "编程语言",
    icon: "💻",
    skills: [
      { name: "Rust", level: 90, color: "#CE422B" },
      { name: "Java", level: 85, color: "#ED8B00" },
      { name: "C/C++", level: 75, color: "#00599C" },
      { name: "JavaScript/TypeScript", level: 70, color: "#3178C6" },
      { name: "Python", level: 75, color: "#3776AB" },
      { name: "Kotlin", level: 70, color: "#7F52FF" },
    ],
  },
  {
    category: "框架/应用",
    icon: "🔧",
    skills: [
      { name: "Vue.js", level: 85, color: "#4FC08D" },
      { name: "Spring", level: 80, color: "#6DB33F" },
      { name: "Tauri", level: 80, color: "#FFC131" },
      { name: "Tokio", level: 60, color: "#CE422B" },
      { name: "MySQL", level: 85, color: "#4479A1" },
      { name: "Redis", level: 70, color: "#DC382D" },
      { name: "Android", level: 80, color: "#3DDC84" },
    ],
  },
  {
    category: "工具",
    icon: "🛠️",
    skills: [
      { name: "Git/GitHub", level: 90, color: "#F05032" },
      { name: "Linux", level: 85, color: "#FCC624" },
      { name: "Vim", level: 80, color: "#019733" },
      { name: "VSCode", level: 92, color: "#007ACC" },
      { name: "Docker", level: 70, color: "#2496ED" },
      { name: "AI Vibe coding", level: 88, color: "#009639" },
    ],
  },
]);

// 联系方式
const contacts = ref([
  {
    platform: "邮箱",
    value: "zhixiaovo@gmail.com",
    icon: "📧",
    link: "mailto:zhixiaovo@gmail.com",
    color: "text-red-600 dark:text-red-400",
  },
  {
    platform: "QQ",
    value: "2244697793",
    icon: "💬",
    link: "https://qm.qq.com/cgi-bin/qm/qr?k=your_qq_qr_code",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    platform: "微信",
    value: "hizhixia",
    icon: "💭",
    link: "#",
    color: "text-green-600 dark:text-green-400",
  },
  {
    platform: "Telegram",
    value: "t.me/zhixiaovo",
    icon: "✈️",
    link: "https://t.me/zhixiaovo",
    color: "text-sky-600 dark:text-sky-400",
  },
]);

// 动画状态
const isVisible = ref(false);

// 复制联系方式
const copyToClipboard = async (text: string, platform: string) => {
  try {
    await navigator.clipboard.writeText(text);
    // 这里可以添加提示消息
    console.log(`${platform} 已复制到剪贴板`);
  } catch (err) {
    console.error("复制失败:", err);
  }
};

onMounted(() => {
  // 延迟加载动画
  setTimeout(() => {
    isVisible.value = true;
  }, 100);
});
</script>

<template>
  <div class="bg-gray-50 dark:bg-zinc-900 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- 服务列表 -->
      <section class="mb-16">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <CardView
            v-for="service in services"
            :key="service.id"
            class="hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
            padding="p-0"
            css-width="w-full"
          >
            <div class="relative overflow-hidden">
              <!-- 背景渐变 -->
              <div
                class="absolute top-0 left-0 w-full h-40 bg-gradient-to-r"
                :class="service.gradient"
              ></div>

              <!-- 服务内容 -->
              <div class="relative p-6 pt-8">
                <div class="flex items-start mb-4">
                  <span class="text-4xl mr-4 mt-2">{{ service.icon }}</span>
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-white mb-2">
                      {{ service.title }}
                    </h3>
                    <div class="flex items-center text-white/80 text-sm">
                      <span class="mr-4">💰 {{ service.price }}</span>
                      <span>⏱️ {{ service.duration }}</span>
                    </div>
                  </div>
                </div>

                <div class="bg-white dark:bg-zinc-800 rounded-lg p-6 mt-6">
                  <p
                    class="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed"
                  >
                    {{ service.description }}
                  </p>

                  <!-- 特性列表 -->
                  <div class="mb-4">
                    <h4
                      class="font-semibold text-gray-900 dark:text-white mb-3"
                    >
                      服务内容：
                    </h4>
                    <ul class="space-y-2">
                      <li
                        v-for="feature in service.features"
                        :key="feature"
                        class="flex items-start text-sm text-gray-600 dark:text-gray-300"
                      >
                        <span class="text-green-500 mr-2 mt-0.5 flex-shrink-0"
                          >✓</span
                        >
                        <span>{{ feature }}</span>
                      </li>
                    </ul>
                  </div>

                  <!-- 技术标签 -->
                  <div>
                    <h4
                      class="font-semibold text-gray-900 dark:text-white mb-3"
                    >
                      技术栈：
                    </h4>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="tech in service.technologies"
                        :key="tech"
                        class="px-3 py-1 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-blue-100 dark:hover:bg-zinc-600 transition-colors"
                      >
                        {{ tech }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardView>
        </div>
      </section>

      <!-- 技术栈展示 -->
      <section class="mb-16">
        <h2
          class="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center"
        >
          技术栈
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <CardView
            v-for="(stack, index) in techStacks"
            :key="index"
            class="hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            padding="p-6"
          >

            <div class="flex items-center mb-6 relative z-10">
              <span class="text-2xl mr-3">{{ stack.icon }}</span>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ stack.category }}
              </h3>
            </div>

            <div class="space-y-4 relative z-10">
              <div
                v-for="skill in stack.skills"
                :key="skill.name"
                class="skill-item"
              >
                <div class="flex justify-between items-center mb-2">
                  <span class="font-medium text-gray-700 dark:text-gray-300">{{
                    skill.name
                  }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400"
                    >{{ skill.level }}%</span
                  >
                </div>
                <div
                  class="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2"
                >
                  <div
                    class="h-2 rounded-full transition-all duration-1000 ease-out"
                    :style="{
                      width: `${skill.level}%`,
                      backgroundColor: skill.color,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </CardView>
        </div>
      </section>

      <!-- 联系方式 -->
      <section class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          联系我
        </h2>
        <CardView
          class="max-w-4xl mx-auto relative overflow-hidden"
          padding="p-8"
        >
          <!-- 背景装饰 -->
          <div class="absolute top-0 right-0 w-32 h-32 opacity-5">
            <img
              src="/src/assets/zx.svg"
              alt="logo decoration"
              class="w-full h-full object-contain"
            />
          </div>

          <div class="relative z-10">
            <p
              class="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed"
            >
              准备开始您的项目了吗？我很乐意与您讨论项目需求，提供专业的技术方案。
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                v-for="contact in contacts"
                :key="contact.platform"
                @click="copyToClipboard(contact.value, contact.platform)"
                class="group cursor-pointer"
              >
                <div
                  class="p-4 rounded-lg border-2 border-gray-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div class="text-2xl mb-2">{{ contact.icon }}</div>
                  <div class="font-semibold text-gray-900 dark:text-white mb-1">
                    {{ contact.platform }}
                  </div>
                  <div
                    class="text-sm text-gray-600 dark:text-gray-300 break-all"
                  >
                    {{ contact.value }}
                  </div>
                  <div
                    class="text-xs text-blue-600 dark:text-blue-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    点击复制
                  </div>
                </div>
              </div>
            </div>

            <div
              class="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-700 rounded-lg"
            >
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">
                💡 服务流程
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div class="text-center">
                  <div class="text-blue-600 dark:text-blue-400 font-semibold">
                    1. 需求分析
                  </div>
                  <div class="text-gray-600 dark:text-gray-300">
                    深入了解项目需求
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-blue-600 dark:text-blue-400 font-semibold">
                    2. 技术方案
                  </div>
                  <div class="text-gray-600 dark:text-gray-300">
                    制定最优技术方案
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-blue-600 dark:text-blue-400 font-semibold">
                    3. 开发实现
                  </div>
                  <div class="text-gray-600 dark:text-gray-300">
                    高质量代码实现
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-blue-600 dark:text-blue-400 font-semibold">
                    4. 交付支持
                  </div>
                  <div class="text-gray-600 dark:text-gray-300">
                    项目交付及技术支持
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardView>
      </section>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.8s ease-out forwards;
}

.skill-item:hover .h-2 {
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计调整 */
@media (max-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .md\:grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
