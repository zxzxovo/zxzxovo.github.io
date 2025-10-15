/**
 * 性能监控工具
 */
import { devLog, devWarn } from './logger';

interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private isEnabled: boolean = import.meta.env.DEV;

  /**
   * 开始性能测量
   */
  start(name: string): void {
    if (!this.isEnabled) return;
    
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
    });
  }

  /**
   * 结束性能测量
   */
  end(name: string): number | null {
    if (!this.isEnabled) return null;
    
    const metric = this.metrics.get(name);
    if (!metric) {
      devWarn(`性能测量 "${name}" 未找到开始时间`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;

    devLog(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * 测量函数执行时间
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    if (!this.isEnabled) {
      return fn();
    }

    this.start(name);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(name);
    }
  }

  /**
   * 获取所有性能指标
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 清除所有性能指标
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * 监控页面加载性能
   */
  monitorPageLoad(): void {
    if (!this.isEnabled) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          devLog('📊 页面加载性能');
          devLog(`DNS查询: ${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`);
          devLog(`TCP连接: ${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`);
          devLog(`请求响应: ${(navigation.responseEnd - navigation.requestStart).toFixed(2)}ms`);
          devLog(`DOM解析: ${(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).toFixed(2)}ms`);
          devLog(`资源加载: ${(navigation.loadEventEnd - navigation.domContentLoadedEventEnd).toFixed(2)}ms`);
          devLog(`总加载时间: ${navigation.duration.toFixed(2)}ms`);
        }
      }, 100);
    });
  }

  /**
   * 监控资源加载
   */
  monitorResources(): void {
    if (!this.isEnabled) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const largeResources = resources.filter(r => r.transferSize && r.transferSize > 100000); // 大于100KB
        
        if (largeResources.length > 0) {
          devLog('📦 大型资源加载');
          largeResources.forEach(resource => {
            devLog(`${resource.name}: ${(resource.transferSize! / 1024).toFixed(2)}KB - ${resource.duration.toFixed(2)}ms`);
          });
        }
      }, 100);
    });
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor();

// 开发环境下启用监控
if (import.meta.env.DEV) {
  performanceMonitor.monitorPageLoad();
  performanceMonitor.monitorResources();
}

/**
 * 性能监控装饰器
 */
export function measurePerformance(measureName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(`${measureName || target.constructor.name}.${propertyKey}`, () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

/**
 * 简单的性能测量函数
 */
export function withPerformance<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
  return performanceMonitor.measure(name, fn);
}
