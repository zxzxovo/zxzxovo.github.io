import type { Plugin } from 'vite'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export function githubPagesSpaPlugin(): Plugin {
  return {
    name: 'github-pages-spa',
    apply: 'build',
    writeBundle() {
      try {
        const publicDir = resolve(process.cwd(), 'public')
        const distDir = resolve(process.cwd(), 'dist')
        
        const source404 = resolve(publicDir, '404.html')
        const target404 = resolve(distDir, '404.html')
        
        if (existsSync(source404)) {
          copyFileSync(source404, target404)
          console.log('✓ GitHub Pages SPA: 404.html copied to dist/')
        } else {
          console.warn('⚠️  GitHub Pages SPA: 404.html not found in public/')
        }
      } catch (error) {
        console.error('❌ GitHub Pages SPA plugin error:', error)
      }
    }
  }
}
