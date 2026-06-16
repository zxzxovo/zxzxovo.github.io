import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from "@tailwindcss/vite"
import { postsGeneratorPlugin } from './plugins/posts-generator.ts'
import { booksGeneratorPlugin } from './plugins/books-generator-plugin.ts'
import { sitemapGenerator } from './plugins/sitemap-generator.ts'
import { sitemapHtmlGenerator } from './plugins/sitemap-html-generator.ts'
import { httpsAssetsPlugin } from './plugins/https-assets.ts'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vite.dev/config/
export default defineConfig({
  base: '/', // 确保使用绝对路径
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
    httpsAssetsPlugin(),
    // 📦 图片优化插件 - 自动压缩图片资源
    ViteImageOptimizer({
      // PNG 压缩
      png: {
        quality: 80,  // 质量 0-100
      },
      // JPEG 压缩
      jpeg: {
        quality: 80,
      },
      // JPG 压缩（同 JPEG）
      jpg: {
        quality: 80,
      },
      // WebP 转换（可选）
      webp: {
        quality: 80,
      },
      // SVG 优化
      svg: {
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,  // 保留 viewBox
              },
            },
          },
        ],
      },
    }),
    // Bundle 分析工具 - 仅在分析时启用
    visualizer({
      open: false,  // 构建后不自动打开
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })
  ],
  css: {
    postcss: './postcss.config.js'
  },
  assetsInclude: ['**/*.md'],
  
  // 性能优化配置
  build: {
    // 确保资源使用绝对路径
    assetsDir: 'assets',
    
    // ⚡ 使用 esbuild minify
    minify: 'esbuild',
    target: 'es2020',
    
    // 启用代码分割
    rollupOptions: {
      output: {
        // 🎯 精细化手动分包 - Rolldown 兼容模式（使用 manualChunks）
        // 注意：advancedChunks 在当前版本尚不可用，使用 manualChunks 作为过渡
        manualChunks: (id) => {
          // Vue 核心库
          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/')) {
            return 'vue-core';
          }
          if (id.includes('node_modules/vue-router/')) {
            return 'vue-router';
          }
          if (id.includes('node_modules/pinia/')) {
            return 'pinia';
          }
          
          // ⚡ Markdown 细分：将 1MB 的包拆分成多个小包
          if (id.includes('node_modules/markdown-it/')) {
            return 'markdown-parser';
          }
          if (id.includes('node_modules/katex/')) {
            return 'markdown-katex';
          }
          if (id.includes('node_modules/highlight.js/')) {
            return 'markdown-highlight';
          }
          if (id.includes('markdown-it-anchor') || id.includes('markdown-it-katex') || id.includes('markdown-it-table')) {
            return 'markdown-plugins';
          }
          
          // UI 库
          if (id.includes('node_modules/@iconify/')) {
            return 'iconify';
          }
          
          // Tailwind CSS 运行时（如果有）
          if (id.includes('tailwindcss')) {
            return 'tailwind';
          }
          
          // 其他第三方库
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        
        // 优化文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // 降低警告阈值，更早发现大文件
    chunkSizeWarningLimit: 500,
    
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    
    // 生产环境禁用 sourcemap（减小体积）
    sourcemap: false,
    
    // 提高构建性能
    reportCompressedSize: false,  // 禁用 gzip 大小报告以加快构建
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
    // 🆕 Rolldown 原生配置（替代过时的 esbuildOptions）
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
