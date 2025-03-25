import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';
import { fileURLToPath, URL } from 'node:url';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'https://github.com/sourman-dev/dichtruyen-ai-userscript',
        description: "Userscript hỗ trợ đọc dịch online các loại truyện convert, truyện tiếng nước ngoài bằng AI",
        author: "suppaman101@gmail.com",
        license: "MIT",
        source: "https://github.com/sourman-dev/dichtruyen-ai-userscript",
        supportURL: "https://github.com/sourman-dev/dichtruyen-ai-userscript/issues",
        match: ['*://*/*'],
        grant: ['GM.getValue', 'GM.setValue'],
        'inject-into': 'content',
      },
    }),
  ],
  build: {
    target: 'esnext',
    // minify: false, // Tắt minification
    // target: 'esnext',
    minify: 'terser',
    terserOptions: {
      keep_fnames: true, // Giữ nguyên tên hàm
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
        compact: true
      }
    }
  }
});
