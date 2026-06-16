<script setup lang="ts">
import { computed } from "vue";

const { inline, color } = defineProps(["inline", "color"]);
const colorText = `g-${color}-50`;
const colorDark = `dark:bg-${color}-800`;

const dynClass = computed(() => [
  {
    "inline-block": inline,
  },
  colorText,
  colorDark,
]);
</script>

<template>
  <div
    class="px-2 my-1 mx-1 w-min h-fit border bg-emerald-50 dark:bg-emerald-800 border-teal-400 dark:border-teal-600 rounded-xl"
    :class="dynClass"
  >
    <slot></slot>
  </div>
</template>

<style scoped></style>
