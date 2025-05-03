<script setup lang="ts">


</script>

<template>
  <div id="app">
    <router-view name="appcontent" > </router-view>
  </div>
</template>

<style scoped>

</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;

}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5; /* Added background color */
}

a {
    color: #90CAF9;  /* Blue 200*/
    text-decoration: none;
    transition: color 0.3s;
}
a:hover {
    color: #F48FB1; /* Pink 200*/
    text-decoration: underline; 
}

p {
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
