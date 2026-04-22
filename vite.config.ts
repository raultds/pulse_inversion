import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/yahoo1": {
        target: "https://query1.finance.yahoo.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo1/, ""),
        headers: {
          referer: "https://finance.yahoo.com/",
          origin: "https://finance.yahoo.com",
        },
      },
      "/api/yahoo2": {
        target: "https://query2.finance.yahoo.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo2/, ""),
        headers: {
          referer: "https://finance.yahoo.com/",
          origin: "https://finance.yahoo.com",
        },
      },
      "/api/openfigi": {
        target: "https://api.openfigi.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/openfigi/, ""),
      },
      "/api/finnhub": {
        target: "https://finnhub.io/api/v1",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/finnhub/, ""),
      },
      "/api/frankfurter": {
        target: "https://api.frankfurter.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/frankfurter/, ""),
      },
    },
  },
  preview: {
    proxy: {
      "/api/yahoo1": {
        target: "https://query1.finance.yahoo.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo1/, ""),
        headers: {
          referer: "https://finance.yahoo.com/",
          origin: "https://finance.yahoo.com",
        },
      },
      "/api/yahoo2": {
        target: "https://query2.finance.yahoo.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo2/, ""),
        headers: {
          referer: "https://finance.yahoo.com/",
          origin: "https://finance.yahoo.com",
        },
      },
      "/api/openfigi": {
        target: "https://api.openfigi.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/openfigi/, ""),
      },
      "/api/finnhub": {
        target: "https://finnhub.io/api/v1",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/finnhub/, ""),
      },
      "/api/frankfurter": {
        target: "https://api.frankfurter.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/frankfurter/, ""),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts")) {
            return "charts";
          }

          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
