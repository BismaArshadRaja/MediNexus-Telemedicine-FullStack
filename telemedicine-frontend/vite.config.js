import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['dazzling-prosperity-production-a1fc.up.railway.app'],
  },
})