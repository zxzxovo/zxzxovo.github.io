import { ref, nextTick } from "vue";

/**
 * 滚动管理组合式函数
 */
export function useScroll() {
  const scrollY = ref(0);
  const isScrolling = ref(false);

  function updateScrollPosition() {
    scrollY.value = window.scrollY || document.documentElement.scrollTop;
  }

  function scrollTo(
    element: Element | string,
    options?: ScrollIntoViewOptions,
  ) {
    const target =
      typeof element === "string" ? document.querySelector(element) : element;

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
        ...options,
      });
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function scrollToHash(hash: string) {
    await nextTick();

    if (hash) {
      const element = document.getElementById(hash.replace("#", ""));
      if (element) {
        scrollTo(element);
      }
    }
  }

  function trackActiveHeading(headings: NodeListOf<Element> | Element[]) {
    const headingElements = Array.from(headings);
    let activeId = "";

    for (const heading of headingElements) {
      const rect = heading.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 0) {
        activeId = heading.id;
      }
    }

    return activeId;
  }

  return {
    scrollY,
    isScrolling,
    updateScrollPosition,
    scrollTo,
    scrollToTop,
    scrollToHash,
    trackActiveHeading,
  };
}
