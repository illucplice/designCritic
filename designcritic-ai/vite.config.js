import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @vitejs/plugin-react configures the automatic JSX runtime (so files using
// JSX don't need `import React from "react"` in scope) and enables Fast
// Refresh in dev. Without it, Vite's raw esbuild JSX handling falls back to
// the classic transform (`React.createElement(...)`) without ever actually
// importing `react`'s default export anywhere — which compiles fine but
// throws "ReferenceError: React is not defined" at runtime in the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
