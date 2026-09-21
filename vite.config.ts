/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // App shell 全部預先快取，離線時可以完整使用；
        // 沒有任何遠端 API，因此不需要 runtime caching。
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: '3 分鐘育兒紀錄',
        short_name: '育兒紀錄',
        description: '每天約 3 分鐘，簡單記錄孩子當天的照顧情況。資料只存在這台裝置。',
        lang: 'zh-Hant-TW',
        start_url: './index.html#/today',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F7F8F6',
        theme_color: '#6F8F87',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  build: {
    // 單一大 bundle 會讓每次改版都要重新下載整包；
    // 把幾乎不會變動的依賴切出來，PWA 更新時只需要抓應用程式碼。
    rollupOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router)/ },
            { name: 'data', test: /node_modules[\\/](dexie|zod|date-fns)/ },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
})
