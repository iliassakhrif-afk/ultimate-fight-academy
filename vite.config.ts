import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base "/ultimate-fight-academy/" en build (GitHub Pages project site), "/" en dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ultimate-fight-academy/' : '/',
  plugins: [react()],
}))
