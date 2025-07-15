import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'

// 性能监控 - 仅在开发环境下启用
if (import.meta.env.DEV) {
  // 监控首屏加载时间
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`🚀 应用加载时间: ${loadTime.toFixed(2)}ms`);
  });
}

// 初始化主题设置 - 优化为同步操作避免闪烁
function initTheme() {
  const savedTheme = localStorage.getItem("darkTheme") || "light";
  const root = document.documentElement;
  
  // 批量设置避免重复渲染
  root.setAttribute("data-theme", savedTheme);
  if (savedTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// 在应用启动前初始化主题
initTheme();

// 创建应用实例
const app = createApp(App);

// 全局错误处理
app.config.errorHandler = (err, _instance, info) => {
  console.error('应用错误:', err);
  console.error('错误信息:', info);
  
  // 生产环境可以上报错误到监控服务
  if (import.meta.env.PROD) {
    // TODO: 上报错误到监控服务
  }
};

// 全局警告处理
app.config.warnHandler = (msg, _instance, trace) => {
  if (import.meta.env.DEV) {
    console.warn('Vue警告:', msg);
    console.warn('组件追踪:', trace);
  }
};

// 注册插件
app.use(createPinia());
app.use(router);

// 挂载应用
app.mount('#app');
