<script lang="ts" setup>
import { ref, computed } from "vue";
import CardView from "@/components/CardView.vue";

// 定义保险项目接口
interface InsuranceItem {
  name: string;
  enabled: boolean;
  personalRate: number;
  companyRate: number;
}

// 定义税率表项目接口
interface TaxBracket {
  limit: number;
  rate: number;
  deduction: number;
  name: string;
}

// 工资组成部分
const baseSalary = ref(10000); // 底薪
const commission = ref(3000); // 提成
const allowance = ref(2000); // 津贴补贴
const bonus = ref(0); // 奖金

// 计算总工资
const salary = computed(() => baseSalary.value + commission.value + allowance.value + bonus.value);

const baseMin = ref(4000); // 社保基数下限
const baseMax = ref(25000); // 社保基数上限

// 默认社保项目配置
const defaultInsuranceItems: InsuranceItem[] = [
  { name: "养老保险", enabled: true, personalRate: 8, companyRate: 16 },
  { name: "医疗保险", enabled: true, personalRate: 2, companyRate: 10 },
  { name: "失业保险", enabled: true, personalRate: 0.5, companyRate: 0.5 },
  { name: "工伤保险", enabled: true, personalRate: 0, companyRate: 0.2 },
  { name: "生育保险", enabled: true, personalRate: 0, companyRate: 0.8 },
  { name: "住房公积金", enabled: true, personalRate: 12, companyRate: 12 },
];

const insuranceItems = ref<InsuranceItem[]>(JSON.parse(JSON.stringify(defaultInsuranceItems)));

// 个人所得税税率表（2024年标准），允许用户修改
const defaultTaxBrackets: TaxBracket[] = [
  { limit: 36000, rate: 3, deduction: 0, name: "3万6以下" },
  { limit: 144000, rate: 10, deduction: 2520, name: "3万6-14万4" },
  { limit: 300000, rate: 20, deduction: 16920, name: "14万4-30万" },
  { limit: 420000, rate: 25, deduction: 31920, name: "30万-42万" },
  { limit: 660000, rate: 30, deduction: 52920, name: "42万-66万" },
  { limit: 960000, rate: 35, deduction: 85920, name: "66万-96万" },
  { limit: Infinity, rate: 45, deduction: 181920, name: "96万以上" },
];

const taxBrackets = ref<TaxBracket[]>(JSON.parse(JSON.stringify(defaultTaxBrackets)));

// 检测当前主题
const isDarkMode = computed(() => {
  if (typeof document !== 'undefined') {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }
  return false;
});

// 切换明暗主题
const toggleTheme = () => {
  if (typeof document !== 'undefined') {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  }
};

// 打开链接
const openLink = (url: string) => {
  window.open(url, '_blank');
};

// 计算结果
const results = computed(() => {
  const monthlySalary = salary.value || 0;
  let personalTotal = 0;
  let companyTotal = 0;

  // 计算社保基数（在基数范围内）
  const socialSecurityBase = Math.max(baseMin.value, Math.min(monthlySalary, baseMax.value));

  const itemCalculations = insuranceItems.value.map((item: InsuranceItem) => {
    if (!item.enabled) {
      return { name: item.name, personal: 0, company: 0 };
    }
    
    const personal = (socialSecurityBase * item.personalRate) / 100;
    const company = (socialSecurityBase * item.companyRate) / 100;
    personalTotal += personal;
    companyTotal += company;
    
    return { name: item.name, personal, company };
  });

  // 计算个人所得税
  const taxableIncome = Math.max(0, monthlySalary - personalTotal - 5000); // 减去个人缴纳和基本免征额
  const annualTaxableIncome = taxableIncome * 12;

  let tax = 0;
  for (const bracket of taxBrackets.value) {
    if (annualTaxableIncome <= bracket.limit) {
      tax = (annualTaxableIncome * (bracket.rate / 100) - bracket.deduction) / 12;
      break;
    }
  }
  tax = Math.max(0, tax);

  const takeHomePay = monthlySalary - personalTotal - tax;

  return {
    socialSecurityBase,
    personalTotal,
    companyTotal,
    tax,
    takeHomePay,
    itemCalculations,
  };
});

// 重置为默认值
const resetToDefault = () => {
  baseSalary.value = 10000;
  commission.value = 3000;
  allowance.value = 2000;
  bonus.value = 0;
  baseMin.value = 4000;
  baseMax.value = 25000;
  insuranceItems.value = JSON.parse(JSON.stringify(defaultInsuranceItems));
  taxBrackets.value = JSON.parse(JSON.stringify(defaultTaxBrackets));
};
</script>

