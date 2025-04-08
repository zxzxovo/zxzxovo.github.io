<script setup lang="ts">
import Card from '../components/Card.vue';
import { onMounted } from 'vue';

const techStack: { head: string; content: string[]; }[] = [
    {
        head: "Languages",
        content: [
            "C", "Rust", "Java", "Kotlin", "JavaScript", 
            "HTML", "CSS", "Python",
        ],
    },
    {
        head: "Tools&Frameworks",
        content: [
            "Git&GitHub", "Linux", "Tauri", "SpringBoot", 
            "Vue3", "MySQL", "Redis"
        ]
    },
    {
        head: "AppDevelopment",
        content: [
            "Android", "Linux", "Windows", "Web",
            "Desktop", "CrossPlatform"
        ]
    }
]

const serviceSupply: { head: string; content: string; }[] = [
    {
        head: "软件开发",
        content: "提供Web应用, 跨平台应用程序,桌面应用，以及基于前述技术栈的开发"
    },
    {
        head: "技术咨询",
        content: "提供应用开发咨询, 技术帮助, 作业辅导等"
    },
    {
        head: "远程工作",
        content: "接受远程工作, 提供远程协助"
    }
]

const workContact = {
    head: "联系方式",
    content: [
        {
            head: "邮箱",
            content: [
                { text: "zxzxovo@gmail.com", isLink: false },
                { text: "flatig@163.com", isLink: false }
            ]
        },
        {
            head: "社交账号",
            content: [
                { 
                    text: "Telegram: +44 7902 461698", 
                    link: "https://t.me/zxzxovo", 
                    icon: "/svg/telegram.svg" 
                },
                { text: "QQ: 2244697793", isLink: false },
                { 
                    text: "X: @zxzxovo", 
                    link: "https://x.com/zxzxovo", 
                    icon: "/svg/x.svg" 
                }
            ]   
        },
        {
            head: "GitHub",
            content: [
                { 
                    text: "github.com/zxzxovo", 
                    link: "https://github.com/zxzxovo", 
                    icon: "/svg/github.svg" 
                }
            ]
        }
    ]
};

const getTechLogo = (tech: string) => {
    const logoMap: Record<string, string> = {
        "C": "/svg/c.svg", "Rust": "/svg/rust.svg", "Java": "/svg/java.svg",
        "Kotlin": "/svg/kotlin.svg", "JavaScript": "/svg/javascript.svg",
        "HTML": "/svg/html.svg", "CSS": "/svg/css.svg", "Python": "/svg/python.svg",
        "Git&GitHub": "/svg/git&github.svg", "Linux": "/svg/linux.svg",
        "Tauri": "/svg/tauri.svg", "SpringBoot": "/svg/springboot.svg",
        "Vue3": "/svg/vue3.svg", "MySQL": "/svg/mysql.svg", "Redis": "/svg/redis.svg",
        "Android": "/svg/android.svg", "Windows": "/svg/windows.svg",
        "Web": "/svg/web.svg", "Desktop": "/svg/desktop.svg",
        "CrossPlatform": "/svg/crossplatform.svg",
    };

    return logoMap[tech] || "/svg/code.svg";
};

// 图片懒加载设置
const setupLazyLoading = () => {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        });

        // 延迟执行以确保DOM已更新
        setTimeout(() => {
            document.querySelectorAll('.tech-logo img').forEach(img => {
                imageObserver.observe(img);
            });
        }, 300);
    }
};

onMounted(() => {
    setupLazyLoading();
});
</script>

