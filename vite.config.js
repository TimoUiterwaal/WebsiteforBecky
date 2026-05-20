import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(__dirname, 'src/pages'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:    resolve(__dirname, 'src/pages/index.html'),
        clicker: resolve(__dirname, 'src/pages/clicker.html'),
        memory:  resolve(__dirname, 'src/pages/memory.html'),
        rhythm:  resolve(__dirname, 'src/pages/rhythm.html'),
        trivia:  resolve(__dirname, 'src/pages/trivia.html'),
menu:    resolve(__dirname, 'src/pages/menu.html'),
        about:   resolve(__dirname, 'src/pages/about.html'),
      }
    }
  }
})
