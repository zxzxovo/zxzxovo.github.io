import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useNavStore = defineStore("nav_store", () => {
  // 导航栏搜索按钮
  const isOnSearch = ref(false);

  // 导航过程
  const currentRoute = ref<string>("");
  const isLoading = ref(false);

  // 侧边栏（移动端）
  const isSidebarOpen = ref(false);

  // 计算属性
  const canGoBack = computed(() => {
    return window.history.length > 1;
  });

  // 导航栏搜索按钮
  function onSearch() {
    isOnSearch.value = true;
  }

  function closeSearch() {
    isOnSearch.value = false;
  }

  // 导航过程
  function setCurrentRoute(route: string) {
    currentRoute.value = route;
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading;
  }

  // 侧边栏（移动端）
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
    isOnSearch,
    currentRoute,
    isLoading,
    isSidebarOpen,

    canGoBack,

    onSearch,
    closeSearch,
    setCurrentRoute,
    setLoading,
    toggleSidebar,
    closeSidebar,
    openSidebar,
  };
});
