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
    include: ["@mediapipe/hands"],
  },
  build: {
    commonjsOptions: {
      include: [/mediapipe/, /node_modules/],
    },
  },
  esbuild: {
    keepNames: true,
  },
});
