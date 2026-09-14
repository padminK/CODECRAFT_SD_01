import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listens on all local IPs (0.0.0.0 and ::)
    port: 5173,
    allowedHosts: true, // allows tunnels like localtunnel, cloudflare, ngrok
  },
})
