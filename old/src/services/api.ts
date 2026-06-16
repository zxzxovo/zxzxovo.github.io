import type {
  PostsData,
  BooksData,
  BlogPost,
  Book,
  SearchResult,
} from "@/types";
import { devWarn } from "@/utils/logger";

// API缓存
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 5; // 5分钟缓存

/**
 * 通用缓存处理函数
 */
function withCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = apiCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return Promise.resolve(cached.data);
  }

  return fetcher().then((data) => {
    apiCache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

/**
 * 获取所有文章数据
 */
export async function fetchPosts(): Promise<PostsData> {
  return withCache("posts", async () => {
    const response = await fetch("/posts.json");
    if (!response.ok) {
      throw new Error(`获取所有文章数据失败: ${response.status}`);
    }
    return response.json();
  });
}

/**
 * 获取单篇文章
 */
export async function fetchPost(slug: string): Promise<BlogPost> {
  return withCache(`post_${slug}`, async () => {
    const postsData = await fetchPosts();
    const post = postsData.posts.find((p) => p.slug === slug);

    if (!post) {
      throw new Error(`文章未找到: ${slug}`);
    }

    // 如果没有内容，从文件加载
    if (!post.content) {
      try {
        const contentResponse = await fetch(`/posts/${slug}/index.md`);
        if (contentResponse.ok) {
          post.content = await contentResponse.text();
        }
      } catch (error) {
        devWarn(`加载文章内容失败: ${slug}`, error);
      }
    }

    return post;
  });
}

/**
 * 获取所有书籍数据
 */
export async function fetchBooks(): Promise<BooksData> {
  return withCache("books", async () => {
    const response = await fetch("/books.json");
    if (!response.ok) {
      throw new Error(`获取书籍数据失败: ${response.status}`);
    }
    return response.json();
  });
}

/**
 * 获取单本书籍
 */
export async function fetchBook(bookId: string): Promise<Book> {
  return withCache(`book_${bookId}`, async () => {
    const booksData = await fetchBooks();
    const book = booksData.books.find((b) => b.id === bookId);

    if (!book) {
      throw new Error(`书籍未找到: ${bookId}`);
    }

    return book;
  });
}

/**
 * 获取书籍章节内容
 */
export async function fetchBookChapter(
  bookId: string,
  chapterId: string,
): Promise<string> {
  return withCache(`chapter_${bookId}_${chapterId}`, async () => {
    const response = await fetch(`/books/${bookId}/${chapterId}/index.md`);
    if (!response.ok) {
      throw new Error(`获取章节内容失败: ${response.status}`);
    }
    return response.text();
  });
}

/**
 * 搜索内容
 */
export async function searchContent(query: string): Promise<SearchResult[]> {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return [];
  }

  const results: SearchResult[] = [];

  try {
    // 搜索博客文章
    const postsData = await fetchPosts();
    const postResults = postsData.posts
      .filter((post) => !post.draft)
      .filter(
        (post) =>
          post.title.toLowerCase().includes(normalizedQuery) ||
          post.description.toLowerCase().includes(normalizedQuery) ||
          post.tags.some((tag) =>
            tag.toLowerCase().includes(normalizedQuery),
          ) ||
          post.categories.some((cat) =>
            cat.toLowerCase().includes(normalizedQuery),
          ),
      )
      .map((post) => ({
        id: `post-${post.slug}`,
        type: "blog" as const,
        title: post.title,
        description: post.description,
        excerpt: post.description,
        link: `/blog/${post.slug}`,
        date: post.date,
        tags: post.tags,
        categories: post.categories,
      }));

    results.push(...postResults);

    // 搜索书籍
    const booksData = await fetchBooks();
    const bookResults = booksData.books
      .filter(
        (book) =>
          book.title.toLowerCase().includes(normalizedQuery) ||
          book.description.toLowerCase().includes(normalizedQuery) ||
          book.author.some((author) =>
            author.toLowerCase().includes(normalizedQuery),
          ),
      )
      .map((book) => ({
        id: `book-${book.id}`,
        type: "book" as const,
        title: book.title,
        description: book.description,
        excerpt: book.description,
        link: book.ref === "book" ? `/book/${book.id}` : book.link || "#",
        author: book.author,
      }));

    results.push(...bookResults);
  } catch (error) {
    console.error("搜索失败:", error);
  }

  return results;
}

/**
 * 清除缓存
 */
export function clearCache(): void {
  apiCache.clear();
}

/**
 * 清除特定缓存
 */
export function clearCacheByKey(key: string): void {
  apiCache.delete(key);
}
