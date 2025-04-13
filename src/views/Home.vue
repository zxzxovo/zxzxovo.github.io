<script setup lang="ts">
import Card from '../components/Card.vue';
import { useRouter } from 'vue-router';

// 用于导航的路由对象
const router = useRouter();

// 功能模块
const features = [
    {
        title: '博客',
        description: '分享我的技术心得和日常思考',
        icon: '📝',
        route: { name: 'Blog' }
    },
    {
        title: '项目',
        description: '展示我开发的各类应用和工具',
        icon: '🚀',
        route: { name: 'Projects' }
    },
    {
        title: '服务',
        description: '提供软件开发和技术咨询服务',
        icon: '🔧',
        route: { name: 'Services' }
    },
    {
        title: '关于我',
        description: '了解更多关于我的经历和兴趣',
        icon: '👨‍💻',
        route: { name: 'About' }
    }
];

// 处理导航
const navigateTo = (route: any) => {
    router.push(route);
};
</script>

<template>
    <div class="home-container">
        <!-- 网站介绍区域 -->
        <section class="intro-section">
            <div class="intro-content">
                <h1 class="intro-title">欢迎来到 芷夏的官方网站</h1>
                <div class="intro-divider"></div>
                <p class="intro-text">
                    这是我的赛博空间，我将在这里分享计算机的相关经验和见解，以及一些有趣的内容。<br>
                    希望这个网站能为您提供有价值的内容。
                </p>
            </div>
        </section>

        <!-- 功能卡片区域 -->
        <section class="features-section">
            <h2 class="section-title">探索网站</h2>
            <div class="features-grid">
                <Card v-for="(feature, index) in features" :key="index" 
                      class="feature-card" @click="navigateTo(feature.route)">
                    <template #header>
                        <div class="feature-header">
                            <span class="feature-icon">{{ feature.icon }}</span>
                            <h3>{{ feature.title }}</h3>
                        </div>
                    </template>
                    <template #content>
                        <p class="feature-description">{{ feature.description }}</p>
                    </template>
                </Card>
            </div>
        </section>
    </div>
</template>

<style lang="scss" scoped>
.home-container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 0;
}

// 区域通用样式
section {
    margin-bottom: 3rem;
}

.section-title {
    font-size: 1.8rem;
    color: #303F9F; /* Indigo 700 */
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #E0E0E0;
    text-align: center;
}

// 网站介绍区域样式
.intro-section {
    background-color: #f5f7ff;
    border-radius: 10px;
    padding: 2.5rem;
    margin-bottom: 3rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    text-align: center;

    .intro-content {
        max-width: 800px;
        margin: 0 auto;
    }

    .intro-title {
        color: #303F9F;
        font-size: 2.2rem;
        margin-bottom: 1rem;
    }

    .intro-divider {
        height: 3px;
        width: 80px;
        background: linear-gradient(to right, #3F51B5, #7986CB);
        margin: 1rem auto;
        border-radius: 3px;
    }

    .intro-text {
        font-size: 1.1rem;
        line-height: 1.6;
        color: #424242;
    }
}

// 功能卡片区域样式
.features-section {
    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;

        .feature-card {
            cursor: pointer;
            transition: transform 0.3s ease, box-shadow 0.3s ease;

            &:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            }

            .feature-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.8rem;

                .feature-icon {
                    font-size: 1.8rem;
                }

                h3 {
                    margin: 0;
                    color: #3F51B5; /* Indigo 500 */
                    font-size: 1.3rem;
                }
            }

            .feature-description {
                padding: 0.5rem;
                text-align: center;
                color: #616161; /* Grey 700 */
            }
        }
    }
}

// 响应式设计
@media (max-width: 960px) {
    // ...响应式设计保持不变...
}

@media (max-width: 768px) {
    .intro-section {
        padding: 2rem 1.5rem;
        
        .intro-title {
            font-size: 1.8rem;
        }
        
        .intro-text {
            font-size: 1rem;
        }
    }
}

@media (max-width: 480px) {
    .home-container {
        width: 95%;
    }

    .section-title {
        font-size: 1.5rem;
    }

    .features-section .features-grid {
        grid-template-columns: 1fr;
    }
    
    .intro-section {
        padding: 1.5rem 1rem;
        
        .intro-title {
            font-size: 1.6rem;
        }
    }
}
</style>