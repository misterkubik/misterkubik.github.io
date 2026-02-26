import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves this build from /softgames/dist/
  base: '/softgames/dist/',
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
})
