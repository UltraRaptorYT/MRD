import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["@mediapipe/holistic"],
  },
  build: {
    commonjsOptions: {
      include: [/mediapipe/, /node_modules/],
    },
    rollupOptions: {
      output: {
        format: "esm",
      },
    },
  },
  esbuild: {
    keepNames: true,
  },
});
