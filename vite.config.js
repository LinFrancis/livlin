import { defineConfig } from 'vite'
export default defineConfig({
  base: '/',
  build: { rollupOptions: { input: { main: 'index.html', servicios:'servicios.html', sobre:'sobre.html' } } }
})