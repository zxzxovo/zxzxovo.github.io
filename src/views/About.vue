<script setup lang="ts">
import Card from '@/components/Card.vue';
import { ref, onMounted, onBeforeUnmount } from 'vue';

// 导入图片资源
import avatar from '@/assets/avatar3.jpg';
import me1 from '@/assets/me1.jpg';
import me2 from '@/assets/me2.jpg';
import me3 from '@/assets/me3.jpg';
import me4 from '@/assets/me4.jpg';
import me5 from '@/assets/me5.jpg';
import me6 from '@/assets/me6.jpg';

// 个人信息
const personalInfo = {
    name: 'Zhixia Lau',
    title: '软件开发 | 技术爱好者',
    avatar: avatar, // 使用导入的图片
    introduction: '这里是 芷夏 的赛博小站！欢迎 ^w^ ',
    quote: 'Here today, gone tomorrow.'
};

// 个人照片库
const gallery = [
    {
        img: me1, // 使用导入的图片
        title: '照片',
        description: ''
    },
    {
        img: me2, // 使用导入的图片
        title: '照片',
        description: ''
    },
    {
        img: me3, // 使用导入的图片
        title: '照片',
        description: ''
    },
    {
        img: me4, // 使用导入的图片
        title: '照片',
        description: ''
    },
    {
        img: me5, // 使用导入的图片
        title: '照片',
        description: ''
    },
    {
        img: me6, // 使用导入的图片
        title: '照片',
        description: ''
    }
];

// 最近活动
const recentActivities = {
    music: [
        { name: '迷失广州', artist: '唯利玉碎计划', link: '#' },
        { name: 'Stuck In A Moment You Can\'t Get Out Of', artist: 'U2', link: '#' },
        { name: '向往', artist: '李健', link: '#' },
        { name: '太史公之缢', artist: '沉默演讲', link: '#' },
        { name: '悲伤的梦', artist: '窦唯', link: '#' },
        { name: '你的城市', artist: '声音玩具', link: '#' }

    ],
    tech: [
        { name: 'Vue3', progress: 60, link: '' },
        { name: 'Java 后端技术', progress: 60, link: '' },
        { name: 'Tauri', progress: 80, link: '' },
    ],
    movies: [
        { name: '神探', rating: 9.7, comment: '挺不错的港片' },
        { name: '河边的错误', rating: 9.5, comment: '有些意思的文艺片' }
    ],
    articles: [
        { title: '西方哲学史：从古希腊到当下', source: '' },
        { title: '野草——鲁迅', source: ''},
        { title: '终结的感觉——巴恩斯', source: '' }
    ]
};


// 当前选中的活动类别
const activeTab = ref('music');

// 全图预览相关状态
const showFullImage = ref(false);
const currentImage = ref('');
const currentImageTitle = ref('');

// 打开全图预览
const openFullImage = (photo: { img: string; title: string; }) => {
    currentImage.value = photo.img;
    currentImageTitle.value = photo.title;
    showFullImage.value = true;
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
};

// 关闭全图预览
const closeFullImage = () => {
    showFullImage.value = false;
    // 恢复背景滚动
    document.body.style.overflow = '';
};

// 点击模态框背景时关闭
const handleModalClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).classList.contains('image-modal')) {
        closeFullImage();
    }
};

// 按ESC键关闭模态框
const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && showFullImage.value) {
        closeFullImage();
    }
};

// 增强图片懒加载功能
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
            document.querySelectorAll('.gallery-image img, .avatar').forEach(img => {
                imageObserver.observe(img);
            });
        }, 300);
    }
};

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    setupLazyLoading();
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown);
    // 确保页面卸载时恢复滚动
    document.body.style.overflow = '';
});

</script>

