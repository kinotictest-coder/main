import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// The domain package resolves to its TypeScript source in this repo (its `development`
// export condition), so the alias points straight at the barrel — no prior build needed.
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@main/domain': fileURLToPath(new URL('../../domain/index.ts', import.meta.url)),
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 5273,
    },
})
