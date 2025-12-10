<script setup lang="ts">
import { ref, onMounted } from "vue";
import CardView from "@/components/CardView.vue";

// 服务数据
const services = ref([
  {
    id: 1,
    title: "前端/后端开发",
    icon: "🌐",
    description: "前端-Vue; 后端: Rust axum, actix-web",
    features: [
      "Vue.js 前端",
      "Rust axum, actix-web 后端",
      "SQL, Redis数据库",
      "RESTful API",
    ],
    technologies: ["Vue.js", "TypeScript", "Rust", "Axum", "SQL", "Redis"],
    price: "¥1000 +",
    duration: "1-3 周",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: 2,
    title: "PC端工具开发",
    icon: "🖥️",
    description: "使用Rust、C/C++、Java等编程语言开发高性能PC端工具软件",
    features: ["跨平台桌面应用开发", "UI设计", "系统工具", "内存安全", "并发"],
    technologies: ["Rust", "Tauri", "C/C++", "Java", "Vue.js"],
    price: "¥300 +",
    duration: "1-4 周",
    gradient: "from-purple-500 to-pink-600",
  },
  {
    id: 3,
    title: "生信软件开发",
    icon: "🧬",
    description:
      "生物信息学工具开发，包括基因序列处理、高通量测序数据处理、数据可视化分析等各种工具",
    features: [
      "基因序列分析",
      "高通量测序数据处理",
      "数据可视化",
      "文件数据处理",
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
      "学生软件设计作业辅导、编程教学、代码审查、技术咨询和项目指导服务",
    features: [
      "一对一编程指导",
      "软件设计作业辅导",
      "代码质量审查",
      "学习路径规划",
    ],
    technologies: ["多种编程语言", "最佳实践", "设计模式", "算法与数据结构"],
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
    skills: ["Rust", "Java", "C/C++", "JavaScript/TypeScript", "Python", "Kotlin"],
  },
  {
    category: "框架/应用",
    icon: "🔧",
    skills: ["Vue.js", "Tauri", "Axum", "SQL", "Redis", "Android"],
  },
  {
    category: "工具",
    icon: "🛠️",
    skills: ["Git/GitHub", "Linux", "Vim", "VSCode", "Docker", "Vibe coding"],
  },
]);


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
            <div class="flex items-center mb-4">
              <span class="text-2xl mr-3">{{ stack.icon }}</span>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ stack.category }}
              </h3>
            </div>

            <div class="flex flex-wrap gap-2">
              <span
                v-for="skill in stack.skills"
                :key="skill"
                class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-default"
              >
                {{ skill }}
              </span>
            </div>
          </CardView>
        </div>
      </section>
    </div>
  </div>
</template>
