import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Only include environment variables that start with VITE_
const env = Object.entries(process.env).reduce((acc, [key, value]) => {
  if (key.startsWith('VITE_')) {
    acc[`process.env.${key}`] = JSON.stringify(value)
  }
  return acc
}, {})

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  define: {
    ...env,
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
