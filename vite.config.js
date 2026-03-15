import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popout: path.resolve(__dirname, 'popout.js'),
        background: path.resolve(__dirname, 'background.js'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
