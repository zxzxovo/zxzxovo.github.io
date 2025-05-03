<script setup lang="ts">
import Card from '../components/Card.vue';
import seqHereImg from '@/assets/seq-here.png';
import { onMounted } from 'vue';

const somethingFun = [
    {
        title: '好玩的标签',
        link: 'https://hizhixia.site',
        description: '这只是一个标签喵^w^',
    },
    {
        title: 'Unicode-Emoji Copy😼',
        link: '/fun/unicode-emoji',
        description: 'Unicode Emoji Chars ( AI generated )',
    }
]

const activeProjects = [
    {
        title: 'bio-here',
        link: "https://bio-here.github.io/",
        description: 'A series of bioinformatics tools',
        // image: seqHereImg,
        tags: ['Rust','bioinformatics',]
    },
    {
        title: 'bio-here/seq-here',
        link: "https://bio-here.github.io/seq-here",
        description: 'A fast tool for bio-sequence processing',
        image: seqHereImg,
        tags: ['Rust','bioinformatics', 'cli', 'linux', 'windows']
    },
    {
        title: 'bio-here/placecare',
        link: "https://bio-here.github.io/zh/project/placecare.html",
        description: 'A tool for cis-acting regulatory elements search, based on PLACE',
        // image: seqHereImg,
        tags: ['Rust','bioinformatics', 'cli', 'linux', 'windows', "PLACE", "string search"]
    },

    // {
    //     title: 'wipe-windows',
    //     link: 'https://example.com',
    //     description: 'A windows tool for wiping data',
    //     image: 'https://via.placeholder.com/150',
    //     tags: ['Rust', 'windows', 'rust', 'tauri', 'tool']
    // },
    // {
    //     title: 'install-me',
    //     link: 'https://example.com',
    //     description: 'A easy tool for installing software',
    //     image: 'https://via.placeholder.com/150',
    //     tags: ['Rust', 'installation', 'software', 'tool' ]
    // },
]

// 获取标签颜色
const getTagColor = (tag: string) => {
    const colorMap: Record<string, string> = {
        'rust': '#ff5722',
        'bioinformatics': '#26A69A',
        'cli': '#2196f3',
        'linux': '#455A64',
        'windows': '#42A5F5',
        'tauri': '#9c27b0',
        'tool': '#795548',
        'installation': '#ff9800',
        'software': '#3f51b5'
    };

    return colorMap[tag.toLowerCase()] || '#5C6BC0';
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
            document.querySelectorAll('.project-image img').forEach(img => {
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
    <div class="proj-container">
        <!-- 有趣项目部分 -->
        <div class="section proj-fun">
            <h2 class="title">Something Fun</h2>
            <div class="projects-container fun-projects">
                <Card v-for="(project, index) in somethingFun" :key="index" class="project-card fun-card">
                    <template #header>
                        <div class="card-header">
                            <h3>{{ project.title }}</h3>
                        </div>
                    </template>
                    <template #content>
                        <div class="project-content fun-content">
                            <div class="project-info">
                                <p class="project-description">{{ project.description }}</p>
                            </div>
                        </div>
                    </template>
                    <template #footer>
                        <div class="fun-footer">
                            <div class="spacer"></div>
                            <a :href="project.link" target="_blank" class="project-link fun-link">Visit</a>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- 活跃项目部分 -->
        <div class="section proj-active">
            <h2 class="title">Active Projects</h2>
            <div class="projects-container masonry-layout">
                <Card v-for="(project, index) in activeProjects" 
                      :key="index" 
                      class="project-card"
                      :class="`height-variant-${index % 3}`">
                    <template #header>
                        <div class="card-header">
                            <h3>{{ project.title }}</h3>
                        </div>
                    </template>
                    <template #content>
                        <div class="project-content">
                            <div class="project-image">
                                <img 
                                    :data-src="project.image" 
                                    :alt="project.title" 
                                    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                                />
                            </div>
                            <div class="project-info">
                                <p class="project-description">{{ project.description }}</p>
                                <div class="project-tags">
                                    <span 
                                        v-for="(tag, tagIndex) in project.tags" 
                                        :key="tagIndex" 
                                        class="tag"
                                        :style="{ backgroundColor: getTagColor(tag) }">
                                        {{ tag }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template #footer>
                        <a :href="project.link" target="_blank" class="project-link">Visit Project</a>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>


<style lang="scss" scoped>
.proj-container {
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

// 项目容器
.projects-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
    
    &.fun-projects {
        flex-direction: row;
        align-items: stretch;
        max-width: 1200px;
    }
    
    &.masonry-layout {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        grid-auto-rows: minmax(100px, auto);
        grid-gap: 1.5rem;
        align-items: start;
    }
}

.project-card {
    flex: 1;
    min-width: 280px;
    max-width: 380px;
    margin-bottom: 1rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    
    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
    
    &.fun-card {
        max-width: 350px;
        min-width: 250px;
        margin-bottom: 0.8rem;
        flex: 0 1 calc(33.333% - 1.5rem);
        
        &:hover {
            transform: translateY(-3px);
        }
    }
    
    &.height-variant-0 {
        padding-bottom: 0.5rem;
    }
    
    &.height-variant-1 {
        padding-bottom: 1.5rem;
    }
    
    &.height-variant-2 {
        padding-bottom: 1rem;
    }
}

// 项目内容样式
.project-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    
    &.fun-content {
        padding: 0.5rem 1rem;
        flex-direction: row;
    }
    
    .project-image {
        width: 100%;
        height: auto;
        max-height: 180px;
        overflow: hidden;
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        
        img {
            width: auto;
            max-width: 100%;
            height: auto;
            max-height: 180px;
            object-fit: contain;
            transition: transform 0.3s ease;
            
            &:hover {
                transform: scale(1.05);
            }
        }
    }
    
    .project-info {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        
        .project-description {
            color: #616161; /* Grey 700 */
            line-height: 1.5;
            text-align: center;
            margin: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .project-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: center;
            
            .tag {
                padding: 0.3rem 0.8rem;
                border-radius: 16px;
                font-size: 0.8rem;
                color: white;
                white-space: nowrap;
            }
        }
    }
}

.project-link {
    display: block;
    text-align: center;
    padding: 0.5rem 1rem;
    background-color: #3F51B5; /* Indigo 500 */
    color: white;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 500;
    transition: background-color 0.2s ease;
    
    &:hover {
        background-color: #303F9F; /* Indigo 700 */
    }
    
    &.fun-link {
        padding: 0.3rem 0.7rem;
        font-size: 0.9rem;
        align-self: flex-end;
    }
}

.fun-footer {
    display: flex;
    justify-content: space-between;
    width: 100%;
    
    .spacer {
        flex-grow: 1;
    }
}

/* 响应式设计 */
@media (max-width: 960px) {
    .proj-container {
        width: 95%;
    }
    
    .project-card {
        min-width: 250px;
    }
    
    .project-card.fun-card {
        flex: 0 1 calc(50% - 1.5rem);
    }
    
    .projects-container.masonry-layout {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
}

@media (max-width: 600px) {
    .title {
        margin: 1.5rem 1rem;
    }
    
    .projects-container {
        flex-direction: column;
        align-items: center;
    }
    
    .projects-container.masonry-layout {
        display: flex;
        flex-direction: column;
    }
    
    .project-card {
        max-width: 95%;
    }
    
    .project-card.fun-card {
        flex: 0 1 100%;
    }
}
</style>