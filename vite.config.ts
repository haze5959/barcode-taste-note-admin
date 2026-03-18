import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
    plugins: [
        react(),
        basicSsl()
    ],
    server: {
        proxy: {
            '/admin': {
                target: 'https://api.barnote.net',
                changeOrigin: true,
                secure: false,
            },
            '/products': {
                target: 'https://api.barnote.net',
                changeOrigin: true,
                secure: false,
            },
            '/notes': {
                target: 'https://api.barnote.net',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
