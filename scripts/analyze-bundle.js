#!/usr/bin/env node

/**
 * 🔍 Bundle 分析脚本
 * 
 * 使用方法：
 * bun run analyze
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔍 开始分析构建产物...\n');

// 1. 执行构建并生成分析报告
console.log('📦 执行生产构建...');
try {
  execSync('bun run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

// 2. 分析 dist 目录
const distDir = join(process.cwd(), 'dist');
const assetsDir = join(distDir, 'assets');

console.log('\n📊 构建产物分析:\n');

// 获取所有文件大小
function getFileSize(filePath) {
  const stats = statSync(filePath);
  return stats.size;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function analyzeDirectory(dir, prefix = '') {
  const files = readdirSync(dir);
  const results = [];
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      const subResults = analyzeDirectory(filePath, prefix + file + '/');
      results.push(...subResults);
    } else {
      results.push({
        name: prefix + file,
        size: stat.size,
        path: filePath
      });
    }
  }
  
  return results;
}

// 分析文件
const files = analyzeDirectory(distDir);

// 按大小排序
files.sort((a, b) => b.size - a.size);

// 分类统计
const categories = {
  js: [],
  css: [],
  html: [],
  images: [],
  other: []
};

files.forEach(file => {
  if (file.name.endsWith('.js')) {
    categories.js.push(file);
  } else if (file.name.endsWith('.css')) {
    categories.css.push(file);
  } else if (file.name.endsWith('.html')) {
    categories.html.push(file);
  } else if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(file.name)) {
    categories.images.push(file);
  } else {
    categories.other.push(file);
  }
});

// 打印统计
console.log('📦 JavaScript 文件:');
let totalJsSize = 0;
categories.js.slice(0, 10).forEach((file, index) => {
  totalJsSize += file.size;
  const indicator = file.size > 500 * 1024 ? '🔴' : file.size > 200 * 1024 ? '🟡' : '🟢';
  console.log(`  ${indicator} ${index + 1}. ${file.name.padEnd(50)} ${formatSize(file.size)}`);
});
console.log(`  总计: ${formatSize(totalJsSize)}\n`);

console.log('🎨 CSS 文件:');
let totalCssSize = 0;
categories.css.forEach(file => {
  totalCssSize += file.size;
  console.log(`  • ${file.name.padEnd(50)} ${formatSize(file.size)}`);
});
console.log(`  总计: ${formatSize(totalCssSize)}\n`);

console.log('🖼️  图片文件:');
let totalImageSize = 0;
categories.images.slice(0, 10).forEach(file => {
  totalImageSize += file.size;
  const indicator = file.size > 100 * 1024 ? '🔴' : file.size > 50 * 1024 ? '🟡' : '🟢';
  console.log(`  ${indicator} ${file.name.padEnd(50)} ${formatSize(file.size)}`);
});
if (categories.images.length > 10) {
  console.log(`  ... 还有 ${categories.images.length - 10} 个文件`);
}
console.log(`  总计: ${formatSize(totalImageSize)}\n`);

// 总体统计
const totalSize = files.reduce((sum, file) => sum + file.size, 0);
console.log('📈 总体统计:');
console.log(`  JavaScript: ${formatSize(totalJsSize)} (${(totalJsSize / totalSize * 100).toFixed(1)}%)`);
console.log(`  CSS:        ${formatSize(totalCssSize)} (${(totalCssSize / totalSize * 100).toFixed(1)}%)`);
console.log(`  Images:     ${formatSize(totalImageSize)} (${(totalImageSize / totalSize * 100).toFixed(1)}%)`);
console.log(`  Other:      ${formatSize(categories.other.reduce((s, f) => s + f.size, 0))} (${(categories.other.reduce((s, f) => s + f.size, 0) / totalSize * 100).toFixed(1)}%)`);
console.log(`  ────────────────────────────────────────────────────────────`);
console.log(`  总计:       ${formatSize(totalSize)}\n`);

// 性能建议
console.log('💡 优化建议:');

const largeJsFiles = categories.js.filter(f => f.size > 500 * 1024);
if (largeJsFiles.length > 0) {
  console.log(`  ⚠️  发现 ${largeJsFiles.length} 个超过 500KB 的 JS 文件，建议:`);
  console.log(`     - 使用动态导入进行代码分割`);
  console.log(`     - 检查是否包含了不必要的依赖`);
  console.log(`     - 考虑使用 CDN 外部化大型库\n`);
}

const largeImages = categories.images.filter(f => f.size > 100 * 1024);
if (largeImages.length > 0) {
  console.log(`  ⚠️  发现 ${largeImages.length} 个超过 100KB 的图片文件，建议:`);
  console.log(`     - 压缩图片（使用 TinyPNG 或 ImageOptim）`);
  console.log(`     - 转换为 WebP 格式`);
  console.log(`     - 使用响应式图片（srcset）\n`);
}

const totalJsCount = categories.js.length;
if (totalJsCount > 20) {
  console.log(`  ⚠️  JS 文件数量过多 (${totalJsCount} 个)，建议:`);
  console.log(`     - 优化 manualChunks 配置`);
  console.log(`     - 合并小文件\n`);
}

// 打开分析报告
console.log('📊 详细分析报告已生成: dist/stats.html');
console.log('   在浏览器中打开查看详细的依赖关系树状图\n');

console.log('✅ 分析完成！\n');