<template>
    <div class="about-container">
        <!-- 个人简介部分 -->
        <div class="section profile-section">
            <Card class="profile-card">
                <template #header>
                    <div class="profile-header">
                        <div class="avatar-container">
                            <img 
                                :data-src="personalInfo.avatar" 
                                alt="个人头像" 
                                class="avatar" 
                                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                            />
                        </div>
                        <div class="profile-title">
                            <h1>{{ personalInfo.name }}</h1>
                            <h2>{{ personalInfo.title }}</h2>
                        </div>
                    </div>
                </template>
                <template #content>
                    <div class="profile-content">
                        <p class="introduction">{{ personalInfo.introduction }}</p>
                        <blockquote class="profile-quote">
                            <p>{{ personalInfo.quote }}</p>
                        </blockquote>
                    </div>
                </template>
            </Card>
        </div>

        <!-- 最近活动部分 -->
        <div class="section">
            <h2 class="section-title">最近活动</h2>
            <Card class="activities-card">
                <template #header>
                    <div class="activities-tabs">
                        <div class="tab" 
                             :class="{ active: activeTab === 'music' }"
                             @click="activeTab = 'music'">
                             🎵 音乐
                        </div>
                        <div class="tab" 
                             :class="{ active: activeTab === 'tech' }"
                             @click="activeTab = 'tech'">
                             💻 技术
                        </div>
                        <div class="tab" 
                             :class="{ active: activeTab === 'movies' }"
                             @click="activeTab = 'movies'">
                             🎬 电影
                        </div>
                        <div class="tab" 
                             :class="{ active: activeTab === 'articles' }"
                             @click="activeTab = 'articles'">
                             📰 文章
                        </div>
                    </div>
                </template>
                <template #content>
                    <div class="activities-content">
                        <!-- 音乐列表 -->
                        <div v-if="activeTab === 'music'" class="music-list">
                            <div v-for="(item, index) in recentActivities.music" :key="index" class="music-item">
                                <div class="music-icon">🎵</div>
                                <div class="music-info">
                                    <h3>{{ item.name }}</h3>
                                    <p>{{ item.artist }}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 技术学习 -->
                        <div v-if="activeTab === 'tech'" class="tech-list">
                            <div v-for="(item, index) in recentActivities.tech" :key="index" class="tech-item">
                                <div class="tech-header">
                                    <h3>{{ item.name }}</h3>
                                    <span>{{ item.progress }}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress" :style="{ width: item.progress + '%' }"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 电影列表 -->
                        <div v-if="activeTab === 'movies'" class="movie-list">
                            <div v-for="(item, index) in recentActivities.movies" :key="index" class="movie-item">
                                <div class="movie-info">
                                    <h3>{{ item.name }}</h3>
                                    <div class="rating">
                                        <span v-for="i in 5" :key="i" class="star" 
                                              :class="{ filled: i <= item.rating/2 }">★</span>
                                        <span class="rating-value">{{ item.rating }}</span>
                                    </div>
                                    <p class="movie-comment">{{ item.comment }}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 文章列表 -->
                        <div v-if="activeTab === 'articles'" class="article-list">
                            <div v-for="(item, index) in recentActivities.articles" :key="index" class="article-item">
                                <div class="article-icon">📄</div>
                                <div class="article-info">
                                    <h3>{{ item.title }}</h3>
                                    <p>来源: {{ item.source }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- 照片库部分 -->
        <div class="section">
            <h2 class="section-title">照片库</h2>
            <div class="gallery-container">
                <div v-for="(photo, index) in gallery" :key="index" class="gallery-item" @click="openFullImage(photo)">
                    <div class="gallery-image">
                        <img 
                            :data-src="photo.img" 
                            :alt="photo.title" 
                            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                        />
                    </div>
                    <div class="gallery-overlay">
                        <h3>{{ photo.title }}</h3>
                        <p>{{ photo.description }}</p>
                        <span class="view-full">点击查看大图</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 图片全屏预览模态框 -->
        <Transition name="fade">
            <div v-if="showFullImage" class="image-modal" @click="handleModalClick">
                <div class="modal-content">
                    <button class="close-button" @click="closeFullImage">&times;</button>
                    <h3 v-if="currentImageTitle" class="modal-title">{{ currentImageTitle }}</h3>
                    <img :src="currentImage" alt="全图预览" />
                </div>
            </div>
        </Transition>
    </div>
</template>

<style lang="scss" scoped>
.about-container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 0;
}

