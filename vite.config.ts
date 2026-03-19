import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
    base: '/admin/',
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
                bypass(req) {
                    const url = req.url ?? '';
                    const accept = req.headers?.accept ?? '';

                    // HTML 페이지 요청 (navigation) → bypass
                    if (accept.includes('text/html')) return url;

                    // Vite 내부 경로 (@vite/client, @react-refresh 등) → bypass
                    if (url.includes('@vite') || url.includes('@react-refresh')) return url;

                    // JS/TS/CSS/이미지 등 정적 리소스 요청 → bypass
                    if (/\.(tsx?|jsx?|css|svg|png|jpg|ico|woff2?)(\?.*)?$/.test(url)) return url;

                    // node_modules 소스맵 등 → bypass
                    if (url.includes('node_modules')) return url;
                },
            },
            '/dashboard': {
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
