import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import RootIndex from "@views/Index.vue";
import Home  from "@views/Home.vue";

// 懒加载组件
const FunIndex = () => import("@views/fun/Index.vue");
const UnicodeEmoji = () => import("@views/fun/UnicodeEmoji.vue");
const About = () => import("@views/About.vue");
const Projects = () => import("@views/Projects.vue");
const Services = () => import("@views/Services.vue");
const Book = () => import("@views/Book.vue");
const BookContent = () => import("@views/BookContent.vue");
const Blog = () => import("@views/Blog.vue");
const BlogPost = () => import("@views/BlogPost.vue");
const NotFound = () => import("@views/NotFound.vue");

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
