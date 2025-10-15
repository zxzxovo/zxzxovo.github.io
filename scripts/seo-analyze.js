#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * SEO 分析工具
 * 分析生成的sitemap、检查meta标签配置等
 */

function analyzeSEO() {
  console.log('🔍 开始SEO分析...\n');

  const distDir = join(__dirname, '..', 'dist');
  const publicDir = join(__dirname, '..', 'public');

  // 检查关键文件
  checkFiles(distDir, publicDir);
  
  // 分析sitemap
  analyzeSitemap(distDir);
  
  // 分析robots.txt
  analyzeRobots(distDir);
  
  // 分析HTML meta标签
  analyzeIndexHTML(distDir);
  
  console.log('\n✅ SEO分析完成');
}

function checkFiles(distDir, publicDir) {
  console.log('📁 检查关键文件:');
  
  const requiredFiles = [
    { path: join(distDir, 'sitemap.xml'), name: 'XML Sitemap' },
    { path: join(distDir, 'sitemap.html'), name: 'HTML Sitemap' },
    { path: join(distDir, 'robots.txt'), name: 'Robots.txt' },
    { path: join(publicDir, 'posts.json'), name: 'Posts Data' },
    { path: join(publicDir, 'books.json'), name: 'Books Data' },
  ];

  requiredFiles.forEach(file => {
    if (existsSync(file.path)) {
      console.log(`   ✓ ${file.name} 存在`);
    } else {
      console.log(`   ✗ ${file.name} 缺失`);
    }
  });
  console.log();
}

function analyzeSitemap(distDir) {
  console.log('🗺️  分析Sitemap:');
  
  const sitemapPath = join(distDir, 'sitemap.xml');
  if (!existsSync(sitemapPath)) {
    console.log('   ✗ sitemap.xml 不存在');
    return;
  }

  const sitemapContent = readFileSync(sitemapPath, 'utf-8');
  const urlMatches = sitemapContent.match(/<url>/g);
  const urlCount = urlMatches ? urlMatches.length : 0;

  console.log(`   ✓ 包含 ${urlCount} 个URL`);

  // 检查优先级分布
  const priorities = sitemapContent.match(/<priority>([\d.]+)<\/priority>/g) || [];
  const priorityStats = {};
  priorities.forEach(p => {
    const priority = p.match(/>([\d.]+)</)[1];
    priorityStats[priority] = (priorityStats[priority] || 0) + 1;
  });

  console.log('   优先级分布:');
  Object.entries(priorityStats).forEach(([priority, count]) => {
    console.log(`     ${priority}: ${count} 个页面`);
  });

  // 检查更新频率
  const changefreqs = sitemapContent.match(/<changefreq>([^<]+)<\/changefreq>/g) || [];
  const freqStats = {};
  changefreqs.forEach(f => {
    const freq = f.match(/>([^<]+)</)[1];
    freqStats[freq] = (freqStats[freq] || 0) + 1;
  });

  console.log('   更新频率分布:');
  Object.entries(freqStats).forEach(([freq, count]) => {
    console.log(`     ${freq}: ${count} 个页面`);
  });
  console.log();
}

function analyzeRobots(distDir) {
  console.log('🤖 分析Robots.txt:');
  
  const robotsPath = join(distDir, 'robots.txt');
  if (!existsSync(robotsPath)) {
    console.log('   ✗ robots.txt 不存在');
    return;
  }

  const robotsContent = readFileSync(robotsPath, 'utf-8');
  
  // 检查关键指令
  const hasUserAgent = robotsContent.includes('User-agent:');
  const hasAllow = robotsContent.includes('Allow:');
  const hasSitemap = robotsContent.includes('Sitemap:');
  const hasDisallow = robotsContent.includes('Disallow:');

  console.log(`   ${hasUserAgent ? '✓' : '✗'} User-agent 指令`);
  console.log(`   ${hasAllow ? '✓' : '✗'} Allow 指令`);
  console.log(`   ${hasSitemap ? '✓' : '✗'} Sitemap 引用`);
  console.log(`   ${hasDisallow ? '✓' : '✗'} Disallow 指令`);

  // 检查sitemap URL
  const sitemapMatch = robotsContent.match(/Sitemap: (.+)/);
  if (sitemapMatch) {
    console.log(`   Sitemap URL: ${sitemapMatch[1]}`);
  }
  console.log();
}

function analyzeIndexHTML(distDir) {
  console.log('📄 分析Index.html Meta标签:');
  
  const indexPath = join(distDir, 'index.html');
  if (!existsSync(indexPath)) {
    console.log('   ✗ index.html 不存在');
    return;
  }

  const htmlContent = readFileSync(indexPath, 'utf-8');
  
  // 检查基础meta标签
  const metaChecks = [
    { tag: '<title>', name: 'Title标签' },
    { tag: 'name="description"', name: 'Description meta' },
    { tag: 'name="keywords"', name: 'Keywords meta' },
    { tag: 'name="author"', name: 'Author meta' },
    { tag: 'name="robots"', name: 'Robots meta' },
    { tag: 'property="og:title"', name: 'Open Graph Title' },
    { tag: 'property="og:description"', name: 'Open Graph Description' },
    { tag: 'property="og:image"', name: 'Open Graph Image' },
    { tag: 'property="og:url"', name: 'Open Graph URL' },
    { tag: 'name="twitter:card"', name: 'Twitter Card' },
    { tag: 'rel="canonical"', name: 'Canonical Link' },
  ];

  metaChecks.forEach(check => {
    const exists = htmlContent.includes(check.tag);
    console.log(`   ${exists ? '✓' : '✗'} ${check.name}`);
  });

  // 检查标题长度
  const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    const titleLength = titleMatch[1].length;
    console.log(`   Title长度: ${titleLength} 字符 ${titleLength > 60 ? '⚠️  (过长)' : titleLength < 30 ? '⚠️  (过短)' : '✓'}`);
  }

  // 检查description长度
  const descMatch = htmlContent.match(/name="description" content="([^"]+)"/);
  if (descMatch) {
    const descLength = descMatch[1].length;
    console.log(`   Description长度: ${descLength} 字符 ${descLength > 160 ? '⚠️  (过长)' : descLength < 120 ? '⚠️  (过短)' : '✓'}`);
  }
  console.log();
}

// 运行分析
analyzeSEO();
