import type { Plugin } from 'vite'
import { writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

interface SitemapConfig {
  hostname: string
  staticRoutes?: Array<{
    path: string
    changefreq?: SitemapUrl['changefreq']
    priority?: number
  }>
  outDir?: string
}

export function sitemapGenerator(config: SitemapConfig): Plugin {
  const { hostname, staticRoutes = [], outDir = 'dist' } = config

  return {
    name: 'sitemap-generator',
    apply: 'build',
    writeBundle() {
      try {
        const urls: SitemapUrl[] = []
        const currentDate = new Date().toISOString().split('T')[0]

        // 添加静态路由
        staticRoutes.forEach(route => {
          urls.push({
            loc: `${hostname}${route.path}`,
            lastmod: currentDate,
            changefreq: route.changefreq || 'weekly',
            priority: route.priority || 0.8
          })
        })

        // 读取博客文章数据
        try {
          const postsData = JSON.parse(readFileSync(resolve(outDir, 'posts.json'), 'utf-8'))
          postsData.posts?.forEach((post: any) => {
            urls.push({
              loc: `${hostname}/blog/${encodeURIComponent(post.slug)}`,
              lastmod: post.lastModified ? new Date(post.lastModified).toISOString().split('T')[0] : currentDate,
              changefreq: 'monthly',
              priority: 0.9
            })
          })
        } catch (error) {
          console.warn('Warning: Could not read posts.json for sitemap generation:', error)
        }

        // 读取电子书数据
        try {
          const booksData = JSON.parse(readFileSync(resolve(outDir, 'books.json'), 'utf-8'))
          booksData.books?.forEach((book: any) => {
            if (book.ref === 'book') {
              // 添加书籍主页
              urls.push({
                loc: `${hostname}/book/${book.id}`,
                lastmod: currentDate,
                changefreq: 'monthly',
                priority: 0.7
              })

              // 添加章节页面
              if (book.chapters) {
                const addChapters = (chapters: any[], bookId: string) => {
                  chapters.forEach((chapter: any) => {
                    if (chapter.hasContent) {
                      urls.push({
                        loc: `${hostname}/book/${bookId}/${chapter.id}`,
                        lastmod: currentDate,
                        changefreq: 'monthly',
                        priority: 0.6
                      })
                    }
                    if (chapter.children) {
                      addChapters(chapter.children, bookId)
                    }
                  })
                }
                addChapters(book.chapters, book.id)
              }
            }
          })
        } catch (error) {
          console.warn('Warning: Could not read books.json for sitemap generation:', error)
        }

        // 生成sitemap XML
        const sitemapXml = generateSitemapXml(urls)
        
        // 写入sitemap.xml文件
        writeFileSync(resolve(outDir, 'sitemap.xml'), sitemapXml, 'utf-8')
        
        console.log(`✓ Sitemap generated with ${urls.length} URLs`)
        
        // 生成robots.txt
        generateRobotsTxt(hostname, outDir)
        
      } catch (error) {
        console.error('Error generating sitemap:', error)
      }
    }
  }
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
}

function generateRobotsTxt(hostname: string, outDir: string): void {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${hostname}/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1

# Disallow common non-content paths
Disallow: /admin/
Disallow: /api/
Disallow: /*.json$
Disallow: /*?*utm_*
Disallow: /*?*fbclid*
Disallow: /*?*gclid*
`

  writeFileSync(resolve(outDir, 'robots.txt'), robotsTxt, 'utf-8')
  console.log('✓ robots.txt generated')
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
