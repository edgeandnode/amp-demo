import react from "@vitejs/plugin-react"
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  root: "app",
  envDir: "..",
  plugins: [react(), tailwindcss(),],
  server: {
    proxy: {
      "/rpc": {
        target: "http://localhost:8545",
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rpc/, ""),
      },
      "/amp": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amp/, ""),
      },
    },
  },
})