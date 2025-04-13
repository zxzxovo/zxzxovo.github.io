<script setup lang="ts">
import Card from '../components/Card.vue';
import { ref, onMounted } from 'vue';
import defaultImage from '@/assets/404.jpg'

// 定义文章接口
interface BlogPost {
    title: string;
    url: string;
    date: string;
    imageUrl: string;
}

const recentPosts = ref<BlogPost[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const cacheKey = 'blog_recent_posts';
const cacheExpiration = 3600000; // 1小时缓存过期

const blog_redirect = () => {
    // Redirect to url in new page: https://blog.hizhixia.site
    window.open('https://blog.hizhixia.site', '_blank');
};

// 从缓存加载数据
const loadFromCache = (): { posts: BlogPost[], timestamp: number } | null => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const data = JSON.parse(cached);
            // 检查缓存是否过期
            if (Date.now() - data.timestamp < cacheExpiration) {
                return data;
            }
        } catch (e) {
            console.error('解析缓存数据出错:', e);
        }
    }
    return null;
};

// 保存数据到缓存
const saveToCache = (posts: BlogPost[]) => {
    try {
        localStorage.setItem(cacheKey, JSON.stringify({
            posts,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.error('缓存数据失败:', e);
    }
};

// 获取最新文章列表
const fetchRecentPosts = async (retryCount = 2, delay = 500) => {
    loading.value = true;
    error.value = null;

    // 尝试从缓存加载
    const cached = loadFromCache();
    if (cached) {
        recentPosts.value = cached.posts;
        loading.value = false;
        
        // 在后台静默刷新缓存
        setTimeout(() => refreshData(), 0);
        return;
    }

    // 无缓存，从网络加载
    await refreshData(retryCount, delay);
};

// 刷新数据（带重试机制）
const refreshData = async (retryCount = 3, delay = 1000) => {
    try {
        const proxyUrl = 'https://blog.hizhixia.site/page/archives/';

        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`获取失败: ${response.status}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 获取文章列表
        const articleList = doc.querySelector('.archives-group > .article-list--compact');
        if (!articleList) {
            throw new Error('找不到文章列表');
        }

        const articles = articleList.querySelectorAll('article');
        const posts: BlogPost[] = [];

        articles.forEach(article => {
            const link = article.querySelector('a');
            if (!link) return;

            const url = link.getAttribute('href') || '';
            const title = link.querySelector('.article-title')?.textContent || '无标题';
            const date = link.querySelector('time')?.textContent || '无日期';
            const imgSrc = link.querySelector('img')?.getAttribute('src') || '';

            // 确保URL是绝对路径
            const fullUrl = url.startsWith('http') ? url : `https://blog.hizhixia.site${url}`;
            let fullImgSrc = imgSrc.startsWith('http') ? imgSrc : `https://blog.hizhixia.site${imgSrc}`;
            if(!imgSrc) {
                fullImgSrc = ''; // 不替换默认图片
            }

            posts.push({
                title,
                url: fullUrl,
                date,
                imageUrl: fullImgSrc
            });
        });

        recentPosts.value = posts.slice(0, 6); // 限制显示6篇文章
        // 保存到缓存
        saveToCache(recentPosts.value);
    } catch (err) {
        console.error('获取文章失败:', err);
        error.value = err instanceof Error ? err.message : '未知错误';
        
        // 重试逻辑
        if (retryCount > 0) {
            console.log(`将在${delay}ms后重试，剩余重试次数: ${retryCount - 1}`);
            setTimeout(() => refreshData(retryCount - 1, delay * 1.5), delay);
            return;
        }
    } finally {
        loading.value = false;
    }
};

// 节流函数
const throttle = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
    let lastCall = 0;
    return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
        const now = Date.now();
        if (now - lastCall < delay) {
            return undefined;
        }
        lastCall = now;
        return fn.apply(this, args);
    };
};

// 打开文章（添加节流处理）
const openArticle = throttle((url: string) => {
    window.open(url, '_blank');
}, 300);

// 设置图片懒加载
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
            document.querySelectorAll('.article-image img').forEach(img => {
                imageObserver.observe(img);
            });
        }, 500);
    }
};

