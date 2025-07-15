<script setup lang="ts">
import { ref } from "vue";

const { cssWidth, cssHeight, padding = "p-6" } = defineProps(["cssWidth", "cssHeight", "padding"]);
const twcWidth = ref(cssWidth);
const twcHeight = ref(cssHeight);
</script>

<template>
  <div
    class="bg-white dark:bg-zinc-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
    :class="[twcWidth, twcHeight, padding]"
  >
    <slot></slot>
  </div>
</template>

<style scoped></style>
<style scoped></style>