.section {
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

// 个人简介样式
.profile-card {
    max-width: 900px;
    margin: 0 auto;
    
    .profile-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;
        padding: 1rem;
        
        .avatar-container {
            flex: 0 0 140px;
            margin-right: 2rem;
            
            .avatar {
                width: 140px;
                height: 140px;
                border-radius: 50%;
                object-fit: cover;
                border: 4px solid #C5CAE9; /* Indigo 100 */
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
        }
        
        .profile-title {
            flex: 1;
            
            h1 {
                font-size: 2.2rem;
                color: #3F51B5; /* Indigo 500 */
                margin: 0 0 0.5rem 0;
            }
            
            h2 {
                font-size: 1.3rem;
                color: #7986CB; /* Indigo 300 */
                font-weight: 400;
                margin: 0;
            }
        }
    }
    
    .profile-content {
        padding: 1rem 2rem 2rem;
        
        .introduction {
            font-size: 1.1rem;
            line-height: 1.6;
            color: #616161; /* Grey 700 */
            margin-bottom: 1.5rem;
        }
        
        .profile-quote {
            background-color: #E8EAF6; /* Indigo 50 */
            border-left: 4px solid #3F51B5; /* Indigo 500 */
            padding: 1rem 1.5rem;
            margin: 0;
            font-style: italic;
            color: #5C6BC0; /* Indigo 400 */
            
            p {
                margin: 0;
            }
        }
    }
}

// 最近活动样式
.activities-card {
    max-width: 900px;
    margin: 0 auto;

    .activities-tabs {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem;

        .tab {
            padding: 0.6rem 1.2rem;
            background-color: #E8EAF6; /* Indigo 50 */
            color: #5C6BC0; /* Indigo 400 */
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;

            &:hover {
                background-color: #C5CAE9; /* Indigo 100 */
            }

            &.active {
                background-color: #3F51B5; /* Indigo 500 */
                color: white;
            }
        }
    }

    .activities-content {
        padding: 1.5rem;
        min-height: 300px;
    }

    // 音乐列表样式
    .music-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .music-item {
            display: flex;
            align-items: center;
            padding: 0.8rem;
            background-color: #F5F5F5;
            border-radius: 8px;
            transition: background-color 0.2s ease;

            &:hover {
                background-color: #E8EAF6; /* Indigo 50 */
            }

            .music-icon {
                font-size: 1.5rem;
                margin-right: 1rem;
            }

            .music-info {
                flex: 1;

                h3 {
                    margin: 0 0 0.3rem 0;
                    font-size: 1.1rem;
                    color: #3F51B5; /* Indigo 500 */
                }

                p {
                    margin: 0;
                    color: #757575; /* Grey 600 */
                    font-size: 0.9rem;
                }
            }

            .music-link {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #3F51B5; /* Indigo 500 */
                color: white;
                border-radius: 50%;
                text-decoration: none;
                transition: transform 0.2s ease;

                &:hover {
                    transform: scale(1.1);
                }

                .play-icon {
                    font-size: 1rem;
                }
            }
        }
    }

    // 技术学习样式
    .tech-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;

        .tech-item {
            background-color: #F5F5F5;
            padding: 1rem;
            border-radius: 8px;

            .tech-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.8rem;

                h3 {
                    margin: 0;
                    color: #3F51B5; /* Indigo 500 */
                    font-size: 1.1rem;
                }

                span {
                    color: #5C6BC0; /* Indigo 400 */
                    font-weight: 600;
                }
            }

            .progress-bar {
                height: 8px;
                background-color: #E0E0E0;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.8rem;

                .progress {
                    height: 100%;
                    background-color: #3F51B5; /* Indigo 500 */
                    border-radius: 4px;
                }
            }

            .tech-link {
                display: inline-block;
                padding: 0.4rem 0.8rem;
                background-color: #E8EAF6; /* Indigo 50 */
                color: #3F51B5; /* Indigo 500 */
                border-radius: 4px;
                text-decoration: none;
                font-size: 0.9rem;
                transition: background-color 0.2s ease;

                &:hover {
                    background-color: #C5CAE9; /* Indigo 100 */
                }
            }
        }
    }

    // 电影列表样式
    .movie-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;

        .movie-item {
            background-color: #F5F5F5;
            padding: 1.2rem;
            border-radius: 8px;
            transition: transform 0.2s ease;

            &:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            }

            .movie-info {
                h3 {
                    margin: 0 0 0.8rem 0;
                    color: #3F51B5; /* Indigo 500 */
                    font-size: 1.2rem;
                }

                .rating {
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.8rem;

                    .star {
                        color: #E0E0E0;
                        font-size: 1.2rem;

                        &.filled {
                            color: #FFC107; /* Amber 500 */
                        }
                    }

                    .rating-value {
                        margin-left: 0.5rem;
                        color: #757575; /* Grey 600 */
                        font-weight: 600;
                    }
                }

                .movie-comment {
                    margin: 0;
                    color: #616161; /* Grey 700 */
                    font-style: italic;
                }
            }
        }
    }

    // 文章列表样式
    .article-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .article-item {
            display: flex;
            align-items: center;
            padding: 1rem;
            background-color: #F5F5F5;
            border-radius: 8px;
            transition: background-color 0.2s ease;

            &:hover {
                background-color: #E8EAF6; /* Indigo 50 */
            }

            .article-icon {
                font-size: 1.5rem;
                margin-right: 1rem;
                color: #5C6BC0; /* Indigo 400 */
            }

            .article-info {
                flex: 1;

                h3 {
                    margin: 0 0 0.3rem 0;
                    font-size: 1.1rem;
                    color: #3F51B5; /* Indigo 500 */
                }

                p {
                    margin: 0;
                    color: #757575; /* Grey 600 */
                    font-size: 0.9rem;
                }
            }

            .article-link {
                padding: 0.4rem 1rem;
                background-color: #3F51B5; /* Indigo 500 */
                color: white;
                border-radius: 4px;
                text-decoration: none;
                font-size: 0.9rem;
                transition: background-color 0.2s ease;

                &:hover {
                    background-color: #5C6BC0; /* Indigo 400 */
                }
            }
        }
    }
}

