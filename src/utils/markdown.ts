import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
// @ts-ignore - markdown-it-katex 缺少类型定义
import katex from 'markdown-it-katex';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

// 目录项接口
export interface TableOfContent {
  id: string;
  text: string;
  level: number;
  sectionNumber: string; // 添加节号，如 "1.", "1.1", "1.1.1" 等
}

// 缓存接口
interface MarkdownCache {
  content: string;
  html: string;
  toc: TableOfContent[];
  timestamp: number;
}

// 缓存存储（内存缓存）
const markdownCache = new Map<string, MarkdownCache>();
const CACHE_EXPIRY = 1000 * 60 * 10; // 10分钟缓存

// 缓存清理函数
function cleanupCache() {
  const now = Date.now();
  for (const [key, cache] of markdownCache.entries()) {
    if (now - cache.timestamp > CACHE_EXPIRY) {
      markdownCache.delete(key);
    }
  }
}

// 定期清理缓存
setInterval(cleanupCache, CACHE_EXPIRY);

// 创建自定义 SnackText 插件
const snackTextPlugin = (md: MarkdownIt) => {
  // 创建一个规则来处理 #后直接跟文字的语法
  md.inline.ruler.after('emphasis', 'snack_text', (state, silent) => {
    const start = state.pos;
    const max = state.posMax;
    
    // 检查是否以 # 开头
    if (state.src.charCodeAt(start) !== 0x23 /* # */) {
      return false;
    }
    
    // 检查 # 后面是否直接跟着非空格字符
    if (start + 1 >= max || state.src.charCodeAt(start + 1) === 0x20 /* space */) {
      return false;
    }
    
    // 寻找结束位置（遇到空格、换行或结束）
    let pos = start + 1;
    while (pos < max) {
      const ch = state.src.charCodeAt(pos);
      if (ch === 0x20 /* space */ || ch === 0x0A /* \n */ || ch === 0x0D /* \r */) {
        break;
      }
      pos++;
    }
    
    // 如果没有找到有效的文本
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
  
  // 渲染规则
  md.renderer.rules.snack_text = (tokens, idx) => {
    const token = tokens[idx];
    const content = md.utils.escapeHtml(token.content);
    return `<span class="snack-text-component">${content}</span>`;
  };
};

// 创建并配置 Markdown 实例
function createMarkdownInstance(): MarkdownIt {
  const md = new MarkdownIt({
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
    // 确保标题文本正确显示，不包含锚点标记
    tabIndex: false,
    // 自定义slugify函数，确保ID生成正确
    slugify: (str: string) => {
      // 清理标题文本并生成 ID
      const cleanStr = str.replace(/\{#[^}]*\}/g, '').trim();
      return cleanStr.toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
  })
  .use(katex, {
    throwOnError: false,
    errorColor: '#cc0000',
    // 启用严格的LaTeX渲染
    strict: 'warn',
    // 自定义宏定义
    macros: {
      "\\dots": "\\ldots",
      "\\div": "\\div",
      "\\times": "\\times",
      "\\cdot": "\\cdot"
    },
    // 信任函数，允许更多功能
    trust: () => true,
    // 输出格式
    output: 'html',
    // 允许最大长度
    maxSize: Infinity,
    // 允许最大展开
    maxExpand: 1000,
    // 全局组设置
    globalGroup: false,
    // 显示模式设置
    displayMode: false,
    // 左对齐
    fleqn: false
  })
  .use(snackTextPlugin);

  return md;
}

// 全局 Markdown 实例
let markdownInstance: MarkdownIt | null = null;

// 获取 Markdown 实例（单例模式）
export function getMarkdownInstance(): MarkdownIt {
  if (!markdownInstance) {
    markdownInstance = createMarkdownInstance();
  }
  return markdownInstance;
}

// 生成目录
export function generateTableOfContents(htmlContent: string): TableOfContent[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  // 用于跟踪各级别的编号
  const sectionNumbers: number[] = [0, 0, 0, 0, 0, 0]; // 支持6级标题
  
  return Array.from(headings).map((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    const text = heading.textContent || '';
    const id = heading.id || text.toLowerCase()
      .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
    
    // 确保heading有ID
    if (!heading.id) {
      heading.id = id;
    }
    
    // 生成节号
    sectionNumbers[level - 1]++; // 当前级别+1
    // 重置更低级别的编号
    for (let i = level; i < 6; i++) {
      sectionNumbers[i] = 0;
    }
    
    // 构建节号字符串，如 "1.", "1.1", "1.1.1"
    const sectionNumber = sectionNumbers
      .slice(0, level)
      .filter(num => num > 0)
      .join('.') + '.';
    
    return { id, text, level, sectionNumber };
  });
}

// 处理 Markdown 内容并添加样式
export function processMarkdownContent(content: string, options: { removeFirstH1?: boolean } = {}): string {
  let processedContent = content;
  
  console.log('开始处理Markdown内容，长度:', content.length);
  
  // 如果需要移除首个 H1 标题
  if (options.removeFirstH1) {
    // 移除第一个 H1 标题（包括可能的 ID 语法）
    processedContent = processedContent.replace(/^#\s+[^\n]+(\s*\{#[^}]+\})?\s*\n?/m, '');
  }
  
  const md = getMarkdownInstance();
  
  if (!md) {
    console.error('无法获取Markdown实例');
    return '<p class="text-red-500">Markdown引擎初始化失败</p>';
  }
  
  try {
    const html = md.render(processedContent);
    console.log('Markdown引擎渲染完成，HTML长度:', html.length);
    
    if (!html || html.trim().length === 0) {
      console.error('Markdown引擎返回空HTML');
      return '<p class="text-gray-600 dark:text-gray-400">内容为空</p>';
    }
    
    // 为段落、标题等添加Tailwind样式
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
    
    console.log('样式处理完成，最终HTML长度:', styledHtml.length);
    return styledHtml;
  } catch (error) {
    console.error('Markdown处理过程中发生错误:', error);
    return `<p class="text-red-500">内容处理失败: ${error instanceof Error ? error.message : '未知错误'}</p>`;
  }
}

// 快速标题提取（用于性能优化）
export function extractHeadingsFromMarkdown(content: string): TableOfContent[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  const headings: TableOfContent[] = [];
  
  // 用于跟踪各级别的编号
  const sectionNumbers: number[] = [0, 0, 0, 0, 0, 0]; // 支持6级标题
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    
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
    
    // 生成节号
    sectionNumbers[level - 1]++; // 当前级别+1
    // 重置更低级别的编号
    for (let i = level; i < 6; i++) {
      sectionNumbers[i] = 0;
    }
    
    // 构建节号字符串，如 "1.", "1.1", "1.1.1"
    const sectionNumber = sectionNumbers
      .slice(0, level)
      .filter(num => num > 0)
      .join('.') + '.';
    
    headings.push({ level, text, id: uniqueId, sectionNumber });
  }
  
  return headings;
}

// 为Markdown内容添加标题ID
export function addHeadingIds(content: string, _headings: TableOfContent[]): string {
  // 不再添加 {#id} 标记，让 markdown-it-anchor 插件自动处理
  // 这样可以避免标题显示 {#id} 的问题
  return content;
}

// 完整的Markdown渲染函数（包含目录生成）- 添加缓存支持
export function renderMarkdownWithTOC(content: string): { html: string; toc: TableOfContent[] } {
  try {
    console.log('渲染Markdown内容，长度:', content.length);
    
    // 提取标题
    const headings = extractHeadingsFromMarkdown(content);
    console.log('提取到的标题数量:', headings.length);
    
    // 添加ID到内容
    const processedContent = addHeadingIds(content, headings);
    console.log('处理后的内容长度:', processedContent.length);
    
    // 渲染HTML
    const html = processMarkdownContent(processedContent);
    console.log('渲染的HTML长度:', html.length);
    
    if (!html || html.trim().length === 0) {
      console.error('HTML渲染结果为空');
      return {
        html: '<p class="text-red-500">内容渲染为空</p>',
        toc: headings
      };
    }
    
    return { html, toc: headings };
  } catch (error) {
    console.error('Markdown 渲染错误:', error);
    return { 
      html: `<p class="text-red-500">内容渲染失败: ${error instanceof Error ? error.message : '未知错误'}</p>`, 
      toc: [] 
    };
  }
}
