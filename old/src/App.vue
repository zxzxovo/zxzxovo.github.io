<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <RouterView name="appcontent"></RouterView>
</template>

<style scoped></style>

<style>
/* 全局禁用滚动 */
html,
body {
  overflow: hidden;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
}

* {
  box-sizing: border-box;
}

.page-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
