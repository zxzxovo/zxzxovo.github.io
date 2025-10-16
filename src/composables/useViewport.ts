import { ref, computed, onMounted, onUnmounted } from "vue";

/**
 * 响应式视口检测
 */
export function useViewport() {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);

  const isMobile = computed(() => width.value < 768);
  const isTablet = computed(() => width.value >= 768 && width.value < 1024);
  const isDesktop = computed(() => width.value >= 1024);

  function updateViewport() {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
  }

  onMounted(() => {
    window.addEventListener("resize", updateViewport);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", updateViewport);
  });

  return {
    width: computed(() => width.value),
    height: computed(() => height.value),
    isMobile,
    isTablet,
    isDesktop,
  };
}
