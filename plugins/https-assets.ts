import type { Plugin } from 'vite'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export function httpsAssetsPlugin(): Plugin {
  return {
    name: 'https-assets',
    apply: 'build',
    writeBundle() {
      try {
        const distDir = resolve(process.cwd(), 'dist')
        const indexPath = resolve(distDir, 'index.html')
        
        // 读取index.html文件
        let indexContent = readFileSync(indexPath, 'utf-8')
        
        // 添加CSP meta标签来允许HTTPS资源
        const cspMeta = `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">`
        
        // 在第一个meta标签之前插入CSP meta标签
        indexContent = indexContent.replace(
          /(<meta charset="UTF-8" \/>)/i,
          `$1\n    ${cspMeta}`
        )
        
        // 写回文件
        writeFileSync(indexPath, indexContent, 'utf-8')
        
        console.log('✓ HTTPS Assets: Added CSP meta tag to upgrade insecure requests')
        
      } catch (error) {
        console.error('❌ HTTPS Assets plugin error:', error)
      }
    }
  }
}
