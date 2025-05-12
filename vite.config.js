import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export default defineConfig({
  base:'./view_truth_front/',
  plugins: [vue()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'ant-design-vue/es': 'ant-design-vue/lib',
    }
  }
})

// 這是Vite的配置文件。
// 它使用Vue插件,設置了開發服務器的端口,
// 並定義了一個別名'@'指向src目錄,方便導入。