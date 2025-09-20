import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useNavStore = defineStore("nav_store", () => {
  // 搜索相关状态
  const isOnSearch = ref(false);
  
  // 导航相关状态
  const currentRoute = ref<string>('');
  const isLoading = ref(false);
  
  // 侧边栏状态（移动端）
  const isSidebarOpen = ref(false);
  
  // 计算属性
  const canGoBack = computed(() => {
    return window.history.length > 1;
  });
  
  // 搜索相关方法
  function onSearch() {
    isOnSearch.value = true;
  }
  
  function closeSearch() {
    isOnSearch.value = false;
  }
  
  // 导航相关方法
  function setCurrentRoute(route: string) {
    currentRoute.value = route;
  }
  
  function setLoading(loading: boolean) {
    isLoading.value = loading;
  }
  
  // 侧边栏相关方法
  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value;
  }
  
  function closeSidebar() {
    isSidebarOpen.value = false;
  }
  
  function openSidebar() {
    isSidebarOpen.value = true;
  }

  return { 
    // 状态
    isOnSearch, 
    currentRoute,
    isLoading,
    isSidebarOpen,
    
    // 计算属性
    canGoBack,
    
    // 方法
    onSearch, 
    closeSearch,
    setCurrentRoute,
    setLoading,
    toggleSidebar,
    closeSidebar,
    openSidebar
  };
});
