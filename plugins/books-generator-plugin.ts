import type { Plugin } from 'vite';
import { generateBooksData } from './books-generator.ts';

/**
 * Vite插件：自动生成书籍数据
 */
export function booksGeneratorPlugin(): Plugin {
  return {
    name: 'books-generator',
    async buildStart() {
      // 在构建开始时生成书籍数据
      console.log('\n📚 正在生成书籍数据...');
      await generateBooksData();
    },
    configureServer(server) {
      // 在开发服务器启动时生成书籍数据
      generateBooksData();
      
      // 监听books目录的变化
      const chokidar = server.watcher;
      chokidar.add('src/books/**/*'); // 监听所有文件
      
      // 处理文件变化的通用函数
      const handleFileChange = async (path: string, action: string) => {
        if (path.includes('src/books')) {
          console.log(`\n📚 检测到书籍${action}: ${path}`);
          console.log('🔄 重新生成书籍数据...');
          await generateBooksData();
          
          // 通知浏览器刷新
          server.ws.send({
            type: 'full-reload'
          });
        }
      };
      
      chokidar.on('change', (path) => {
        handleFileChange(path, '变化');
      });
      
      chokidar.on('add', (path) => {
        handleFileChange(path, '添加');
      });
      
      chokidar.on('unlink', (path) => {
        handleFileChange(path, '删除');
      });

      // 提供手动生成书籍数据的端点
      server.middlewares.use('/generate-books', async (_req, res, _next) => {
        try {
          await generateBooksData();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, message: '书籍数据生成完成' }));
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : '未知错误' 
          }));
        }
      });
    }
  };
}
