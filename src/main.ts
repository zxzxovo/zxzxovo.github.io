import { createApp } from "vue";
import "@/style.css";
import App from "@/App.vue";
import { type Theme } from "@/types";
import { createPinia } from "pinia";
import router from "@/router";

// 初始化主题设置 - 优化为同步操作避免闪烁
(function initTheme() {
  const savedTheme: Theme = (localStorage.getItem("darkTheme") ||
    "light") as Theme;
  const root = document.documentElement;

  root.setAttribute("data-theme", savedTheme);
  if (savedTheme === ("dark" as Theme)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
})();

const app = createApp(App);

app.config.errorHandler = (err, _instance, info) => {
  console.error("应用错误:", err);
  console.error("错误信息:", info);
};

app.config.warnHandler = (msg, _instance, trace) => {
  if (import.meta.env.DEV) {
    console.warn("Vue警告:", msg);
    console.warn("组件追踪:", trace);
  }
};

app.use(createPinia());
app.use(router);

app.mount("#app");
