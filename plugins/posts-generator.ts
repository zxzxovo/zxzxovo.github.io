import { exec } from 'child_process';
import { promisify } from 'util';
import type { Plugin } from 'vite';

const execAsync = promisify(exec);

/**
 * 执行文章数据生成脚本
 */
async function generatePostsData() {
  try {
    console.log('🔄 开始生成文章数据...');
    const { stdout, stderr } = await execAsync('node scripts/generate-posts.js');
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
    console.log('✅ 文章数据生成完成');
  } catch (error) {
    console.error('❌ 生成文章数据失败:', error);
  }
}

/**
 * Vite插件：自动生成文章数据
 */
export function postsGeneratorPlugin(): Plugin {
  return {
    name: 'posts-generator',
    async buildStart() {
      // 在构建开始时生成文章数据
      console.log('\n📝 正在生成文章数据...');
      await generatePostsData();
    },
    configureServer(server) {
      // 在开发服务器启动时生成文章数据
      generatePostsData();
      
      // 监听posts目录的变化（包括markdown文件和图片文件）
      const chokidar = server.watcher;
      chokidar.add('src/posts/**/*'); // 监听所有文件，不仅仅是.md文件
      
      // 处理文件变化的通用函数
      const handleFileChange = async (path: string, action: string) => {
        if (path.includes('src/posts') && !path.includes('template')) {
          console.log(`\n📝 检测到文章${action}: ${path}`);
          console.log('🔄 重新生成文章数据...');
          await generatePostsData();
          
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
    }
  };
}
