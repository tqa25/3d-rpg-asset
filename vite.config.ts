import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/3d-rpg-asset/' : '/',
  server: { host: true },
  build: { target: 'esnext' }
})
