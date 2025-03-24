import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';
import { fileURLToPath, URL } from 'node:url';
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // optimizeDeps: {
  //   exclude: ['worker_threads', 'os', 'child_process'],
  //   esbuildOptions: {
  //     target: ['es2020', 'safari11'],
  //     supported: { 
  //       bigint: true,
  //       'safari-15': true
  //     },
  //   }
  // },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
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
