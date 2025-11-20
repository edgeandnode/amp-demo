/// <reference types="vite/client" />

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_AMP_QUERY_URL: string
  readonly VITE_AMP_QUERY_TOKEN: string | undefined
  readonly VITE_AMP_RPC_DATASET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}