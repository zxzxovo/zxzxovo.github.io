// 控制台输出工具 - 用于开发/生产环境的控制台输出管理
export const isDev = import.meta.env.DEV;

// 开发环境日志函数
export const devLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

// 开发环境信息函数
export const devInfo = (...args: any[]) => {
  if (isDev) {
    console.info(...args);
  }
};

// 开发环境警告函数（始终显示，但在生产环境中格式化）
export const devWarn = (...args: any[]) => {
  if (isDev) {
    console.warn(...args);
  }
  // 生产环境中不显示警告，或者只显示简化版本
};

// 错误函数（始终显示）
export const devError = (...args: any[]) => {
  console.error(...args);
};

// 性能监控函数（仅开发环境）
export const devPerf = (name: string, fn: () => any) => {
  if (isDev) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
};

// 分组日志（仅开发环境）
export const devGroup = (label: string, fn: () => void) => {
  if (isDev) {
    console.group(label);
    fn();
    console.groupEnd();
  }
};
