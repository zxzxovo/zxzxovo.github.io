<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showBanner = ref(false);

// 检查用户是否已经接受Cookie政策
const checkConsent = (): boolean => {
  return localStorage.getItem('cookie-consent') === 'accepted';
};

// 接受Cookie政策
const acceptCookies = () => {
  localStorage.setItem('cookie-consent', 'accepted');
  showBanner.value = false;
};

// 查看隐私政策
const viewPrivacyPolicy = () => {
  router.push('/privacy');
  // 不关闭banner，让用户阅读后可以继续选择接受
};

onMounted(() => {
  // 延迟显示Cookie同意横幅，以便不立即干扰用户体验
  setTimeout(() => {
    showBanner.value = !checkConsent();
  }, 1000);
});
</script>

<template>
  <Transition name="slide-up">
    <div v-if="showBanner" class="cookie-banner">
      <div class="cookie-content">
        <div class="cookie-icon">🍪</div>
        <p>
          本网站使用Cookie来提供更好的浏览体验和为您提供个性化内容。
          继续使用本网站即表示您同意我们的Cookie政策。
          <a @click.prevent="viewPrivacyPolicy" href="#" class="policy-link">查看隐私政策</a>
        </p>
      </div>
      <div class="cookie-actions">
        <button @click="acceptCookies" class="accept-button">接受</button>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  z-index: 1000;
  border-top: 1px solid #e0e0e0;
  
  .cookie-content {
    display: flex;
    align-items: center;
    flex: 1;
    
    .cookie-icon {
      font-size: 1.8rem;
      margin-right: 1rem;
    }
    
    p {
      margin: 0;
      font-size: 0.9rem;
      color: #424242;
      line-height: 1.5;
    }
    
    .policy-link {
      color: #3F51B5;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .cookie-actions {
    display: flex;
    gap: 0.8rem;
    
    .accept-button {
      background-color: #3F51B5;
      color: white;
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: #303F9F;
      }
    }
  }
}

// 暗色模式样式
:root[data-theme="dark"] .cookie-banner {
  background-color: rgba(33, 33, 33, 0.95);
  border-top: 1px solid #424242;
  
  .cookie-content p {
    color: #e0e0e0;
  }
  
  .cookie-actions .accept-button {
    background-color: #5C6BC0;
    
    &:hover {
      background-color: #7986CB;
    }
  }
}

// 动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 768px) {
  .cookie-banner {
    flex-direction: column;
    align-items: flex-start;
    
    .cookie-content {
      margin-bottom: 0.8rem;
    }
    
    .cookie-actions {
      width: 100%;
      justify-content: center;
      
      .accept-button {
        flex: 1;
        max-width: 200px;
      }
    }
  }
}
</style>
