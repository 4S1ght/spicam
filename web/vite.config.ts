import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        svelte({
            compilerOptions: {
                runes: true
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
