import { readdir, readFile, writeFile, mkdir, copyFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import matter from 'gray-matter';

interface BookConfig {
  ref: 'book' | 'link';
  title: string;
  description: string;
  author: string[];
  link?: string;
  image?: string;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  level: number;
  children?: Chapter[];
  hasContent: boolean;
  wordCount?: number;
}

interface BookCollection {
  id: string;
  title: string;
  description: string;
  author: string[];
  image?: string;
  ref: 'book' | 'link';
  link?: string;
  chapters?: Chapter[];
  stats?: {
    totalChapters: number;
    totalWords: number;
    lastModified: string;
  };
}

interface BooksData {
  books: BookCollection[];
  stats: {
    total: number;
    localBooks: number;
    externalLinks: number;
    totalChapters: number;
  };
  generated: string;
}

// 解析章节名称，提取顺序和标题
function parseChapterName(folderName: string): { order: number; title: string } {
  const match = folderName.match(/^(\d+)0-(.+)$/);
  if (match) {
    return {
      order: parseInt(match[1]),
      title: match[2]
    };
  }
  return {
    order: 999,
    title: folderName
  };
}

// 递归扫描章节结构
async function scanChapters(bookPath: string, currentPath: string = '', level: number = 0): Promise<Chapter[]> {
  const chapters: Chapter[] = [];
  const fullPath = join(bookPath, currentPath);
  
  if (!existsSync(fullPath)) {
    return chapters;
  }
  
  const items = await readdir(fullPath, { withFileTypes: true });
  const folders = items.filter(item => item.isDirectory());
  
  for (const folder of folders) {
    const folderPath = join(currentPath, folder.name);
    const fullFolderPath = join(fullPath, folder.name);
    
    // 支持 index.md 和 README.md 两种命名方式
    const indexPath = join(fullFolderPath, 'index.md');
    const readmePath = join(fullFolderPath, 'README.md');
    
    const { order, title: folderTitle } = parseChapterName(folder.name);
    
    let wordCount = 0;
    let hasContent = false;
    let contentFile = '';
    let actualTitle = folderTitle; // 默认使用文件夹名称作为标题
    
    // 检查是否有内容文件
    if (existsSync(indexPath)) {
      hasContent = true;
      contentFile = indexPath;
    } else if (existsSync(readmePath)) {
      hasContent = true;
      contentFile = readmePath;
    }
    
    if (hasContent) {
      try {
        const content = await readFile(contentFile, 'utf-8');
        const { content: markdownContent } = matter(content);
        wordCount = markdownContent.split(/\s+/).length;
        
        // 提取第一个一级标题作为章节标题
        const firstH1Title = extractFirstH1Title(content);
        if (firstH1Title) {
          actualTitle = firstH1Title;
          console.log(`📖 使用一级标题作为章节名: ${folderTitle} -> ${actualTitle}`);
        }
      } catch (error) {
        console.error(`读取章节文件失败: ${contentFile}`, error);
      }
    }
    
    // 递归扫描子章节
    const children = await scanChapters(bookPath, folderPath, level + 1);
    
    const chapter: Chapter = {
      id: folder.name,
      title: actualTitle,
      order,
      level,
      hasContent,
      wordCount
    };
    
    if (children.length > 0) {
      chapter.children = children;
    }
    
    chapters.push(chapter);
  }
  
  // 按顺序排序
  chapters.sort((a, b) => a.order - b.order);
  
  return chapters;
}

// 计算章节统计信息
function calculateBookStats(chapters: Chapter[]): { totalChapters: number; totalWords: number } {
  let totalChapters = 0;
  let totalWords = 0;
  
  function traverse(chapterList: Chapter[]) {
    for (const chapter of chapterList) {
      if (chapter.hasContent) {
        totalChapters++;
        totalWords += chapter.wordCount || 0;
      }
      if (chapter.children) {
        traverse(chapter.children);
      }
    }
  }
  
  traverse(chapters);
  
  return { totalChapters, totalWords };
}

// 从 Markdown 内容中提取第一个一级标题
function extractFirstH1Title(content: string): string | null {
  // 移除 frontmatter
  const { content: markdownContent } = matter(content);
  
  // 匹配第一个一级标题
  const h1Match = markdownContent.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }
  
  return null;
}

