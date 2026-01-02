import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Define type for environment variables
interface ProcessEnv {
  [key: string]: string | undefined
}

// Only include environment variables that start with VITE_
const env = Object.entries(process.env as ProcessEnv).reduce<Record<string, string>>((acc, [key, value]) => {
  if (key.startsWith('VITE_') && value !== undefined) {
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
    host: '0.0.0.0',
    port: 5173,
    open: true,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      '/api/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/api/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/public': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    ...env,
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
