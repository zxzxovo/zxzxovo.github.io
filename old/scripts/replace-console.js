// 批量替换控制台输出的脚本
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// 需要替换的文件扩展名
const targetExtensions = ['.vue', '.ts', '.js'];

// 排除的目录
const excludeDirs = ['node_modules', 'dist', '.git', 'plugins'];

// 替换规则
const replacements = [
  {
    from: /console\.log\(/g,
    to: 'devLog('
  },
  {
    from: /console\.warn\(/g,
    to: 'devWarn('
  },
  {
    from: /console\.error\(/g,
    to: 'devError('
  },
  {
    from: /console\.info\(/g,
    to: 'devLog('
  }
];

// 需要添加 import 的文件列表
const filesNeedingImport = [];

function processFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let hasChanges = false;
    
    // 应用替换规则
    for (const rule of replacements) {
      if (rule.from.test(content)) {
        content = content.replace(rule.from, rule.to);
        hasChanges = true;
      }
    }
    
    // 如果有变化且需要添加导入
    if (hasChanges) {
      // 检查是否已经有 logger 导入
      if (!content.includes('from \'@/utils/logger\'') && !content.includes('from \'../utils/logger\'') && !content.includes('./logger')) {
        filesNeedingImport.push(filePath);
      }
      
      // 写回文件
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ 已处理: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ 处理失败: ${filePath}`, error.message);
  }
}

function processDirectory(dirPath) {
  const items = readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = join(dirPath, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(item)) {
        processDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = item.substring(item.lastIndexOf('.'));
      if (targetExtensions.includes(ext)) {
        processFile(fullPath);
      }
    }
  }
}

console.log('🚀 开始批量替换控制台输出...');
processDirectory('./src');

console.log('\n📋 需要手动添加 logger 导入的文件:');
filesNeedingImport.forEach(file => {
  console.log(`   - ${file}`);
});

console.log('\n✅ 批量替换完成！');