<template>
    <div class="se-container">
        <!-- 技术栈部分 -->
        <div class="section tech-stack">
            <h2 class="title">Tech Stack</h2>
            <div class="stack-container">
                <Card v-for="category in techStack" :key="category.head" class="stack-card">
                    <template #header>
                        <div class="card-header">
                            <h3>{{ category.head }}</h3>
                        </div>
                    </template>
                    <template #content>
                        <div class="tech-grid">
                            <div v-for="tech in category.content" :key="tech" class="tech-item">
                                <div class="tech-logo">
                                    <img 
                                        :data-src="getTechLogo(tech)" 
                                        :alt="tech" 
                                        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                                    />
                                </div>
                                <div class="tech-name">{{ tech }}</div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- 服务提供部分 -->
        <div class="section service-supply">
            <h2 class="title">Service Supply</h2>
            <div class="supply-container">
                <Card v-for="service in serviceSupply" :key="service.head" class="supply-card">
                    <template #header>
                        <div class="card-header">
                            <img src="/svg/pinned.svg" alt="service" class="service-icon" />
                            <h3>{{ service.head }}</h3>
                        </div>
                    </template>
                    <template #content>
                        <div class="service-content">
                            <p>{{ service.content }}</p>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- 联系方式部分 -->
        <div class="section work-contact">
            <h2 class="title">Work Contact</h2>
            <Card class="contact-card">
                <template #header>
                    <div class="card-header">
                        <h3>{{ workContact.head }}</h3>
                    </div>
                </template>
                <template #content>
                    <div class="contact-content">
                        <div class="contact-image">
                            <img src="@/assets/avatar3.jpg" alt="Contact" />
                        </div>
                        <div class="contact-details">
                            <div v-for="(section, index) in workContact.content" :key="index" class="contact-section">
                                <h4>{{ section.head }}</h4>
                                <ul>
                                    <li v-for="(item, i) in section.content" :key="i">
                                        <!-- 有链接的项目 -->
                                        <a v-if="item.link" 
                                           :href="item.link" 
                                           target="_blank" 
                                           class="contact-link">
                                            <img v-if="item.icon" :src="item.icon" :alt="item.text" class="contact-icon" />
                                            {{ item.text }}
                                        </a>
                                        <!-- 普通文本项目 -->
                                        <span v-else>{{ item.text }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.se-container {
    width: 95%;
    margin: auto;
    display: flex;
    flex-direction: column;
}

.section {
    margin-bottom: 2rem;
    width: 100%;
}

.title {
    font-size: 1.6rem;
    font-weight: bold;
    margin: 2rem 4rem;
    color: #303F9F; /* Indigo 700 */
}

// 卡片通用样式
.card-header {
    h3 {
        font-size: 1.2rem;
        margin: 0;
        padding: 0.5rem;
        color: #3F51B5; /* Indigo 500 */
        text-align: center;
    }
}

// 技术栈样式
.stack-container, .supply-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    max-width: 1200px;
    margin: 0 auto;
}

.stack-card, .supply-card {
    flex: 1;
    min-width: 280px;
    margin-bottom: 1rem;
}

.tech-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem;
    padding: 0.5rem;
}

.tech-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    border-radius: 8px;
    width: calc(33.33% - 0.8rem);
    transition: background-color 0.2s ease;
    
    &:hover {
        background-color: rgba(63, 81, 181, 0.1);
    }
    
    .tech-logo {
        margin-bottom: 0.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
        
        img {
            width: 32px;
            height: 32px;
            object-fit: contain;
        }
    }
    
    .tech-name {
        font-size: 0.8rem;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
    }
}

// 服务供应样式
.supply-card {
    .card-header {
        display: flex;
        align-items: center;
        justify-content: center;
        
        .service-icon {
            width: 20px;
            height: 20px;
            margin-right: 8px;
        }
    }
}

.service-content {
    padding: 1rem;
    
    p {
        line-height: 1.6;
        color: #616161; /* Grey 700 */
        text-align: center;
    }
}

// 联系方式样式
.contact-card {
    max-width: 800px;
    margin: 0 auto;
}

.contact-content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    
    .contact-image {
        flex: 0 1 250px;
        padding: 1rem;
        
        img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            object-fit: cover;
        }
    }
    
    .contact-details {
        flex: 1 1 400px;
        padding: 1rem;
        
        .contact-section {
            margin-bottom: 1.5rem;
            
            h4 {
                color: #303F9F; /* Indigo 700 */
                margin: 0 0 0.5rem 0;
                font-size: 1.1rem;
                border-bottom: 1px solid #E0E0E0; /* Grey 300 */
                padding-bottom: 0.3rem;
            }
            
            ul {
                list-style: none;
                padding: 0;
                margin: 0;
                
                li {
                    padding: 0.5rem 0;
                    color: #616161; /* Grey 700 */
                    
                    .contact-link {
                        display: flex;
                        align-items: center;
                        color: #3F51B5;
                        text-decoration: none;
                        transition: color 0.2s ease;
                        
                        &:hover {
                            color: #5C6BC0;
                            text-decoration: underline;
                        }
                        
                        .contact-icon {
                            width: 20px;
                            height: 20px;
                            margin-right: 8px;
                        }
                    }
                }
            }
        }
    }
}

/* 响应式设计 - 合并所有媒体查询 */
@media (max-width: 960px) {
    .se-container {
        width: 95%;
    }
    
    .stack-container, .supply-container {
        flex-direction: column;
    }
}

@media (max-width: 600px) {
    .title {
        margin: 1.5rem 1rem;
    }
    
    .tech-grid {
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    }
    
    .contact-content {
        flex-direction: column;
        
        .contact-image {
            max-width: 100%;
            margin: 0 auto;
            
            img {
                max-height: 200px;
                object-position: center;
            }
        }
    }
}
</style>