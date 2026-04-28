/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_PROVIDER: string
  readonly VITE_AI_API_KEY: string
  readonly VITE_AI_MODEL: string
  // 兼容旧版本
  readonly VITE_ARK_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
