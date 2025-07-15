import type { Plugin } from 'vite'
import { writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'

interface SitemapHtmlConfig {
  hostname: string
  siteName: string
  outDir?: string
}

export function sitemapHtmlGenerator(config: SitemapHtmlConfig): Plugin {
  const { hostname, siteName, outDir = 'dist' } = config

  return {
    name: 'sitemap-html-generator',
    apply: 'build',
    writeBundle() {
      try {
        // 读取posts和books数据
        let posts: any[] = []
        let books: any[] = []

        try {
          const postsData = JSON.parse(readFileSync(resolve(outDir, 'posts.json'), 'utf-8'))
          posts = postsData.posts || []
        } catch (error) {
          console.warn('Warning: Could not read posts.json for HTML sitemap generation')
        }

        try {
          const booksData = JSON.parse(readFileSync(resolve(outDir, 'books.json'), 'utf-8'))
          books = booksData.books || []
        } catch (error) {
          console.warn('Warning: Could not read books.json for HTML sitemap generation')
        }

        // 生成HTML sitemap
        const htmlSitemap = generateHtmlSitemap(hostname, siteName, posts, books)
        
        // 写入HTML sitemap文件
        writeFileSync(resolve(outDir, 'sitemap.html'), htmlSitemap, 'utf-8')
        
        console.log('✓ HTML sitemap generated')
        
      } catch (error) {
        console.error('Error generating HTML sitemap:', error)
      }
    }
  }
}

function generateHtmlSitemap(hostname: string, siteName: string, posts: any[], books: any[]): string {
  const currentDate = new Date().toLocaleDateString('zh-CN')
  
  // 按分类分组文章
  const postsByCategory = posts.reduce((acc: Record<string, any[]>, post: any) => {
    const category = post.categories?.[0] || '其他'
    if (!acc[category]) acc[category] = []
    acc[category].push(post)
    return acc
  }, {} as Record<string, any[]>)

  // 生成文章列表HTML
  const postsHtml = Object.entries(postsByCategory).map(([category, categoryPosts]: [string, any[]]) => `
    <div class="category-section">
      <h3 class="category-title">${category}</h3>
      <ul class="post-list">
        ${categoryPosts.map(post => `
          <li class="post-item">
            <a href="${hostname}/blog/${encodeURIComponent(post.slug)}" class="post-link">
              <span class="post-title">${post.title}</span>
              <span class="post-date">${new Date(post.date).toLocaleDateString('zh-CN')}</span>
            </a>
            ${post.description ? `<p class="post-description">${post.description}</p>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('')

  // 生成书籍列表HTML
  const booksHtml = books.filter(book => book.ref === 'book').map(book => `
    <div class="book-section">
      <h3 class="book-title">
        <a href="${hostname}/book/${book.id}" class="book-link">${book.title}</a>
      </h3>
      ${book.description ? `<p class="book-description">${book.description}</p>` : ''}
      ${book.chapters ? `
        <ul class="chapter-list">
          ${renderChapters(book.chapters, book.id, hostname)}
        </ul>
      ` : ''}
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>网站地图 - ${siteName}</title>
    <meta name="description" content="${siteName}的完整网站地图，包含所有页面、文章和电子书链接">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9fafb;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 50px;
        }
        
        .section h2 {
            font-size: 1.8rem;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .nav-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .nav-link {
            display: block;
            padding: 15px 20px;
            background: #f3f4f6;
            border-radius: 6px;
            text-decoration: none;
            color: #374151;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .nav-link:hover {
            background: #e5e7eb;
            color: #1f2937;
            transform: translateY(-2px);
        }
        
        .category-section {
            margin-bottom: 40px;
        }
        
        .category-title {
            font-size: 1.3rem;
            color: #4f46e5;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .post-list, .chapter-list {
            list-style: none;
        }
        
        .post-item, .chapter-item {
            margin-bottom: 15px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 6px;
            border-left: 4px solid #e5e7eb;
            transition: all 0.2s ease;
        }
        
        .post-item:hover, .chapter-item:hover {
            border-left-color: #4f46e5;
            background: #f3f4f6;
        }
        
        .post-link, .book-link, .chapter-link {
            text-decoration: none;
            color: #1f2937;
            font-weight: 500;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .post-link:hover, .book-link:hover, .chapter-link:hover {
            color: #4f46e5;
        }
        
        .post-title, .chapter-title {
            flex: 1;
        }
        
        .post-date {
            font-size: 0.9rem;
            color: #6b7280;
        }
        
        .post-description, .book-description {
            margin-top: 8px;
            color: #6b7280;
            font-size: 0.9rem;
            line-height: 1.5;
        }
        
        .book-section {
            margin-bottom: 40px;
        }
        
        .book-title {
            font-size: 1.3rem;
            margin-bottom: 10px;
        }
        
        .chapter-item {
            margin-left: 20px;
        }
        
        .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .content {
                padding: 20px;
            }
            
            .nav-links {
                grid-template-columns: 1fr;
            }
            
            .post-link {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .post-date {
                margin-top: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>网站地图</h1>
            <p>浏览 ${siteName} 的所有内容</p>
        </header>
        
        <main class="content">
            <section class="section">
                <h2>主要页面</h2>
                <div class="nav-links">
                    <a href="${hostname}/" class="nav-link">首页</a>
                    <a href="${hostname}/about" class="nav-link">关于我</a>
                    <a href="${hostname}/blog" class="nav-link">博客</a>
                    <a href="${hostname}/book" class="nav-link">电子书</a>
                    <a href="${hostname}/projects" class="nav-link">项目</a>
                    <a href="${hostname}/services" class="nav-link">服务</a>
                    <a href="${hostname}/fun/unicode-emoji" class="nav-link">Unicode表情</a>
                </div>
            </section>
            
            ${posts.length > 0 ? `
            <section class="section">
                <h2>博客文章 (${posts.length}篇)</h2>
                ${postsHtml}
            </section>
            ` : ''}
            
            ${books.filter(book => book.ref === 'book').length > 0 ? `
            <section class="section">
                <h2>电子书</h2>
                ${booksHtml}
            </section>
            ` : ''}
        </main>
        
        <footer class="footer">
            <p>最后更新: ${currentDate} | 由 ${siteName} 自动生成</p>
        </footer>
    </div>
</body>
</html>`
}

function renderChapters(chapters: any[], bookId: string, hostname: string): string {
  return chapters.map(chapter => `
    <li class="chapter-item">
      ${chapter.hasContent ? `
        <a href="${hostname}/book/${bookId}/${chapter.id}" class="chapter-link">
          <span class="chapter-title">${chapter.title}</span>
        </a>
      ` : `
        <span class="chapter-title">${chapter.title}</span>
      `}
      ${chapter.children ? `
        <ul class="chapter-list">
          ${renderChapters(chapter.children, bookId, hostname)}
        </ul>
      ` : ''}
    </li>
  `).join('')
}
