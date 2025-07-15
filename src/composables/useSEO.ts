import { ref, watchEffect, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

interface SEOMetaData {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'book'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
}

interface StructuredData {
  '@context': string
  '@type': string
  [key: string]: any
}

export function useSEO() {
  const route = useRoute()
  
  // 默认SEO配置
  const defaultMeta: SEOMetaData = {
    title: 'Zhixia的官方网站',
    description: '一个关于技术、生活和思考的个人网站，分享编程经验、技术文章和生活感悟',
    keywords: 'Zhixia,个人博客,技术博客,Vue,Rust,编程,开发者',
    image: 'https://hizhixia.site/zx.svg',
    url: 'https://hizhixia.site',
    type: 'website',
    author: 'Zhixia'
  }

  const currentMeta = ref<SEOMetaData>({ ...defaultMeta })

  // 设置meta标签
  function setMeta(meta: Partial<SEOMetaData>) {
    currentMeta.value = { ...defaultMeta, ...meta }
    updateMetaTags()
  }

  // 更新DOM中的meta标签
  function updateMetaTags() {
    const meta = currentMeta.value

    // 设置页面标题
    if (meta.title) {
      document.title = meta.title
    }

    // 更新或创建meta标签
    updateMetaTag('description', meta.description)
    updateMetaTag('keywords', meta.keywords)
    updateMetaTag('author', meta.author)

    // Open Graph meta标签
    updateMetaTag('og:title', meta.title, 'property')
    updateMetaTag('og:description', meta.description, 'property')
    updateMetaTag('og:image', meta.image, 'property')
    updateMetaTag('og:url', meta.url, 'property')
    updateMetaTag('og:type', meta.type, 'property')
    updateMetaTag('og:site_name', 'Zhixia的官方网站', 'property')

    // Twitter Card meta标签
    updateMetaTag('twitter:card', 'summary_large_image', 'name')
    updateMetaTag('twitter:title', meta.title, 'name')
    updateMetaTag('twitter:description', meta.description, 'name')
    updateMetaTag('twitter:image', meta.image, 'name')

    // 文章相关meta标签
    if (meta.type === 'article') {
      updateMetaTag('article:author', meta.author, 'property')
      updateMetaTag('article:published_time', meta.publishedTime, 'property')
      updateMetaTag('article:modified_time', meta.modifiedTime, 'property')
      updateMetaTag('article:section', meta.section, 'property')
      
      // 文章标签
      if (meta.tags && meta.tags.length > 0) {
        // 先移除旧的标签
        removeMetaTags('article:tag')
        // 添加新的标签
        meta.tags.forEach(tag => {
          addMetaTag('article:tag', tag, 'property')
        })
      }
    }

    // 规范链接
    updateLinkTag('canonical', meta.url)
  }

  function updateMetaTag(name: string, content?: string, attribute: 'name' | 'property' = 'name') {
    if (!content) return

    let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement
    
    if (element) {
      element.content = content
    } else {
      element = document.createElement('meta')
      element.setAttribute(attribute, name)
      element.content = content
      document.head.appendChild(element)
    }
  }

  function addMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
    const element = document.createElement('meta')
    element.setAttribute(attribute, name)
    element.content = content
    document.head.appendChild(element)
  }

  function removeMetaTags(name: string, attribute: 'name' | 'property' = 'property') {
    const elements = document.querySelectorAll(`meta[${attribute}="${name}"]`)
    elements.forEach(element => element.remove())
  }

  function updateLinkTag(rel: string, href?: string) {
    if (!href) return

    let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement
    
    if (element) {
      element.href = href
    } else {
      element = document.createElement('link')
      element.rel = rel
      element.href = href
      document.head.appendChild(element)
    }
  }

  // 设置结构化数据
  function setStructuredData(data: StructuredData) {
    // 移除旧的结构化数据
    const oldScript = document.querySelector('script[type="application/ld+json"]')
    if (oldScript) {
      oldScript.remove()
    }

    // 添加新的结构化数据
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }

  // 为博客文章设置SEO
  function setBlogPostSEO(post: {
    title: string
    description?: string
    date: string
    lastModified?: string
    tags?: string[]
    slug: string
    image?: string
  }) {
    const meta: SEOMetaData = {
      title: `${post.title} - Zhixia的博客`,
      description: post.description || `阅读关于${post.title}的文章`,
      url: `https://hizhixia.site/blog/${encodeURIComponent(post.slug)}`,
      type: 'article',
      author: 'Zhixia',
      publishedTime: new Date(post.date).toISOString(),
      modifiedTime: post.lastModified ? new Date(post.lastModified).toISOString() : new Date(post.date).toISOString(),
      section: 'Blog',
      tags: post.tags,
      image: post.image ? `https://hizhixia.site${post.image}` : defaultMeta.image
    }

    setMeta(meta)

    // 设置博客文章的结构化数据
    const structuredData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description || '',
      image: meta.image,
      author: {
        '@type': 'Person',
        name: 'Zhixia',
        url: 'https://hizhixia.site/about'
      },
      publisher: {
        '@type': 'Person',
        name: 'Zhixia',
        logo: {
          '@type': 'ImageObject',
          url: 'https://hizhixia.site/zx.svg'
        }
      },
      datePublished: meta.publishedTime,
      dateModified: meta.modifiedTime,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': meta.url
      },
      keywords: post.tags?.join(',') || '',
      articleSection: 'Blog'
    }

    setStructuredData(structuredData)
  }

  // 为书籍设置SEO
  function setBookSEO(book: {
    title: string
    description?: string
    author?: string[]
    id: string
  }, chapter?: {
    title: string
    id: string
  }) {
    const isChapter = !!chapter
    const title = isChapter 
      ? `${chapter.title} - ${book.title} - Zhixia的电子书` 
      : `${book.title} - Zhixia的电子书`
    
    const url = isChapter
      ? `https://hizhixia.site/book/${book.id}/${chapter.id}`
      : `https://hizhixia.site/book/${book.id}`

    const meta: SEOMetaData = {
      title,
      description: book.description || `阅读${book.title}`,
      url,
      type: 'book',
      author: book.author?.join(', ') || 'Zhixia'
    }

    setMeta(meta)

    // 设置书籍的结构化数据
    const structuredData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: book.title,
      description: book.description || '',
      author: book.author?.map(name => ({
        '@type': 'Person',
        name
      })) || [{ '@type': 'Person', name: 'Zhixia' }],
      url: `https://hizhixia.site/book/${book.id}`,
      publisher: {
        '@type': 'Person',
        name: 'Zhixia'
      }
    }

    setStructuredData(structuredData)
  }

  // 监听路由变化，重置为默认meta
  watchEffect(() => {
    const routeMeta = route.meta
    if (routeMeta.title && typeof routeMeta.title === 'string') {
      setMeta({
        title: routeMeta.title,
        url: `https://hizhixia.site${route.path}`
      })
    }
  })

  // 组件卸载时清理
  onUnmounted(() => {
    // 可以在这里添加清理逻辑
  })

  return {
    currentMeta,
    setMeta,
    setBlogPostSEO,
    setBookSEO,
    setStructuredData
  }
}