onMounted(() => {
    fetchRecentPosts();
    setupLazyLoading();
});
</script>

<template>
    <div class="blog-container">
        <Card class="blog-redirect">
            <template #header>
                <div class="header" @click="blog_redirect">
                    <h2>博客站主页</h2><span>></span>
                </div>
            </template>

            <template #content>
                <div class="content">
                    <div class="head-image">
                        <img src="@/assets/avatar3.jpg" alt="Head Image" />
                    </div>
                    <div class="head-text">
                        <h3>Hi, I'm zx!</h3>
                        <p>点击访问我的博客站首页，欢迎常来做客！</p>
                    </div>
                </div>
            </template>
        </Card>

        <div class="blog-recent">
            <h2 class="recent-title">#Recently</h2>

            <div v-if="loading" class="loading-state">
                <p>正在加载最新文章...</p>
            </div>

            <div v-else-if="error" class="error-state">
                <p>{{ error }}</p>
                <button @click="() => fetchRecentPosts">重试</button>
            </div>

            <div v-else class="recent-cards">
                <Card v-for="post in recentPosts" :key="post.url" class="article-card" @click="openArticle(post.url)">
                    <template #header>
                        <div class="article-header">
                            <h3>{{ post.title }}</h3>
                        </div>
                    </template>

                    <template #content>
                        <div class="article-content">
                            <div class="article-image">
                                <img 
                                    :data-src="post.imageUrl || defaultImage" 
                                    :alt="post.title" 
                                    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
                                />
                            </div>
                            <div class="article-date">
                                {{ post.date }}
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>


<style lang="scss" scoped>
.blog-redirect {
    margin: auto;
    width: 80%;

    .header {
        width: 100%;
        cursor: pointer;
        display: flex;
        flex-direction: row;

        h2 {
            flex: 1 0 90%;
            height: 100%;
        }

        span {
            flex: 0 0 10%;
            height: 100%;
            text-align: right;
            font-size: 2rem;
            padding-right: 1rem;
            color: #5C6BC0;
            /*Indigo 400*/
        }
    }

    .content {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;

        .head-image {
            flex: 0 0 20%;
            text-align: center;
            justify-content: center;

            img {
                width: 6rem;
                height: 6rem;
                border-radius: 2rem;
                margin: 4px;
            }
        }

        .head-text {
            padding-top: 1rem;
            flex: 1 0 60%;

            p {
                width: 100%;
                margin-top: 1rem;
                word-wrap: break-word;
                overflow-wrap: break-word;
                white-space: normal;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }
}

.blog-recent {
    margin: 2rem 4rem;

    .recent-title {
        font-size: 1.6rem;
        margin: 2rem 4rem;
        color: #303F9F;
        /* Indigo 700 */
    }

    .loading-state,
    .error-state {
        text-align: center;
        padding: 2rem;
        background: #f5f5f5;
        border-radius: 8px;
        margin: 1rem auto;
        max-width: 80%;
    }

    .error-state {
        color: #F44336;
        /* Red 500 */

        button {
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: #303F9F;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;

            &:hover {
                background: #5C6BC0;
            }
        }
    }

    .recent-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;

        .article-card {
            cursor: pointer;
            transition: all 0.3s ease;

            &:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
            }

            .article-header {
                h3 {
                    font-size: 1.2rem;
                    margin: 0.5rem;
                    display: -webkit-box;
                    line-clamp: 2;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    min-height: 3rem;
                }
            }

            .article-content {
                padding: 0.5rem;

                .article-image {
                    width: 100%;
                    height: 160px;
                    overflow: hidden;
                    border-radius: 4px;

                    img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                }

                .article-date {
                    margin-top: 0.8rem;
                    color: #757575;
                    font-size: 0.9rem;
                    text-align: right;
                }
            }
        }
    }
}

// 响应式设计
@media (max-width: 768px) {
    .blog-redirect {
        width: 95%;
    }

    .blog-recent {
        margin: 1rem;

        .recent-title {
            margin: 1rem;
            text-align: center;
        }

        .recent-cards {
            grid-template-columns: 1fr;
            gap: 1rem;
        }
    }
}
</style>