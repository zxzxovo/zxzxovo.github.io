<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useNavStore } from "../stores/nav";
import SearchFrame from "./SearchFrame.vue";

const navItems = [
  { name: "Home", title: "首页", order: "order-1" },
  { name: "About", title: "关于", order: "order-6" },
  { name: "Projects", title: "项目", order: "order-3" },
  { name: "Services", title: "服务", order: "order-5" },
  { name: "Blog", title: "博客", order: "order-2" },
  { name: "Book", title: "合集", order: "order-4" },
];

let doc: HTMLElement | null;

function setTheme(theme: string | null) {
  const finalTheme = theme || "light"; // 默认为 light 主题
  localStorage.setItem("darkTheme", finalTheme);
  document.documentElement.setAttribute("data-theme", finalTheme);

  // 同时设置 class 以确保 Tailwind 暗色模式生效
  if (finalTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

const changeDayLight = () => {
  const now = document.documentElement.getAttribute("data-theme");
  setTheme(now === "dark" ? "light" : "dark");
};

const navStore = useNavStore();
const searchToggled = () => navStore.onSearch();

const router = useRouter();
const navToHome = () => router.push({ name: "Home" });

const isSmallMenuOpen = ref(false);
const changeSmallMenuState = () =>
  (isSmallMenuOpen.value = !isSmallMenuOpen.value);
const closeSmallMenu = () => (isSmallMenuOpen.value = false);

onMounted(() => {
  doc = document.getElementById("app");
  setTheme(localStorage.getItem("darkTheme"));
  watch(isSmallMenuOpen, (isOpen) => {
    if (isOpen) {
      doc?.addEventListener("click", closeSmallMenu);
    } else {
      doc?.removeEventListener("click", closeSmallMenu);
    }
  });
});

onBeforeUnmount(() => {
  doc?.removeEventListener("click", closeSmallMenu);
});
</script>

<template>
  <div class="relative w-full">
    <div
      class="stiky top-0 bg-zinc-50 dark:bg-zinc-900 h-14 dark:border-zinc-900 shadow-md flex flex-row flex-nowrap justify-center content-center px-4 sm:px-8 md:px-16 z-50"
    >
      <div
        class="header-title flex basis-auto shrink-0 flex-row flex-nowrap justify-start gap-2 items-center cursor-pointer"
        @click="navToHome"
      >
        <img
          src="../assets/zx.svg"
          width="24"
          height="24"
          class="flex-initial"
        />
        <div class="title flex-none hidden sm:block overflow-hidden">
          <p
            class="font-semibold text-slate-600 dark:text-slate-200 text-nowrap"
          >
            Zhixia 的官方网站
          </p>
        </div>
      </div>

      <div
        class="header-navbars flex basis-full flex-row flex-nowrap justify-end items-center gap-1 text-3xs ml-4"
      >
        <RouterLink
          v-for="item in navItems"
          :to="{ name: item.name }"
          :key="item.order"
          class="size-14 hidden sm:flex justify-center items-center rounded-b-sm border-b-4 border-transparent dark:text-gray-300"
          :class="item.order"
          exact-active-class="!text-green-600 dark:!text-green-300 bg-zinc-200 dark:bg-zinc-800 border-b-violet-400 dark:border-b-violet-500"
        >
          {{ item.title }}
        </RouterLink>
      </div>

      <div
        class="header-options flex flex-row basis-auto justify-end items-center ml-1 sm:ml-2 md:ml-8 lg:ml-16 gap-0 lg:gap-2"
      >
        <button
          @click="searchToggled"
          class="hover:bg-zinc-200 dark:hover:bg-zinc-800 size-12 flex justify-center items-center rounded-4xl cursor-pointer"
        >
          <Icon
            icon="streamline-stickies-color:search"
            width="24"
            height="24"
          />
        </button>
        <button
          @click="changeDayLight"
          class="hover:bg-zinc-200 dark:hover:bg-zinc-800 size-12 flex justify-center items-center rounded-4xl cursor-pointer dark:rotate-180 transition-transform ease-in-out"
        >
          <Icon icon="noto:waxing-gibbous-moon" width="24" height="24" />
        </button>
        <button
          @click.stop="changeSmallMenuState"
          class="hover:bg-zinc-200 sm:hidden dark:hover:bg-zinc-800 size-12 flex justify-center items-center rounded-4xl cursor-pointer transition-transform ease-in-out"
          :class="{ 'rotate-90': isSmallMenuOpen }"
        >
          <Icon icon="marketeq:menu" width="24" height="24" />
        </button>
      </div>
      <SearchFrame />
    </div>

    <Transition name="sm-menu-trans">
      <div
        @click.stop
        v-if="isSmallMenuOpen"
        class="nav-small-menu sm:hidden fixed top-14 right-4 w-2/5 max-w-48 h-auto dark:bg-zinc-900 bg-zinc-50 border-violet-200 dark:border-zinc-800 rounded-b-2xl border-b-1 border-l-1 border-r-1 z-40"
      >
        <div class="w-full h-auto border-0 opacity-55 flex flex-col">
          <RouterLink
            v-for="item in navItems"
            :to="{ name: item.name }"
            :key="item.order"
            class="h-10 mx-4 my-1 sm:flex content-center justify-center items-center rounded-xl border-zinc-50 text-slate-800 dark:text-gray-300"
            :class="item.order"
            exact-active-class="!text-orange-600 dark:!text-green-300 bg-zinc-300 dark:bg-zinc-800"
          >
            {{ item.title }}
          </RouterLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.sm-menu-trans-enter-active,
.sm-menu-trans-leave-active {
  transition: all 0.2s ease-in-out;
}
.sm-menu-trans-enter-from,
.sm-menu-trans-leave-to {
  opacity: 0;
}
.sm-menu-trans-enter-to,
.sm-menu-trans-leave-from {
  opacity: 100;
}
</style>
