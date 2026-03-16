import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

function copyExtensionFiles() {
  const files = [
    'manifest.json', 'overlay.html', 'overlay.js', 'overlay.css',
    'auth.js', 'apex-config.js', 'content.js', 'popup.html', 'popup.css',
    'array.full.no-external.js', 'posthog-recorder.js',
  ]
  return {
    name: 'copy-extension-files',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true })
      files.forEach(function(file) {
        const src = path.resolve(__dirname, file)
        const dest = path.resolve(__dirname, 'dist', file)
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest)
          console.log('[apex-build] copied:', file)
        } else {
          console.warn('[apex-build] missing:', file)
        }
      })
      const iconsDir = path.resolve(__dirname, 'icons')
      const iconsDest = path.resolve(__dirname, 'dist/icons')
      if (fs.existsSync(iconsDir)) {
        if (!fs.existsSync(iconsDest)) fs.mkdirSync(iconsDest, { recursive: true })
        fs.readdirSync(iconsDir).forEach(function(file) {
          fs.copyFileSync(path.join(iconsDir, file), path.join(iconsDest, file))
        })
      }
    }
  }
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popout: path.resolve(__dirname, 'popout.js'),
        background: path.resolve(__dirname, 'background.js'),
      },
      output: { entryFileNames: '[name].js' },
    },
  },
  plugins: [copyExtensionFiles()],
})
