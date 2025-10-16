import { ref } from "vue";

/**
 * 异步状态管理组合式函数
 */
export function useAsyncState<T>(
  initialData: T | null = null,
  options: {
    resetOnExecute?: boolean;
    throwOnError?: boolean;
  } = {},
) {
  const { resetOnExecute = true, throwOnError = false } = options;

  const data = ref<T | null>(initialData);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  async function execute<R = T>(
    asyncFunction: () => Promise<R>,
  ): Promise<R | null> {
    try {
      isLoading.value = true;
      error.value = null;

      if (resetOnExecute) {
        data.value = null;
      }

      const result = await asyncFunction();
      data.value = result as unknown as T;

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));

      if (throwOnError) {
        throw error.value;
      }

      return null;
    } finally {
      isLoading.value = false;
    }
  }

  function reset() {
    data.value = initialData;
    isLoading.value = false;
    error.value = null;
  }

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
}
