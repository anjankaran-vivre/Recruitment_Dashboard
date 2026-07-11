import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/rdashboard/',
  plugins: [react()],
  server: {
    allowedHosts: ["server3.vivrepanelserp.xyz"],
    port: 5081,
    host: '0.0.0.0',
    hmr: {
      protocol: 'wss',
      host: 'server3.vivrepanelserp.xyz',
      clientPort: 443,
      path: '/rdashboard/'
    },
    proxy: {
      '/api/recruit': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/recruit/, ''),
      },
    },
  },
})