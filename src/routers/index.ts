import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router"
import Home from "../views/Home.vue"
import About from "../views/About.vue"
import Blog from "../views/Blog.vue"
import Projects from "../views/Projects.vue"
import Services from "../views/Services.vue"

const routes: Readonly<RouteRecordRaw[]> = [
    {
        path: '/',
        name: 'Index',
        children: [
            {
                path: '/',
                name: 'Home',
                components: {
                    main: Home,
                },
                meta: {
                    title: '首页 - Zhixia的官方网站'
                }
            },
            {
                path: '/blog',
                name: 'Blog',
                components: {
                    main: Blog,
                },
                meta: {
                    title: '博客 - Zhixia的官方网站'
                }
            },
            {
                path: 'projects',
                name: 'Projects',
                components: {
                    main: Projects,
                },
                meta: {
                    title: '项目 - Zhixia的官方网站'
                }
            },
            {
                path: 'services',
                name: 'Services',
                components: {
                    main: Services,
                },
                meta: {
                    title: '服务 - Zhixia的官方网站'
                }
            },
            {
                path: 'about',
                name: 'About',
                components: {
                    main: About,
                },
                meta: {
                    title: '关于我 - Zhixia的官方网站'
                }
            },
            {
                path: '/:pathMatch(.*)*',
                name: 'NotFound',
                components: {
                    main: () => import('../views/NotFound.vue'),
                },  
                meta: {
                    title: '页面未找到 - Zhixia的官方网站'
                }
            }
        ]
    },

]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    // 记住上次浏览位置
    scrollBehavior(_to, _from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { top: 0 };
        }
    }
})

// 动态设置页面标题
router.beforeEach((to, _from, next) => {
    if (to.meta.title) {
        document.title = to.meta.title as string;
    }
    next();
});

export default router
