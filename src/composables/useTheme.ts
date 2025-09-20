import { ref, computed, onMounted } from 'vue';
import type { Theme } from '../types';

/**
 * 主题管理组合式函数
 */
export function useTheme() {
  const currentTheme = ref<Theme>('light');
  const isDark = computed(() => currentTheme.value === 'dark');
  
  function initTheme() {
    const savedTheme = (localStorage.getItem('darkTheme') as Theme) || 'light';
    setTheme(savedTheme);
  }
  
  function setTheme(theme: Theme) {
    currentTheme.value = theme;
    localStorage.setItem('darkTheme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark');
  }
  
  // 监听系统主题变化
  function handleSystemThemeChange(e: MediaQueryListEvent) {
    if (!localStorage.getItem('darkTheme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  }
  
  onMounted(() => {
    initTheme();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  });
  
  return {
    currentTheme: computed(() => currentTheme.value),
    isDark,
    setTheme,
    toggleTheme
  };
}
