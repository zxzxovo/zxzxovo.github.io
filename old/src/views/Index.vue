<script setup lang="ts">
import Header from "@/components/NavHeader.vue";
import Footer from "@/components/Footer.vue";
</script>

<template>
  <div
    class="bg-gray-50 dark:bg-zinc-900 w-screen h-screen flex flex-col overflow-hidden"
  >
    <!-- Header -->
    <Header class="shrink-0"></Header>

    <div
      class="flex-1 flex flex-col text-gray-800 bg-gray-50 dark:bg-zinc-900 dark:text-gray-300 overflow-y-auto main-content"
    >
      <RouterView name="root" v-slot="{ Component }" class="flex-1">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>

      <!-- Footer -->
      <Footer class="shrink-0"></Footer>
    </div>
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.1s ease-in-out;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
.page-enter-to,
.page-leave-from {
  opacity: 1;
}
</style>
