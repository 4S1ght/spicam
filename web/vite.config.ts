import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        svelte({
            compilerOptions: {
                runes: true,
            },
            onwarn(warning, handler) {
                // ignore unused CSS selector warnings
                if (warning.code === 'css_unused_selector') return
                handler(warning)
            }
        })
    ],
    server: {
        allowedHosts: true,
        proxy: {
            '/api': {
                target: 'http://pi.local/',
                changeOrigin: true,
            },
        },
    }
})
