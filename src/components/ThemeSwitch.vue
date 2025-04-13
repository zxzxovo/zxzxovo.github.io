<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const isDarkMode = ref(false);

// 检测系统主题偏好
const checkSystemPreference = () => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// 从localStorage获取存储的主题设置
const getSavedTheme = () => {
  const saved = localStorage.getItem('theme');
  if (saved) {
    return saved === 'dark';
  }
  // 如果没有保存的主题，使用系统偏好
  return checkSystemPreference();
};

// 应用主题到文档
const applyTheme = (dark: boolean) => {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
};

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
};

// 监听主题变化并应用
watch(isDarkMode, (newValue) => {
  applyTheme(newValue);
});

// 监听系统主题偏好变化
onMounted(() => {
  // 设置初始主题
  isDarkMode.value = getSavedTheme();
  
  // 监听系统主题变化
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 添加变化监听器（使用兼容性写法）
    const listener = (e: MediaQueryListEvent | MediaQueryList) => {
      if (!localStorage.getItem('theme')) { // 只有在用户未手动设置主题时才跟随系统
        isDarkMode.value = e.matches;
      }
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      // 兼容旧版本浏览器
      mediaQuery.addListener(listener as any);
    }
  }
});
</script>

<template>
  <div class="theme-switch-wrapper">
    <label class="theme-switch" for="theme-checkbox">
      <input 
        type="checkbox" 
        id="theme-checkbox" 
        v-model="isDarkMode" 
        @change="toggleTheme"
      />
      <div class="slider round">
        <div class="icons">
          <svg v-if="isDarkMode" class="icon moon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else class="icon sun" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </label>
  </div>
</template>

<style scoped>
.theme-switch-wrapper {
  display: flex;
  align-items: center;
}

.theme-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  margin: 0 0.5rem;
}

.theme-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  display: flex;
  align-items: center;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  z-index: 2;
}

input:checked + .slider {
  background-color: #3F51B5;
}

input:focus + .slider {
  box-shadow: 0 0 1px #3F51B5;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}

.icons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 5px;
}

.icon {
  width: 16px;
  height: 16px;
  color: white;
  z-index: 1;
}

.sun {
  margin-left: 3px;
}

.moon {
  margin-right: 3px;
}
</style>
