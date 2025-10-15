/**
 * 🚀 优化版 Markdown 工具
 * 
 * 优化策略：
 * 1. 按需加载 highlight.js 语言包（减少初始包大小）
 * 2. 异步加载 KaTeX（数学公式不常用）
 * 3. 缓存已加载的语言
 * 4. 使用懒加载策略
 */

import type MarkdownIt from 'markdown-it';
import { devLog, devError } from './logger';

// 目录项接口
export interface TableOfContent {
  id: string;
  text: string;
  level: number;
  sectionNumber: string;
}

// 缓存接口
interface MarkdownCache {
  content: string;
  html: string;
  toc: TableOfContent[];
  timestamp: number;
}

// 已加载的语言包缓存
const loadedLanguages = new Set<string>();

// Markdown 缓存
const markdownCache = new Map<string, MarkdownCache>();
const CACHE_EXPIRY = 1000 * 60 * 10; // 10分钟

// 缓存清理
function cleanupCache() {
  const now = Date.now();
  for (const [key, cache] of markdownCache.entries()) {
    if (now - cache.timestamp > CACHE_EXPIRY) {
      markdownCache.delete(key);
    }
  }
}

setInterval(cleanupCache, CACHE_EXPIRY);

// 🎯 按需加载 highlight.js 语言包
async function loadHighlightLanguage(lang: string): Promise<void> {
  if (loadedLanguages.has(lang)) {
    return;
  }

  const languageMap: Record<string, () => Promise<any>> = {
    // 常用语言
    'javascript': () => import('highlight.js/lib/languages/javascript'),
    'typescript': () => import('highlight.js/lib/languages/typescript'),
    'python': () => import('highlight.js/lib/languages/python'),
    'java': () => import('highlight.js/lib/languages/java'),
    'rust': () => import('highlight.js/lib/languages/rust'),
    'go': () => import('highlight.js/lib/languages/go'),
    'cpp': () => import('highlight.js/lib/languages/cpp'),
    'c': () => import('highlight.js/lib/languages/c'),
    
    // Web 相关
    'html': () => import('highlight.js/lib/languages/xml'),
    'xml': () => import('highlight.js/lib/languages/xml'),
    'css': () => import('highlight.js/lib/languages/css'),
    'scss': () => import('highlight.js/lib/languages/scss'),
    'json': () => import('highlight.js/lib/languages/json'),
    
    // Shell 和配置
    'bash': () => import('highlight.js/lib/languages/bash'),
    'shell': () => import('highlight.js/lib/languages/shell'),
    'yaml': () => import('highlight.js/lib/languages/yaml'),
    'toml': () => import('highlight.js/lib/languages/ini'), // TOML 类似 INI
    
    // 其他
    'sql': () => import('highlight.js/lib/languages/sql'),
    'markdown': () => import('highlight.js/lib/languages/markdown'),
    'dockerfile': () => import('highlight.js/lib/languages/dockerfile'),
  };

  try {
    if (languageMap[lang]) {
      const { default: langModule } = await languageMap[lang]();
      const hljs = (await import('highlight.js/lib/core')).default;
      hljs.registerLanguage(lang, langModule);
      loadedLanguages.add(lang);
      devLog(`已加载语言包: ${lang}`);
    }
  } catch (error) {
    devError(`加载语言包失败: ${lang}`, error);
  }
}

// 🎯 按需加载 KaTeX
let katexLoaded = false;
let katexPlugin: any = null;

async function loadKatex() {
  if (katexLoaded) {
    return katexPlugin;
  }

  try {
    // 动态导入 KaTeX 样式和插件
    await import('katex/dist/katex.min.css');
    // @ts-ignore - markdown-it-katex 缺少类型定义
    const katexModule = await import('markdown-it-katex');
    katexPlugin = katexModule.default;
    katexLoaded = true;
    devLog('KaTeX 已加载');
    return katexPlugin;
  } catch (error) {
    devError('KaTeX 加载失败', error);
    return null;
  }
}

// 创建自定义 SnackText 插件
const snackTextPlugin = (md: MarkdownIt) => {
  md.inline.ruler.before('text', 'snack_text', (state, silent) => {
    const start = state.pos;
    const max = state.posMax;
    
    if (state.src.charCodeAt(start) !== 0x23 /* # */) {
      return false;
    }
    
    if (start > 0) {
      const prevChar = state.src.charCodeAt(start - 1);
      if (prevChar === 0x0A /* \n */ || prevChar === 0x0D /* \r */) {
        if (start + 1 < max && state.src.charCodeAt(start + 1) === 0x20 /* space */) {
          return false;
        }
      }
    }
    
    if (start + 1 >= max) {
      return false;
    }
    
    const nextChar = state.src.charCodeAt(start + 1);
    if (nextChar === 0x20 /* space */ || nextChar === 0x0A /* \n */ || nextChar === 0x0D /* \r */) {
      return false;
    }
    
    let pos = start + 1;
    while (pos < max) {
      const ch = state.src.charCodeAt(pos);
      if (ch === 0x20 || ch === 0x0A || ch === 0x0D ||
          ch === 0x2E || ch === 0x2C || ch === 0x21 ||
          ch === 0x3F || ch === 0x3A || ch === 0x3B) {
        break;
      }
      pos++;
    }
    
    if (pos === start + 1) {
      return false;
    }
    
    if (!silent) {
      const token = state.push('snack_text', 'span', 0);
      token.content = state.src.slice(start, pos);
      token.markup = '#';
    }
    
    state.pos = pos;
    return true;
  });
  
  md.renderer.rules.snack_text = (tokens, idx) => {
    const token = tokens[idx];
    const content = md.utils.escapeHtml(token.content);
    return `<span class="snack-text-component">${content}</span>`;
  };
};

