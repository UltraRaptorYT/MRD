import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import terser from "@rollup/plugin-terser";

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
    rollupOptions: {
      plugins: [
        terser({
          keep_classnames: true,
          keep_fnames: true,
        }),
      ],
      output: {
        manualChunks(id) {
          if (id.includes("mediapipe")) {
            console.log("Mediapipe chunk detected:", id);
          }
        },
      },
    },
  },
  esbuild: {
    keepNames: true,
  },
});
