<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，您访问的页面不存在或已被移除</p>
      <button @click="goHome" class="home-button">返回首页</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70vh;
  text-align: center;
}

.not-found-content {
  max-width: 500px;
  padding: 2rem;
  
  h1 {
    font-size: 6rem;
    margin: 0;
    color: #3498db;
    animation: pulse 1.5s infinite;
  }
  
  h2 {
    font-size: 2rem;
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.2rem;
    color: #666;
    margin-bottom: 2rem;
  }
}

.home-button {
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #2980b9;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>