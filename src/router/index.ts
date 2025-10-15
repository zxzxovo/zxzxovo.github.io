import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import RootIndex from "@views/Index.vue";
import Home  from "@views/Home.vue";

// 🚀 优化懒加载 - 使用精细的 chunk 分组
// 主要页面 - 单独分包
const About = () => import(/* webpackChunkName: "page-about" */ "@views/About.vue");
const Projects = () => import(/* webpackChunkName: "page-projects" */ "@views/Projects.vue");
const Services = () => import(/* webpackChunkName: "page-services" */ "@views/Services.vue");

// 博客相关 - 组合到一个 chunk（频繁一起使用）
const Blog = () => import(/* webpackChunkName: "feature-blog" */ "@views/Blog.vue");
const BlogPost = () => import(/* webpackChunkName: "feature-blog" */ "@views/BlogPost.vue");

// 书籍相关 - 组合到一个 chunk
const Book = () => import(/* webpackChunkName: "feature-book" */ "@views/Book.vue");
const BookContent = () => import(/* webpackChunkName: "feature-book" */ "@views/BookContent.vue");

// 趣味功能 - 组合到一个 chunk（低优先级）
const FunIndex = () => import(/* webpackChunkName: "feature-fun" */ "@views/fun/Index.vue");
const UnicodeEmoji = () => import(/* webpackChunkName: "feature-fun" */ "@views/fun/UnicodeEmoji.vue");
const SocialInsuranceCount = () => import(/* webpackChunkName: "feature-fun" */ "@views/fun/SocialInsuranceCount.vue");

// 错误页面 - 独立 chunk
const NotFound = () => import(/* webpackChunkName: "page-error" */ "@views/NotFound.vue");

const routes: Readonly<RouteRecordRaw[]> = [
  {
    path: "/",
    name: "Root",
    components: {
      appcontent: RootIndex,
    },
    children: [
      {
        path: "",
        name: "Home",
        components: {
          root: Home,
        },
        meta: {
          title: "首页 - Zhixia的官方网站",
        },
      },
      {
        path: "about",
        name: "About",
        components: {
          root: About,
        },
        meta: {
          title: "关于我",
        },
      },
      {
        path: "projects",
        name: "Projects",
        components: {
          root: Projects,
        },
        meta: {
          title: "项目",
        },
      },
      {
        path: "services",
        name: "Services",
        components: {
          root: Services,
        },
        meta: {
          title: "服务",
        },
      },
      {
        path: "book",
        name: "Book",
        components: {
          root: Book,
        },
        meta: {
          title: "电子书",
        },
      },
      {
        path: "blog",
        name: "Blog",
        components: {
          root: Blog,
        },
        meta: {
          title: "博客",
        },
      },
      {
        path: "blog/:slug",
        name: "BlogPost",
        components: {
          root: BlogPost,
        },
        meta: {
          title: "文章详情",
        },
      },
      {
        // 404 page
        path: ":pathMatch(.*)*",
        name: "NotFound",
        components: {
          root: NotFound,
        },
        meta: {
          title: "页面未找到",
        },
      },
    ],
  },
  {
    path: "/book/:bookId/:chapterId?",
    name: "BookContent",
    components: {
      appcontent: BookContent
    },
    props: true,
    meta: {
      title: "书籍内容",
    },
  },
  {
    // Fun projects page
    path: "/fun",
    components: {
      appcontent: FunIndex,
    },
    children: [
      {
        path: "unicode-emoji",
        name: "UnicodeEmoji",
        components: {
          fun: UnicodeEmoji,
        },
        meta: {
          title: "Unicode Emoji 表情符号",
        },
      },
      {
        path: "social-insurance",
        name: "SocialInsuracne",
        components: {
          fun: SocialInsuranceCount,
        },
        meta: {
          title: "社保缴纳计算",
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
  next();
});

export default router;
