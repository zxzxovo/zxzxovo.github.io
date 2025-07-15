import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from "@tailwindcss/vite"
import { postsGeneratorPlugin } from './plugins/posts-generator.ts'
import { booksGeneratorPlugin } from './plugins/books-generator-plugin.ts'
import { sitemapGenerator } from './plugins/sitemap-generator.ts'
import { sitemapHtmlGenerator } from './plugins/sitemap-html-generator.ts'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    postsGeneratorPlugin(),
    booksGeneratorPlugin(),
    sitemapGenerator({
      hostname: 'https://hizhixia.site',
      staticRoutes: [
        { path: '/', changefreq: 'daily', priority: 1.0 },
        { path: '/about', changefreq: 'monthly', priority: 0.8 },
        { path: '/projects', changefreq: 'weekly', priority: 0.8 },
        { path: '/services', changefreq: 'monthly', priority: 0.7 },
        { path: '/blog', changefreq: 'daily', priority: 0.9 },
        { path: '/book', changefreq: 'weekly', priority: 0.8 },
        { path: '/fun/unicode-emoji', changefreq: 'monthly', priority: 0.6 },
      ]
    }),
    sitemapHtmlGenerator({
      hostname: 'https://hizhixia.site',
      siteName: 'Zhixia的官方网站'
    }),
  ],
  css: {
    postcss: './postcss.config.js'
  },
  assetsInclude: ['**/*.md'],
  
  // 性能优化配置
  build: {
    // 压缩配置
    minify: 'terser',
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动分包
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'markdown-vendor': ['markdown-it', 'highlight.js', 'katex'],
          'ui-vendor': ['@iconify/vue'],
        }
      }
    },
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 启用源码映射（仅开发环境）
    sourcemap: false,
  },
  
  // 别名配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@types': resolve(__dirname, 'src/types'),
      '@services': resolve(__dirname, 'src/services'),
      '@composables': resolve(__dirname, 'src/composables'),
    }
  },
  
  // 开发服务器配置
  server: {
    open: true,
    cors: true,
    // 热更新优化
    hmr: {
      overlay: true
    },
    // 预设代理（如需要）
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //   }
    // }
  },
  
  // 依赖预构建优化
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@iconify/vue',
      'highlight.js',
      'markdown-it',
      'katex'
    ],
    // 排除不需要预构建的依赖
    exclude: [
      // 'some-package'
    ]
  },
  
  // 预览服务器配置
  preview: {
    port: 4173,
    open: true,
  }
})
