// 博客文章类型定义
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  image?: string;
  categories: string[];
  tags: string[];
  draft: boolean;
  content?: string;
  wordCount?: number;
  readingTime?: number;
  lastModified?: string;
}

// 文章数据统计
export interface PostsStats {
  total: number;
  published: number;
  draft: number;
  categories: Array<{ name: string; count: number }>;
  tags: Array<{ name: string; count: number }>;
  years: Array<{ year: number; count: number }>;
  totalWords: number;
  averageReadingTime: number;
}

// 文章数据接口
export interface PostsData {
  posts: BlogPost[];
  stats: PostsStats;
  errors: Array<{ folder: string; error: string }>;
  generated: string;
}

// 书籍章节类型
export interface BookChapter {
  id: string;
  title: string;
  order: number;
  level: number;
  hasContent: boolean;
  wordCount?: number;
  children?: BookChapter[];
}

// 书籍类型
export interface Book {
  id: string;
  title: string;
  description: string;
  author: string[];
  ref: string;
  link?: string;
  chapters?: BookChapter[];
  stats?: {
    totalChapters: number;
    totalWords: number;
    lastModified: string;
  };
}

// 书籍数据接口
export interface BooksData {
  books: Book[];
  stats: {
    total: number;
    localBooks: number;
    externalLinks: number;
    totalChapters: number;
  };
  generated: string;
}

// 搜索结果类型
export interface SearchResult {
  id: string;
  type: 'blog' | 'book' | 'chapter';
  title: string;
  description: string;
  excerpt?: string;
  link: string;
  date?: string;
  tags?: string[];
  categories?: string[];
  author?: string[];
  bookTitle?: string;
}

// 目录项类型
export interface TableOfContent {
  id: string;
  text: string;
  level: number;
  sectionNumber: string;
}

// API响应类型
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

// 主题类型
export type Theme = 'light' | 'dark';

// 视口类型
export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}
