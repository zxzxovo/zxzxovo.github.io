import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import toml from '@iarna/toml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置路径
const POSTS_DIR = path.join(__dirname, '../src/posts');
const OUTPUT_FILE = path.join(__dirname, '../public/posts.json');
const PUBLIC_POSTS_DIR = path.join(__dirname, '../public/posts');
const TEMPLATE_DIR = path.join(POSTS_DIR, '_template');

/**
 * 扫描posts目录并生成文章数据
 */
function generatePostsData() {
  console.log('🚀 开始扫描文章目录...');
  
  try {
    // 检查posts目录是否存在
    if (!fs.existsSync(POSTS_DIR)) {
      console.error('❌ posts目录不存在:', POSTS_DIR);
      return;
    }

    // 读取posts目录下的所有文件夹
    const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
    const postFolders = entries.filter(entry => 
      entry.isDirectory() && 
      entry.name !== '_template' && 
      entry.name !== 'template' &&
      !entry.name.startsWith('.')
    );

    console.log(`📁 发现 ${postFolders.length} 个文章文件夹`);

    const posts = [];
    const errors = [];

    // 处理每个文章文件夹
    for (const folder of postFolders) {
      try {
        console.log(`🔍 正在处理: ${folder.name}`);
        const postData = processPostFolder(folder.name);
        if (postData) {
          posts.push(postData);
          console.log(`✅ 处理成功: ${folder.name}`);
        }
      } catch (error) {
        console.error(`❌ 处理失败: ${folder.name}`, error.message);
        errors.push({ folder: folder.name, error: error.message });
      }
    }

    // 按日期排序（最新的在前）
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 生成统计信息
    const stats = generateStats(posts);

    // 生成最终的JSON数据
    const outputData = {
      posts,
      stats,
      errors,
      generated: new Date().toISOString()
    };

    // 确保public目录存在
    const publicDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // 写入JSON文件
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf8');

    console.log(`\n🎉 成功生成文章数据:`);
    console.log(`   📝 总文章数: ${posts.length}`);
    console.log(`   📂 分类数: ${stats.categories.length}`);
    console.log(`   🏷️  标签数: ${stats.tags.length}`);
    console.log(`   📄 输出文件: ${OUTPUT_FILE}`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  处理过程中发生 ${errors.length} 个错误:`);
      errors.forEach(err => console.log(`   • ${err.folder}: ${err.error}`));
    }

  } catch (error) {
    console.error('❌ 生成文章数据失败:', error);
    process.exit(1);
  }
}

/**
 * 处理单个文章文件夹
 */
function processPostFolder(folderName) {
  const folderPath = path.join(POSTS_DIR, folderName);
  const indexPath = path.join(folderPath, 'index.md');

  // 检查index.md是否存在
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.md 文件不存在');
  }

  // 读取并解析markdown文件
  const content = fs.readFileSync(indexPath, 'utf8');
  
  let frontMatter = {};
  let markdownContent = '';
  
  // 手动解析TOML front matter
  if (content.startsWith('+++')) {
    const endIndex = content.indexOf('+++', 3);
    if (endIndex !== -1) {
      const tomlString = content.substring(3, endIndex).trim();
      markdownContent = content.substring(endIndex + 3).trim();
      
      try {
        frontMatter = toml.parse(tomlString);
        console.log(`✅ 成功解析 ${folderName} 的 TOML:`, Object.keys(frontMatter));
      } catch (err) {
        console.error(`❌ TOML解析失败 ${folderName}:`, err.message);
        throw new Error('TOML解析失败: ' + err.message);
      }
    } else {
      throw new Error('未找到TOML结束标记');
    }
  } else {
    // 尝试使用 gray-matter 解析其他格式
    const parsed = matter(content);
    frontMatter = parsed.data;
    markdownContent = parsed.content;
  }

  // 验证必需字段
  if (!frontMatter.title) {
    throw new Error('缺少title字段');
  }

  if (!frontMatter.date) {
    throw new Error('缺少date字段');
  }

  // 复制文章文件夹中的所有资源文件
  copyPostAssets(folderName);

  // 检查文章图片
  let image = null;
  if (frontMatter.image) {
    const imagePath = path.join(folderPath, frontMatter.image);
    if (fs.existsSync(imagePath)) {
      // 图片已经通过 copyPostAssets 复制了，只需要设置URL
      image = `/posts/${folderName}/${frontMatter.image}`;
    }
  }

  // 生成文章摘要（如果description不存在）
  let description = frontMatter.description || '';
  if (!description && markdownContent) {
    // 从markdown内容提取前200个字符作为摘要
    const plainText = markdownContent
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/#+\s+/g, '') // 移除标题标记
      .replace(/[*_`]/g, '') // 移除格式化标记
      .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
      .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接
      .replace(/\n+/g, ' ') // 替换换行为空格
      .trim();
    
    description = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
  }

  // 构建文章数据对象
  const postData = {
    slug: folderName,
    title: frontMatter.title,
    description: description,
    date: frontMatter.date,
    image: image,
    categories: Array.isArray(frontMatter.categories) ? frontMatter.categories : 
                frontMatter.categories ? [frontMatter.categories] : [],
    tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : 
          frontMatter.tags ? [frontMatter.tags] : [],
    draft: frontMatter.draft === true,
    // 额外的元数据
    wordCount: markdownContent ? markdownContent.length : 0,
    readingTime: markdownContent ? Math.ceil(markdownContent.length / 1000) : 1, // 估算阅读时间（分钟）
    lastModified: fs.statSync(indexPath).mtime.toISOString()
  };

  return postData;
}