// 照片库样式
.gallery-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    
    .gallery-item {
        position: relative;
        height: 200px;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        
        &:hover .gallery-overlay {
            opacity: 1;
        }
        
        &:hover .gallery-image img {
            transform: scale(1.05);
        }
        
        .gallery-image {
            width: 100%;
            height: 100%;
            
            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }
        }
        
        .gallery-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(63, 81, 181, 0.7); /* Indigo 500 with opacity */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 1rem;
            opacity: 0;
            transition: opacity 0.3s ease;
            color: white;
            text-align: center;
            
            h3 {
                margin: 0 0 0.5rem 0;
                font-size: 1.2rem;
            }
            
            p {
                margin: 0;
                font-size: 0.9rem;
            }
            
            .view-full {
                margin-top: 0.8rem;
                padding: 0.4rem 0.8rem;
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 20px;
                font-size: 0.8rem;
                transition: background-color 0.2s ease;
                
                &:hover {
                    background-color: rgba(255, 255, 255, 0.3);
                }
            }
        }
    }
}

// 全图预览模态框样式
.image-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    cursor: pointer;
    padding: 2rem;
    box-sizing: border-box;
    
    .modal-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
        cursor: default;
        
        .close-button {
            position: absolute;
            top: -40px;
            right: -40px;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: background-color 0.2s ease;
            
            &:hover {
                background: rgba(255, 255, 255, 0.4);
            }
        }
        
        .modal-title {
            color: white;
            text-align: center;
            margin-top: 0;
            margin-bottom: 1rem;
        }
        
        img {
            max-width: 100%;
            max-height: 80vh;
            object-fit: contain;
            border-radius: 4px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
    }
}

// 模态框过渡动画
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

// 响应式设计
@media (max-width: 960px) {
    .about-container {
        width: 95%;
    }
    
    .profile-header {
        justify-content: center;
        text-align: center;
        
        .avatar-container {
            margin-right: 0;
            margin-bottom: 1.5rem;
        }
        
        .profile-title {
            flex: 0 0 100%;
            text-align: center;
        }
    }
    
    .gallery-container {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
    
    .activities-tabs {
        .tab {
            flex: 1 1 calc(50% - 0.5rem);
            text-align: center;
        }
    }
}

@media (max-width: 600px) {
    .section-title {
        font-size: 1.5rem;
    }
    
    .profile-content {
        padding: 1rem !important;
    }
    
    .profile-header .avatar-container .avatar {
        width: 120px;
        height: 120px;
    }
    
    .profile-title h1 {
        font-size: 1.8rem;
    }
    
    .gallery-container {
        grid-template-columns: 1fr;
    }
    
    .activities-tabs {
        .tab {
            flex: 1 1 100%;
        }
    }
}

@media (max-width: 768px) {
    .image-modal {
        padding: 1rem;
        
        .modal-content {
            .close-button {
                top: -30px;
                right: -10px;
            }
        }
    }
}
</style>