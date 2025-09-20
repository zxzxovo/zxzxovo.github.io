#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取命令行参数
const args = process.argv.slice(2);
const postTitle = args[0];

if (!postTitle) {
  console.error('❌ 请提供文章标题');
  console.log('用法: bun run newp "文章标题"');
  process.exit(1);
}

// 生成当前日期
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const currentDate = `${year}-${month}-${day}`;

// 创建文章目录
const postsDir = join(__dirname, '..', 'src', 'posts');
const newPostDir = join(postsDir, postTitle);

// 检查目录是否已存在
if (existsSync(newPostDir)) {
  console.error(`❌ 文章目录已存在: ${postTitle}`);
  process.exit(1);
}

try {
  // 创建目录
  mkdirSync(newPostDir, { recursive: true });
  
  // 读取模板文件
  const templatePath = join(postsDir, 'template', 'index.md');
  const templateContent = readFileSync(templatePath, 'utf-8');
  
  // 替换模板变量
  const newContent = templateContent
    .replace(/\{\{date\}\}/g, currentDate)
    .replace(/\{\{title\}\}/g, postTitle)
    .replace(/\{\{image\}\}/g, './navigation.jpg')
    .replace(/\{\{description\}\}/g, '在这里填写文章描述...')
    .replace(/\{\{categories\}\}/g, '技术')
    .replace(/\{\{tags\}\}/g, '标签');
  
  // 写入新文件
  const newPostPath = join(newPostDir, 'index.md');
  writeFileSync(newPostPath, newContent, 'utf-8');
  
  console.log(`✅ 新文章创建成功!`);
  console.log(`📂 路径: src/posts/${postTitle}/index.md`);
  console.log(`📅 日期: ${currentDate}`);
  console.log(`📝 标题: ${postTitle}`);
  console.log('');
  console.log('💡 提示:');
  console.log('1. 请编辑文章内容');
  console.log('2. 如需要，请添加导航图片 navigation.jpg');
  console.log('3. 运行 bun run generate-posts 来生成文章列表');
  
} catch (error) {
  console.error('❌ 创建文章失败:', error.message);
  process.exit(1);
}
