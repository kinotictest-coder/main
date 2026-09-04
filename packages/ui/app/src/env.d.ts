/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
    export default component
}

interface ImportMetaEnv {
    readonly VITE_KINOTIC_HOST?: string
    readonly VITE_KINOTIC_PORT?: string
    readonly VITE_KINOTIC_USE_SSL?: string
    readonly VITE_KINOTIC_EMAIL?: string
    readonly VITE_KINOTIC_PASSWORD?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
