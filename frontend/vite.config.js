import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/rdashboard',
  plugins: [react()],
  envDir: '..',
  server: {
    allowedHosts: ["server3.vivrepanelserp.xyz"],
    port: 5081,
    host: '0.0.0.0',
    proxy: {
      '/recruit_api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})