// 🚀 创建优化的 Markdown 实例
let markdownInstance: MarkdownIt | null = null;

async function createMarkdownInstance(): Promise<MarkdownIt> {
  // 动态导入核心库
  const MarkdownItModule = await import('markdown-it');
  const MarkdownItConstructor = MarkdownItModule.default;
  
  const anchorModule = await import('markdown-it-anchor');
  const anchor = anchorModule.default;
  
  // 导入 highlight.js 核心（不含语言包）
  const hljsModule = await import('highlight.js/lib/core');
  const hljs = hljsModule.default;
  
  // 导入 github-dark 主题样式
  await import('highlight.js/styles/github-dark.css');
  
  const md = new MarkdownItConstructor({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
    highlight: function (str: string, lang: string): string {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="bg-gray-900 dark:bg-gray-800 rounded-lg overflow-x-auto p-4 my-4"><code class="text-gray-100 text-sm font-mono leading-relaxed">${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
        } catch (__) {}
      }
      return `<pre class="bg-gray-900 dark:bg-gray-800 rounded-lg overflow-x-auto p-4 my-4"><code class="text-gray-100 text-sm font-mono leading-relaxed">${md.utils.escapeHtml(str)}</code></pre>`;
    }
  })
  .use(anchor, {
    permalink: anchor.permalink.ariaHidden({
      symbol: '',
      placement: 'before'
    }),
    tabIndex: false,
    slugify: (str: string) => {
      const cleanStr = str.replace(/\{#[^}]*\}/g, '').trim();
      return cleanStr.toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
  })
  .use(snackTextPlugin);

  return md;
}

// 获取 Markdown 实例
export async function getMarkdownInstance(): Promise<MarkdownIt> {
  if (!markdownInstance) {
    markdownInstance = await createMarkdownInstance();
  }
  return markdownInstance;
}

// 🎯 检测内容中使用的语言
function detectLanguages(content: string): string[] {
  const languageRegex = /```(\w+)/g;
  const languages = new Set<string>();
  let match;
  
  while ((match = languageRegex.exec(content)) !== null) {
    languages.add(match[1]);
  }
  
  return Array.from(languages);
}

// 🎯 检测是否包含数学公式
function hasKatexContent(content: string): boolean {
  return content.includes('$$') || content.includes('$');
}

// 生成目录
export function generateTableOfContents(htmlContent: string): TableOfContent[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  const sectionNumbers: number[] = [0, 0, 0, 0, 0, 0];
  
  return Array.from(headings).map((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    const text = heading.textContent || '';
    const id = heading.id || text.toLowerCase()
      .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
    
    if (!heading.id) {
      heading.id = id;
    }
    
    sectionNumbers[level - 1]++;
    for (let i = level; i < 6; i++) {
      sectionNumbers[i] = 0;
    }
    
    const sectionNumber = sectionNumbers
      .slice(0, level)
      .filter(num => num > 0)
      .join('.') + '.';
    
    return { id, text, level, sectionNumber };
  });
}

// 🚀 优化的 Markdown 渲染函数
export async function processMarkdownContent(
  content: string, 
  options: { removeFirstH1?: boolean } = {}
): Promise<string> {
  let processedContent = content;
  
  devLog('开始处理Markdown内容，长度:', content.length);
  
  if (options.removeFirstH1) {
    processedContent = processedContent.replace(/^#\s+[^\n]+(\s*\{#[^}]+\})?\s*\n?/m, '');
  }
  
  // 🎯 预加载需要的语言包
  const languages = detectLanguages(processedContent);
  devLog('检测到的语言:', languages);
  await Promise.all(languages.map(lang => loadHighlightLanguage(lang)));
  
  // 🎯 如果包含数学公式，加载 KaTeX
  if (hasKatexContent(processedContent)) {
    const katex = await loadKatex();
    const md = await getMarkdownInstance();
    if (katex && !katexLoaded) {
      md.use(katex, {
        throwOnError: false,
        errorColor: '#cc0000',
        strict: 'warn',
        trust: () => true,
        output: 'html',
      });
      katexLoaded = true;
    }
  }
  
  const md = await getMarkdownInstance();
  
  if (!md) {
    devError('无法获取Markdown实例');
    return '<p class="text-red-500">Markdown引擎初始化失败</p>';
  }
  
  try {
    const html = md.render(processedContent);
    devLog('Markdown引擎渲染完成，HTML长度:', html.length);
    
    if (!html || html.trim().length === 0) {
      devError('Markdown引擎返回空HTML');
      return '<p class="text-gray-600 dark:text-gray-400">内容为空</p>';
    }
    
    // 添加样式
    const styledHtml = html
      .replace(/<h1([^>]*)>/g, '<h1$1 class="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onclick="updateUrlHash(this.id)">')
      .replace(/<h2([^>]*)>/g, '<h2$1 class="text-2xl font-semibold text-gray-900 dark:text-white mt-6 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onclick="updateUrlHash(this.id)">')
      .replace(/<h3([^>]*)>/g, '<h3$1 class="text-xl font-semibold text-gray-900 dark:text-white mt-5 mb-2 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onclick="updateUrlHash(this.id)">')
      .replace(/<h4([^>]*)>/g, '<h4$1 class="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onclick="updateUrlHash(this.id)">')
      .replace(/<h5([^>]*)>/g, '<h5$1 class="text-base font-medium text-gray-900 dark:text-white mt-4 mb-2 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onclick="updateUrlHash(this.id)">')
      .replace(/<h6([^>]*)>/g, '<h6$1 class="text-sm font-medium text-gray-900 dark:text-white mt-4 mb-2 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onclick="updateUrlHash(this.id)">')
      .replace(/<p>/g, '<p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">')
      .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-950/30 text-gray-700 dark:text-gray-300 italic">')
      .replace(/<ul>/g, '<ul class="list-disc list-inside space-y-2 my-4 text-gray-700 dark:text-gray-300">')
      .replace(/<ol>/g, '<ol class="list-decimal list-inside space-y-2 my-4 text-gray-700 dark:text-gray-300">')
      .replace(/<li>/g, '<li class="ml-4">')
      .replace(/<a /g, '<a class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline" ')
      .replace(/<code([^>]*)>/g, '<code$1 class="bg-gray-100 dark:bg-gray-800 text-purple-600 dark:text-purple-400 px-1 py-0.5 rounded text-sm font-mono">')
      .replace(/<table>/g, '<div class="overflow-x-auto my-4"><table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">')
      .replace(/<\/table>/g, '</table></div>')
      .replace(/<thead>/g, '<thead class="bg-gray-50 dark:bg-gray-800">')
      .replace(/<th>/g, '<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">')
      .replace(/<td>/g, '<td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">')
      .replace(/<hr>/g, '<hr class="my-8 border-gray-200 dark:border-gray-700">');
    
    devLog('样式处理完成，最终HTML长度:', styledHtml.length);
    return styledHtml;
  } catch (error) {
    devError('Markdown处理过程中发生错误:', error);
    return `<p class="text-red-500">内容处理失败: ${error instanceof Error ? error.message : '未知错误'}</p>`;
  }
}

// 快速标题提取
export function extractHeadingsFromMarkdown(content: string): TableOfContent[] {
  const lines = content.split('\n');
  const headings: TableOfContent[] = [];
  const sectionNumbers: number[] = [0, 0, 0, 0, 0, 0];
  
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('```') || trimmedLine.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    if (inCodeBlock || /^\s{4,}/.test(line)) {
      continue;
    }
    
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      let uniqueId = id;
      let counter = 1;
      while (headings.some(h => h.id === uniqueId)) {
        uniqueId = `${id}-${counter}`;
        counter++;
      }
      
      sectionNumbers[level - 1]++;
      for (let j = level; j < 6; j++) {
        sectionNumbers[j] = 0;
      }
      
      const sectionNumber = sectionNumbers
        .slice(0, level)
        .filter(num => num > 0)
        .join('.') + '.';
      
      headings.push({ level, text, id: uniqueId, sectionNumber });
    }
  }
  
  return headings;
}

// 完整的Markdown渲染函数
export async function renderMarkdownWithTOC(content: string): Promise<{ html: string; toc: TableOfContent[] }> {
  try {
    devLog('渲染Markdown内容，长度:', content.length);
    
    const headings = extractHeadingsFromMarkdown(content);
    devLog('提取到的标题数量:', headings.length);
    
    const html = await processMarkdownContent(content);
    devLog('渲染的HTML长度:', html.length);
    
    if (!html || html.trim().length === 0) {
      devError('HTML渲染结果为空');
      return {
        html: '<p class="text-red-500">内容渲染为空</p>',
        toc: headings
      };
    }
    
    return { html, toc: headings };
  } catch (error) {
    devError('Markdown 渲染错误:', error);
    return { 
      html: `<p class="text-red-500">内容渲染失败: ${error instanceof Error ? error.message : '未知错误'}</p>`, 
      toc: [] 
    };
  }
}