// 复制章节内容文件到 public 目录
async function copyChapterFiles(bookId: string, bookPath: string): Promise<void> {
  const targetDir = join(process.cwd(), 'public/books', bookId);
  
  // 确保目标目录存在
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }
  
  // 递归复制所有章节文件
  async function copyDir(srcDir: string, targetDir: string) {
    const items = await readdir(srcDir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.name === 'book.toml') continue; // 跳过配置文件
      
      const srcPath = join(srcDir, item.name);
      const targetPath = join(targetDir, item.name);
      
      if (item.isDirectory()) {
        if (!existsSync(targetPath)) {
          await mkdir(targetPath, { recursive: true });
        }
        await copyDir(srcPath, targetPath);
      } else if (item.name.endsWith('.md')) {
        // 直接复制文件，不进行重命名
        await copyFile(srcPath, targetPath);
      }
    }
  }
  
  await copyDir(bookPath, targetDir);
}
function parseToml(content: string): BookConfig {
  const lines = content.split('\n');
  const config: any = {};
  
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1);
      continue;
    }
    
    if (currentSection === 'book') {
      const match = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        
        if (value.startsWith('[') && value.endsWith(']')) {
          // 数组值
          config[key] = value.slice(1, -1).split(',').map(v => v.trim().replace(/"/g, ''));
        } else {
          // 字符串值
          config[key] = value.replace(/"/g, '');
        }
      }
    }
  }
  
  return config as BookConfig;
}

// 生成书籍数据
export async function generateBooksData(): Promise<void> {
  try {
    const booksDir = join(process.cwd(), 'src/books');
    const books: BookCollection[] = [];
    
    if (!existsSync(booksDir)) {
      console.warn('书籍目录不存在:', booksDir);
      return;
    }
    
    const bookFolders = await readdir(booksDir, { withFileTypes: true });
    
    for (const folder of bookFolders) {
      if (!folder.isDirectory()) continue;
      
      const bookPath = join(booksDir, folder.name);
      const configPath = join(bookPath, 'book.toml');
      
      if (!existsSync(configPath)) {
        console.warn(`跳过缺少配置文件的书籍: ${folder.name}`);
        continue;
      }
      
      try {
        const configContent = await readFile(configPath, 'utf-8');
        const config = parseToml(configContent);
        
        const book: BookCollection = {
          id: folder.name,
          title: config.title,
          description: config.description,
          author: Array.isArray(config.author) ? config.author : [config.author],
          image: config.image,
          ref: config.ref
        };
        
        if (config.link) {
          book.link = config.link;
        }
        
        // 如果是本站内容，扫描章节结构并复制文件
        if (config.ref === 'book') {
          const chapters = await scanChapters(bookPath);
          if (chapters.length > 0) {
            book.chapters = chapters;
            const stats = calculateBookStats(chapters);
            book.stats = {
              totalChapters: stats.totalChapters,
              totalWords: stats.totalWords,
              lastModified: new Date().toISOString().split('T')[0]
            };
          }
          
          // 复制章节文件到 public 目录
          await copyChapterFiles(folder.name, bookPath);
        }
        
        books.push(book);
        console.log(`✅ 处理书籍: ${config.title}`);
        
      } catch (error) {
        console.error(`处理书籍失败: ${folder.name}`, error);
      }
    }
    
    // 生成统计数据
    const stats = {
      total: books.length,
      localBooks: books.filter(book => book.ref === 'book').length,
      externalLinks: books.filter(book => book.ref === 'link').length,
      totalChapters: books.reduce((sum, book) => sum + (book.stats?.totalChapters || 0), 0)
    };
    
    const booksData: BooksData = {
      books,
      stats,
      generated: new Date().toISOString()
    };
    
    // 写入到 public 目录
    const outputPath = join(process.cwd(), 'public/books.json');
    await writeFile(outputPath, JSON.stringify(booksData, null, 2), 'utf-8');
    
    console.log(`📚 生成书籍数据完成: ${books.length} 个合集`);
    console.log(`   本站内容: ${stats.localBooks} 个`);
    console.log(`   外部链接: ${stats.externalLinks} 个`);
    console.log(`   总章节数: ${stats.totalChapters} 个`);
    
  } catch (error) {
    console.error('生成书籍数据失败:', error);
    throw error;
  }
}

export default generateBooksData;