<template>
  <div class="h-screen bg-gray-50 dark:bg-zinc-900 py-6 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- 标题和主题切换 -->
      <div class="flex flex-col items-center mb-8 relative">
        <button
          @click="toggleTheme"
          class="absolute right-0 top-0 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800"
          aria-label="切换主题"
        >
          <svg
            v-if="isDarkMode"
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
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
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>

        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          💰 社保及个税计算器
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400">
          根据最新政策计算您的薪资详情
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左侧输入区域 -->
        <div class="flex flex-col gap-6">
          <!-- 基本信息 -->
          <CardView>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span class="mr-2">📊</span>
              基本信息
            </h3>
            <div class="space-y-4">
              <!-- 工资组成部分 -->
              <div class="space-y-3">
                <h4 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">工资组成</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      底薪 (元)
                    </label>
                    <input
                      type="number"
                      v-model.number="baseSalary"
                      class="w-full p-3 border rounded-lg bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                      placeholder="基本工资"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      提成 (元)
                    </label>
                    <input
                      type="number"
                      v-model.number="commission"
                      class="w-full p-3 border rounded-lg bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                      placeholder="销售提成"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      津贴补贴 (元)
                    </label>
                    <input
                      type="number"
                      v-model.number="allowance"
                      class="w-full p-3 border rounded-lg bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                      placeholder="各种津贴"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      奖金 (元)
                    </label>
                    <input
                      type="number"
                      v-model.number="bonus"
                      class="w-full p-3 border rounded-lg bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                      placeholder="绩效奖金"
                    />
                  </div>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p>💰 <strong>税前月薪总计：</strong>{{ salary.toFixed(2) }} 元</p>
                </div>
              </div>

              <!-- 社保基数设置 -->
              <div class="space-y-3 pt-4 border-t border-gray-200 dark:border-zinc-600">
                <h4 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">社保基数设置</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      社保基数下限 (元)
                      <button
                        @click="openLink('http://www.gov.cn/fuwu/2024-06/28/content_6954329.htm')"
                        class="ml-2 text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                        title="查看各地社保基数标准"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </label>
                    <input
                      type="number"
                      v-model.number="baseMin"
                      class="w-full p-3 border rounded-lg bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      社保基数上限 (元)
                      <button
                        @click="openLink('http://www.gov.cn/fuwu/2024-06/28/content_6954329.htm')"
                        class="ml-2 text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                        title="查看各地社保基数标准"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </label>
                    <input
                      type="number"
                      v-model.number="baseMax"
                      class="w-full p-3 border rounded-lg bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p>💡 <strong>当前社保基数：</strong>{{ results.socialSecurityBase.toFixed(2) }} 元</p>
                  <p class="mt-1">社保基数 = min(max(工资, 基数下限), 基数上限)</p>
                </div>
              </div>
            </div>
          </CardView>

          <!-- 社保项目配置 -->
          <CardView>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <span class="mr-2">🏥</span>
                社保与公积金项目
                <button
                  @click="openLink('http://www.gov.cn/zhengce/xxgk/main/202312/content_6920663.htm')"
                  class="ml-2 text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                  title="查看国家社保相关政策"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                </button>
              </h3>
              <button
                @click="resetToDefault"
                class="px-3 py-1 text-sm bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
              >
                重置默认
              </button>
            </div>
            <div class="space-y-4">
              <div
                v-for="(item, index) in insuranceItems"
                :key="index"
                class="p-4 rounded-lg border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700/50"
              >
                <div class="flex items-center justify-between mb-3">
                  <label :for="'enabled-' + index" class="flex items-center cursor-pointer">
                    <input
                      :id="'enabled-' + index"
                      type="checkbox"
                      v-model="item.enabled"
                      class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                    <span class="ml-3 text-lg font-medium text-gray-900 dark:text-gray-100">
                      {{ item.name }}
                    </span>
                  </label>
                </div>
                <div v-if="item.enabled" class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      个人缴纳比例 (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      v-model.number="item.personalRate"
                      class="w-full p-2 text-sm border rounded-md bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      公司缴纳比例 (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      v-model.number="item.companyRate"
                      class="w-full p-2 text-sm border rounded-md bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardView>

          <!-- 个人所得税税率配置 -->
          <CardView>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <span class="mr-2">📈</span>
                个人所得税税率表
                <button
                  @click="openLink('http://www.gov.cn/zhengce/2018-08/31/content_5318023.htm')"
                  class="ml-2 text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                  title="查看个人所得税法"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                </button>
              </h3>
            </div>
            <div class="space-y-3">
              <div
                v-for="(bracket, index) in taxBrackets"
                :key="index"
                class="p-3 rounded-lg border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700/50"
              >
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {{ bracket.name }}
                    </label>
                    <div class="text-sm text-gray-700 dark:text-gray-300">
                      {{ bracket.limit === Infinity ? '无上限' : `≤${(bracket.limit/10000).toFixed(1)}万` }}
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      税率 (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      v-model.number="bracket.rate"
                      class="w-full p-2 text-sm border rounded-md bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      速算扣除数
                    </label>
                    <input
                      type="number"
                      v-model.number="bracket.deduction"
                      class="w-full p-2 text-sm border rounded-md bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardView>
        </div>

        <!-- 右侧结果展示 -->
        <div class="flex flex-col gap-6">
          <CardView>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span class="mr-2">📋</span>
              计算结果
            </h3>
            <div class="space-y-4">
              <!-- 个人部分 -->
              <div class="p-4 border rounded-lg border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <h4 class="font-semibold text-lg mb-3 text-red-800 dark:text-red-300 flex items-center">
                  <span class="mr-2">👤</span>
                  个人缴纳部分
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="item in results.itemCalculations.filter((i: any) => i.personal > 0)"
                    :key="item.name"
                    class="flex justify-between text-sm"
                  >
                    <span class="text-gray-700 dark:text-gray-300">{{ item.name }}</span>
                    <span class="font-mono text-red-600 dark:text-red-400">
                      -{{ item.personal.toFixed(2) }} 元
                    </span>
                  </div>
                  <div class="flex justify-between text-base pt-2 border-t border-red-300 dark:border-red-700">
                    <span class="font-bold text-red-700 dark:text-red-300">个人缴纳小计</span>
                    <span class="font-bold font-mono text-red-600 dark:text-red-400">
                      -{{ results.personalTotal.toFixed(2) }} 元
                    </span>
                  </div>
                </div>
              </div>

              <!-- 公司部分 -->
              <div class="p-4 border rounded-lg border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <h4 class="font-semibold text-lg mb-3 text-blue-800 dark:text-blue-300 flex items-center">
                  <span class="mr-2">🏢</span>
                  公司缴纳部分
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="item in results.itemCalculations.filter((i: any) => i.company > 0)"
                    :key="item.name"
                    class="flex justify-between text-sm"
                  >
                    <span class="text-gray-700 dark:text-gray-300">{{ item.name }}</span>
                    <span class="font-mono text-blue-600 dark:text-blue-400">
                      +{{ item.company.toFixed(2) }} 元
                    </span>
                  </div>
                  <div class="flex justify-between text-base pt-2 border-t border-blue-300 dark:border-blue-700">
                    <span class="font-bold text-blue-700 dark:text-blue-300">公司缴纳小计</span>
                    <span class="font-bold font-mono text-blue-600 dark:text-blue-400">
                      {{ results.companyTotal.toFixed(2) }} 元
                    </span>
                  </div>
                </div>
              </div>

              <!-- 税务和最终结果 -->
              <div class="p-4 border rounded-lg border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <h4 class="font-semibold text-lg mb-3 text-green-800 dark:text-green-300 flex items-center">
                  <span class="mr-2">💸</span>
                  税务与实发
                  <button
                    @click="openLink('http://www.gov.cn/zhengce/2018-08/31/content_5318023.htm')"
                    class="ml-2 text-green-600 hover:text-green-800 cursor-pointer transition-colors"
                    title="查看个人所得税法"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </h4>
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-700 dark:text-gray-300">个人所得税</span>
                    <span class="font-mono text-red-500 dark:text-red-400">
                      -{{ results.tax.toFixed(2) }} 元
                    </span>
                  </div>
                  <div class="flex justify-between text-xl font-bold pt-3 border-t border-green-300 dark:border-green-700">
                    <span class="text-green-800 dark:text-green-200">实发工资</span>
                    <span class="font-mono text-green-600 dark:text-green-400">
                      {{ results.takeHomePay.toFixed(2) }} 元
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardView>

          <!-- 计算说明 -->
          <CardView>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span class="mr-2">📝</span>
              计算说明
            </h3>
            <div class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>• <strong>社保基数：</strong>取工资在基数上下限范围内的值</p>
              <p>• <strong>个人缴纳：</strong>社保基数 × 各项个人缴纳比例</p>
              <p>• <strong>公司缴纳：</strong>社保基数 × 各项公司缴纳比例</p>
              <p>• <strong>应纳税所得额：</strong>税前工资 - 个人缴纳 - 5000元(起征点)</p>
              <p>• <strong>个人所得税：</strong>按照7级超额累进税率计算</p>
              <p>• <strong>实发工资：</strong>税前工资 - 个人缴纳 - 个人所得税</p>
            </div>
          </CardView>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}
::-webkit-scrollbar-track {
  background: rgba(229, 231, 235, 0.3);
}

/* 输入框样式优化 */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* 焦点样式 */
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 过渡动画 */
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>