/**
 * 生成统计信息
 */
function generateStats(posts) {
  const categories = new Set();
  const tags = new Set();
  const years = new Set();

  posts.forEach(post => {
    // 收集分类
    post.categories.forEach(cat => categories.add(cat));
    
    // 收集标签
    post.tags.forEach(tag => tags.add(tag));
    
    // 收集年份
    const year = new Date(post.date).getFullYear();
    years.add(year);
  });

  // 计算分类统计
  const categoryStats = Array.from(categories).map(category => ({
    name: category,
    count: posts.filter(post => post.categories.includes(category)).length
  })).sort((a, b) => b.count - a.count);

  // 计算标签统计
  const tagStats = Array.from(tags).map(tag => ({
    name: tag,
    count: posts.filter(post => post.tags.includes(tag)).length
  })).sort((a, b) => b.count - a.count);

  // 计算年份统计
  const yearStats = Array.from(years).map(year => ({
    year: year,
    count: posts.filter(post => new Date(post.date).getFullYear() === year).length
  })).sort((a, b) => b.year - a.year);

  return {
    total: posts.length,
    published: posts.filter(post => !post.draft).length,
    draft: posts.filter(post => post.draft).length,
    categories: categoryStats,
    tags: tagStats,
    years: yearStats,
    totalWords: posts.reduce((sum, post) => sum + post.wordCount, 0),
    averageReadingTime: posts.length > 0 ? 
      Math.ceil(posts.reduce((sum, post) => sum + post.readingTime, 0) / posts.length) : 0
  };
}

/**
 * 复制图片到public目录
 */
function copyImageToPublic(folderName, imageName, sourcePath) {
  try {
    // 确保目标目录存在
    const targetDir = path.join(PUBLIC_POSTS_DIR, folderName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // 复制图片文件
    const targetPath = path.join(targetDir, imageName);
    fs.copyFileSync(sourcePath, targetPath);
    
    console.log(`📷 复制图片: ${folderName}/${imageName}`);
  } catch (error) {
    console.warn(`⚠️ 复制图片失败 ${folderName}/${imageName}:`, error.message);
  }
}

/**
 * 检查两个文件是否内容相同
 */
function filesAreIdentical(file1, file2) {
  try {
    // 如果目标文件不存在，则不相同
    if (!fs.existsSync(file2)) {
      return false;
    }
    
    // 比较文件大小
    const stat1 = fs.statSync(file1);
    const stat2 = fs.statSync(file2);
    
    if (stat1.size !== stat2.size) {
      return false;
    }
    
    // 比较文件内容
    const content1 = fs.readFileSync(file1, 'utf8');
    const content2 = fs.readFileSync(file2, 'utf8');
    
    return content1 === content2;
  } catch (error) {
    return false;
  }
}

/**
 * 复制文章文件夹中的所有文件到public目录
 */
function copyPostAssets(folderName) {
  try {
    const sourceFolderPath = path.join(POSTS_DIR, folderName);
    const targetFolderPath = path.join(PUBLIC_POSTS_DIR, folderName);
    
    // 确保目标目录存在
    if (!fs.existsSync(targetFolderPath)) {
      fs.mkdirSync(targetFolderPath, { recursive: true });
    }
    
    // 读取源文件夹中的所有文件
    const files = fs.readdirSync(sourceFolderPath);
    
    files.forEach(file => {
      const sourceFile = path.join(sourceFolderPath, file);
      const targetFile = path.join(targetFolderPath, file);
      
      // 复制所有文件，包括index.md，不复制子目录
      if (fs.statSync(sourceFile).isFile()) {
        // 检查文件是否需要更新
        if (!filesAreIdentical(sourceFile, targetFile)) {
          fs.copyFileSync(sourceFile, targetFile);
          console.log(`📁 复制文件: ${folderName}/${file}`);
        } else {
          console.log(`✓ 文件已是最新: ${folderName}/${file}`);
        }
      }
    });
    
  } catch (error) {
    console.warn(`⚠️ 复制文件失败 ${folderName}:`, error.message);
  }
}

// 执行脚本
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || 
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith('generate-posts.js')) {
  console.log('🎯 开始执行脚本...');
  generatePostsData();
}

export { generatePostsData };
